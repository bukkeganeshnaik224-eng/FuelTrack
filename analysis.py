# Make simple reports from the fuel_records table using Pandas.

import os
import pandas as pd
import mysql.connector


def get_data():
    connection = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "fuel_analysis")
    )
    try:
        query = """
            SELECT v.vehicle_code, r.fill_date, r.odometer_km,
                   r.litres, r.total_cost, r.full_tank_flag
            FROM fuel_records r
            JOIN vehicles v ON v.vehicle_id = r.vehicle_id
            ORDER BY v.vehicle_code, r.fill_date, r.record_id
        """
        return pd.read_sql(query, connection)
    finally:
        connection.close()


def make_reports():
    data = get_data()
    if data.empty:
        print("No fuel records found. Add some records first.")
        return

    data["fill_date"] = pd.to_datetime(data["fill_date"])
    data["month"] = data["fill_date"].dt.to_period("M").astype(str)

    # Calculate distance from the previous odometer reading for each vehicle.
    data["previous_odometer"] = data.groupby("vehicle_code")["odometer_km"].shift(1)
    data["distance_km"] = data["odometer_km"] - data["previous_odometer"]

    # Mileage is shown only for a full-tank interval between two full-tank records.
    data["previous_full_tank"] = data.groupby("vehicle_code")["full_tank_flag"].shift(1)
    valid_full_tank = (
        data["full_tank_flag"].astype(bool)
        & data["previous_full_tank"].fillna(False).astype(bool)
        & data["distance_km"].gt(0)
        & data["litres"].gt(0)
    )
    data["mileage_km_per_litre"] = None
    data.loc[valid_full_tank, "mileage_km_per_litre"] = (
        data.loc[valid_full_tank, "distance_km"] / data.loc[valid_full_tank, "litres"]
    )

    os.makedirs("reports", exist_ok=True)
    data.to_csv("reports/fuel_records_report.csv", index=False)

    vehicle_summary = data.groupby("vehicle_code", as_index=False).agg(
        total_litres=("litres", "sum"),
        total_fuel_cost=("total_cost", "sum"),
        records=("fill_date", "count")
    )
    mileage_summary = (
        data.groupby("vehicle_code")["mileage_km_per_litre"]
        .mean().reset_index()
    )
    vehicle_summary = vehicle_summary.merge(mileage_summary, on="vehicle_code", how="left")
    vehicle_summary.to_csv("reports/vehicle_summary.csv", index=False)

    monthly_summary = data.groupby("month", as_index=False).agg(
        total_litres=("litres", "sum"),
        total_fuel_cost=("total_cost", "sum"),
        records=("fill_date", "count")
    )
    monthly_summary.to_csv("reports/monthly_summary.csv", index=False)

    invalid = data[
        data["distance_km"].notna()
        & (data["distance_km"] <= 0)
    ]
    invalid.to_csv("reports/invalid_readings.csv", index=False)

    print("Reports saved in the reports folder.")
    print("\nVehicle-wise summary:")
    print(vehicle_summary.to_string(index=False))
    print("\nMonthly fuel expense:")
    print(monthly_summary.to_string(index=False))
    print(f"\nInvalid odometer intervals found: {len(invalid)}")


if __name__ == "__main__":
    make_reports()
