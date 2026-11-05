# Simple fuel calculations using sample records
# Run this file to see how mileage and fuel cost are calculated.

from calculations import calculate_distance, calculate_mileage, calculate_cost_per_km

previous_reading = 12000
current_reading = 12300
litres = 15
total_cost = 1600

distance = calculate_distance(previous_reading, current_reading)
mileage = calculate_mileage(distance, litres)
cost_per_km = calculate_cost_per_km(total_cost, distance)

print("Fuel Consumption Analysis System")
print("--------------------------------")
print(f"Distance travelled: {distance} km")
print(f"Mileage: {mileage:.2f} km/litre")
print(f"Fuel cost per kilometre: Rs. {cost_per_km:.2f}")
print()
print("Note: This sample calculation is most useful when the readings")
print("belong to a suitable full-tank interval. Partial fills can make")
print("the mileage estimate less accurate.")
