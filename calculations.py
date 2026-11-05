# Basic calculations used by the project.
# These functions are kept in one file so they can be reused.

import numpy as np


def calculate_distance(previous_reading, current_reading):
    """Return distance between two odometer readings."""
    if previous_reading is None or current_reading is None:
        return None
    if current_reading <= previous_reading:
        return None
    return current_reading - previous_reading


def calculate_mileage(distance_km, litres):
    """Calculate kilometres travelled per litre of fuel."""
    if distance_km is None or litres is None or litres <= 0:
        return None
    return float(np.divide(distance_km, litres))


def calculate_cost_per_km(total_cost, distance_km):
    """Calculate fuel cost for each kilometre travelled."""
    if total_cost is None or distance_km is None or distance_km <= 0:
        return None
    return float(np.divide(total_cost, distance_km))


def average_mileage(values):
    """Return average of available mileage values."""
    valid_values = [value for value in values if value is not None and value > 0]
    if not valid_values:
        return None
    return float(np.mean(valid_values))
