# Create simple charts from the CSV reports made by analysis.py.

import os
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Allows charts to be saved without opening a chart window.
import matplotlib.pyplot as plt


def create_charts():
    os.makedirs("reports", exist_ok=True)
    summary_file = "reports/vehicle_summary.csv"
    monthly_file = "reports/monthly_summary.csv"

    if not os.path.exists(summary_file) or not os.path.exists(monthly_file):
        print("First run analysis.py to create the report files.")
        return

    vehicles = pd.read_csv(summary_file)
    monthly = pd.read_csv(monthly_file)

    if not vehicles.empty:
        chart_data = vehicles.dropna(subset=["mileage_km_per_litre"])
        if not chart_data.empty:
            plt.figure(figsize=(8, 5))
            plt.bar(chart_data["vehicle_code"], chart_data["mileage_km_per_litre"])
            plt.title("Average Fuel Mileage by Vehicle")
            plt.xlabel("Vehicle")
            plt.ylabel("Mileage (km per litre)")
            plt.tight_layout()
            plt.savefig("reports/vehicle_mileage.png", dpi=150)
            plt.close()

    if not monthly.empty:
        plt.figure(figsize=(8, 5))
        plt.plot(monthly["month"], monthly["total_fuel_cost"], marker="o", label="Fuel cost")
        plt.title("Monthly Fuel Expenses")
        plt.xlabel("Month")
        plt.ylabel("Fuel cost (Rs.)")
        plt.legend()
        plt.xticks(rotation=30)
        plt.tight_layout()
        plt.savefig("reports/monthly_fuel_cost.png", dpi=150)
        plt.close()

    print("Charts saved in the reports folder, where data was available.")


if __name__ == "__main__":
    create_charts()
