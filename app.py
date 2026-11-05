
import os
import logging
from datetime import date

import mysql.connector
from mysql.connector import Error

from flask import Flask, jsonify, request

app = Flask(__name__)

# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

logging.basicConfig(level=logging.INFO)

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "fuel_analysis"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "connection_timeout": 5
}


# --------------------------------------------------
# CORS CONFIGURATION FOR REACT FRONTEND
# --------------------------------------------------

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


# --------------------------------------------------
# DATABASE CONNECTION
# --------------------------------------------------

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)


def close_database(connection=None, cursor=None):
    if cursor is not None:
        cursor.close()

    if connection is not None and connection.is_connected():
        connection.close()


def error_response(message, status_code):
    return jsonify({"error": message}), status_code


# --------------------------------------------------
# HOME API
# --------------------------------------------------

@app.get("/")
def home():
    return jsonify({
        "message": "Fuel Consumption Analysis System API",
        "status": "Running",
        "routes": [
            "/vehicles",
            "/fuel-records"
        ]
    })


# --------------------------------------------------
# DATABASE HEALTH CHECK
# --------------------------------------------------

@app.get("/health")
def health():
    connection = None

    try:
        connection = get_connection()

        return jsonify({
            "status": "Connected",
            "database": DB_CONFIG["database"],
            "message": "MySQL connection successful"
        })

    except Error:
        logging.exception("MySQL health check failed")

        return error_response(
            "MySQL connection failed. Check database credentials and server.",
            500
        )

    finally:
        close_database(connection)


# --------------------------------------------------
# GET ALL VEHICLES
# --------------------------------------------------

@app.get("/vehicles")
def list_vehicles():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                vehicle_id,
                vehicle_code,
                vehicle_type,
                fuel_type
            FROM vehicles
            ORDER BY vehicle_code
        """)

        vehicles = cursor.fetchall()

        return jsonify(vehicles)

    except Error:
        logging.exception("Could not read vehicles")

        return error_response(
            "Could not read vehicles. Check MySQL configuration.",
            500
        )

    finally:
        close_database(connection, cursor)


# --------------------------------------------------
# ADD NEW VEHICLE
# --------------------------------------------------

@app.post("/vehicles")
def add_vehicle():
    data = request.get_json(silent=True) or {}

    code = str(data.get("vehicle_code", "")).strip()
    vehicle_type = str(data.get("vehicle_type", "")).strip()
    fuel_type = str(data.get("fuel_type", "")).strip()

    if not code or not vehicle_type or not fuel_type:
        return error_response(
            "Vehicle code, vehicle type and fuel type are required.",
            400
        )

    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO vehicles
            (vehicle_code, vehicle_type, fuel_type)
            VALUES (%s, %s, %s)
        """, (code, vehicle_type, fuel_type))

        connection.commit()

        return jsonify({
            "message": "Vehicle added successfully",
            "vehicle_id": cursor.lastrowid
        }), 201

    except Error as exc:
        if connection and connection.is_connected():
            connection.rollback()

        logging.exception("Could not add vehicle")

        if getattr(exc, "errno", None) == 1062:
            return error_response(
                "This vehicle code already exists.",
                409
            )

        return error_response(
            "Could not save vehicle. Check database configuration.",
            500
        )

    finally:
        close_database(connection, cursor)


# --------------------------------------------------
# GET ALL FUEL RECORDS
# --------------------------------------------------

@app.get("/fuel-records")
def list_fuel_records():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                r.record_id,
                r.vehicle_id,
                v.vehicle_code,
                v.vehicle_type,
                v.fuel_type,
                r.fill_date,
                r.odometer_km,
                r.litres,
                r.total_cost,
                r.full_tank_flag
            FROM fuel_records r
            JOIN vehicles v
                ON v.vehicle_id = r.vehicle_id
            ORDER BY r.fill_date DESC, r.record_id DESC
        """)

        records = cursor.fetchall()

        # Convert dates and decimal values into JSON-friendly values.
        for record in records:
            if record["fill_date"]:
                record["fill_date"] = record["fill_date"].isoformat()

            for field in ("odometer_km", "litres", "total_cost"):
                if record[field] is not None:
                    record[field] = float(record[field])

            record["full_tank_flag"] = bool(record["full_tank_flag"])

        return jsonify(records)

    except Error:
        logging.exception("Could not read fuel records")

        return error_response(
            "Could not read fuel records. Check MySQL configuration.",
            500
        )

    finally:
        close_database(connection, cursor)


# --------------------------------------------------
# ADD NEW FUEL RECORD
# --------------------------------------------------

@app.post("/fuel-records")
def add_fuel_record():
    data = request.get_json(silent=True) or {}

    required = [
        "vehicle_id",
        "fill_date",
        "odometer_km",
        "litres",
        "total_cost"
    ]

    missing = [
        field for field in required
        if field not in data
    ]

    if missing:
        return error_response(
            "Missing fields: " + ", ".join(missing),
            400
        )

    try:
        vehicle_id = int(data["vehicle_id"])
        fill_date = date.fromisoformat(str(data["fill_date"]))

        odometer = float(data["odometer_km"])
        litres = float(data["litres"])
        cost = float(data["total_cost"])

    except (ValueError, TypeError):
        return error_response(
            "Invalid date or numeric values.",
            400
        )

    full_tank = data.get("full_tank_flag", True)

    if not isinstance(full_tank, bool):
        return error_response(
            "full_tank_flag must be true or false.",
            400
        )

    if (
        vehicle_id <= 0
        or odometer < 0
        or litres <= 0
        or cost < 0
    ):
        return error_response(
            "Invalid vehicle ID, odometer, litres or cost.",
            400
        )

    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        # Check whether vehicle exists.
        cursor.execute(
            "SELECT vehicle_id FROM vehicles WHERE vehicle_id = %s",
            (vehicle_id,)
        )

        if cursor.fetchone() is None:
            return error_response(
                "Vehicle not found.",
                404
            )

        # Get latest record for this vehicle.
        cursor.execute("""
            SELECT fill_date, odometer_km
            FROM fuel_records
            WHERE vehicle_id = %s
            ORDER BY fill_date DESC, record_id DESC
            LIMIT 1
        """, (vehicle_id,))

        previous = cursor.fetchone()

        if previous:
            if fill_date < previous["fill_date"]:
                return error_response(
                    "Fill date cannot be earlier than the latest record.",
                    400
                )

            if odometer <= float(previous["odometer_km"]):
                return error_response(
                    "Odometer must be greater than the previous reading.",
                    400
                )

        cursor.execute("""
            INSERT INTO fuel_records (
                vehicle_id,
                fill_date,
                odometer_km,
                litres,
                total_cost,
                full_tank_flag
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            vehicle_id,
            fill_date,
            odometer,
            litres,
            cost,
            full_tank
        ))

        connection.commit()

        return jsonify({
            "message": "Fuel record added successfully",
            "record_id": cursor.lastrowid
        }), 201

    except Error:
        if connection and connection.is_connected():
            connection.rollback()

        logging.exception("Could not add fuel record")

        return error_response(
            "Could not save fuel record. Check MySQL configuration.",
            500
        )

    finally:
        close_database(connection, cursor)


# --------------------------------------------------
# RUN FLASK SERVER
# --------------------------------------------------

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )
