# Fuel Consumption Analysis System

## About this project
This beginner-level project stores vehicle fuel purchases and helps calculate distance, mileage and fuel expenses. It uses Python, Flask, MySQL, Pandas, NumPy and Matplotlib.

## Files
- `main.py` — runs a small example calculation.
- `app.py` — Flask API for adding and viewing vehicles and fuel records.
- `database.sql` — creates the MySQL database and adds sample records.
- `calculations.py` — distance, mileage and cost-per-kilometre functions.
- `analysis.py` — creates vehicle, monthly and invalid-reading reports.
- `charts.py` — saves charts as PNG images.
- `reports/` — generated reports and chart images are stored here.

## 1. Install Python libraries
Open Command Prompt in this folder and run:

```bash
python -m pip install -r requirements.txt
```

## 2. Create the MySQL database
1. Open MySQL Workbench.
2. Open `database.sql`.
3. Run the whole script.
4. Check that the `fuel_analysis` database and its two tables exist.

## 3. Set database login details
The program reads login details from environment variables. In Windows Command Prompt, set them for the current terminal:

```bat
set DB_HOST=localhost
set DB_USER=root
set DB_PASSWORD=your_mysql_password
set DB_NAME=fuel_analysis
```

Replace `your_mysql_password` with your own MySQL password. Do not share or upload your password.

## 4. Run the example calculation
```bash
python main.py
```

## 5. Start the Flask API
```bash
python app.py
```
Then open `http://127.0.0.1:5000/` in your browser. Use a REST client such as Postman to send POST requests.

### Add a vehicle
POST `http://127.0.0.1:5000/vehicles`

JSON body:
```json
{
  "vehicle_code": "BIKE02",
  "vehicle_type": "Motorcycle",
  "fuel_type": "Petrol"
}
```

### View vehicles
GET `http://127.0.0.1:5000/vehicles`

### View fuel records
GET `http://127.0.0.1:5000/fuel-records`

### Add a fuel record
POST `http://127.0.0.1:5000/fuel-records`

Use a real `vehicle_id` returned by the vehicles route. The odometer reading and date should be later than the vehicle's latest saved record.

```json
{
  "vehicle_id": 1,
  "fill_date": "2026-02-01",
  "odometer_km": 10480,
  "litres": 7.5,
  "total_cost": 825,
  "full_tank_flag": true
}
```

## 6. Create reports and charts
With MySQL running and the environment variables set in the same Command Prompt:

```bash
python analysis.py
python charts.py
```

Open the `reports` folder to see the CSV reports and PNG charts.

## Important note about mileage
A basic mileage estimate is distance travelled divided by litres filled. It is most dependable when the records represent a full-tank-to-full-tank interval. A partial fill may not replace all the fuel used since the previous reading, so the result can be misleading. The report only calculates mileage for consecutive records marked as full-tank.

## Validation included
- Litres must be greater than zero.
- Cost and odometer reading cannot be negative.
- Vehicle code must be unique.
- Odometer readings must move forward.
- SQL values are sent using parameters instead of being joined into SQL text.

## Troubleshooting
- If MySQL connection fails, check that the MySQL server is running and the login details are correct.
- If a package is missing, run `python -m pip install -r requirements.txt` again.
- If a mileage chart has no bars, check whether there are two consecutive full-tank records for a vehicle.
