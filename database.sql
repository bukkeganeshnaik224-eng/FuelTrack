-- Fuel Consumption Analysis System
-- Run this script in MySQL Workbench or the MySQL command line.

CREATE DATABASE IF NOT EXISTS fuel_analysis;
USE fuel_analysis;

CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_code VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type VARCHAR(40) NOT NULL,
    fuel_type VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS fuel_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    fill_date DATE NOT NULL,
    odometer_km DECIMAL(10, 2) NOT NULL,
    litres DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    full_tank_flag BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_fuel_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
    CONSTRAINT chk_litres_positive CHECK (litres > 0),
    CONSTRAINT chk_cost_nonnegative CHECK (total_cost >= 0),
    CONSTRAINT chk_odometer_nonnegative CHECK (odometer_km >= 0)
);

INSERT IGNORE INTO vehicles (vehicle_code, vehicle_type, fuel_type)
VALUES
('BIKE01', 'Motorcycle', 'Petrol'),
('CAR01', 'Car', 'Petrol'),
('CAR02', 'Car', 'Diesel');

-- Example records. Odometer readings increase for each vehicle.
INSERT INTO fuel_records
(vehicle_id, fill_date, odometer_km, litres, total_cost, full_tank_flag)
SELECT vehicle_id, '2026-01-05', 10000, 8, 880, TRUE
FROM vehicles WHERE vehicle_code = 'BIKE01'
AND NOT EXISTS (
    SELECT 1 FROM fuel_records r
    WHERE r.vehicle_id = vehicles.vehicle_id AND r.fill_date = '2026-01-05'
);

INSERT INTO fuel_records
(vehicle_id, fill_date, odometer_km, litres, total_cost, full_tank_flag)
SELECT vehicle_id, '2026-01-12', 10240, 7, 770, TRUE
FROM vehicles WHERE vehicle_code = 'BIKE01'
AND NOT EXISTS (
    SELECT 1 FROM fuel_records r
    WHERE r.vehicle_id = vehicles.vehicle_id AND r.fill_date = '2026-01-12'
);

INSERT INTO fuel_records
(vehicle_id, fill_date, odometer_km, litres, total_cost, full_tank_flag)
SELECT vehicle_id, '2026-01-08', 25000, 20, 2200, TRUE
FROM vehicles WHERE vehicle_code = 'CAR01'
AND NOT EXISTS (
    SELECT 1 FROM fuel_records r
    WHERE r.vehicle_id = vehicles.vehicle_id AND r.fill_date = '2026-01-08'
);

INSERT INTO fuel_records
(vehicle_id, fill_date, odometer_km, litres, total_cost, full_tank_flag)
SELECT vehicle_id, '2026-01-18', 25320, 22, 2420, TRUE
FROM vehicles WHERE vehicle_code = 'CAR01'
AND NOT EXISTS (
    SELECT 1 FROM fuel_records r
    WHERE r.vehicle_id = vehicles.vehicle_id AND r.fill_date = '2026-01-18'
);
