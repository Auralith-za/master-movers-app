import pandas as pd
import numpy as np

excel_file = 'May 27 Updates to do /WORKINGS FOR CURT APP PRICING.xlsx 20-05-2026.xlsx'
df = pd.read_excel(excel_file, sheet_name='Jose')

# Print out columns and values of interest from Jose tab
print("=== NATIONAL COSTING (Standard Vehicle: Link) ===")
# National costing is rows 2-10, columns 0-4 (Route, vehicle, volume, Rate Per Cubic feet, Min Charge)
for idx in range(2, 11):
    row = df.iloc[idx]
    route = row[0]
    vehicle = row[1]
    vol = row[2]
    rate = row[3]
    min_chg = row[4]
    print(f"Route: {route} | Vehicle: {vehicle} | Volume: {vol} | Rate/cuft: {rate} | MinCharge: {min_chg}")

print("\n=== ADDITIONAL COSTS (Flat Rates) ===")
# Additional costs are rows 2-6, columns 7-11
for idx in range(2, 7):
    row = df.iloc[idx]
    service = row[7]
    formula = row[10]
    rate = row[11]
    print(f"Service: {service} | Formula: {formula} | Rate: {rate}")

print("\n=== LOCAL COSTING: JHB ===")
# Local Costing JHB is rows 19-28, columns 0-5
for idx in range(19, 29):
    row = df.iloc[idx]
    vehicle = row[1]
    vol = row[2]
    rate_cube = row[3]
    rate_km = row[4]
    min_val = row[5]
    print(f"Vehicle: {vehicle} | Volume: {vol} | Rate/Cube: {rate_cube} | Rate/Km: {rate_km} | Min: {min_val}")

print("\n=== LOCAL COSTING: GR ===")
# Local Costing GR is rows 19-22, columns 7-12
for idx in range(19, 23):
    row = df.iloc[idx]
    vehicle = row[8]
    vol = row[9]
    rate_cube = row[10]
    rate_km = row[11]
    flat_rate = row[12]
    print(f"Vehicle: {vehicle} | Volume: {vol} | Rate/Cube: {rate_cube} | Rate/Km: {rate_km} | FlatRate: {flat_rate}")

print("\n=== LOCAL COSTING: CPT ===")
# Local Costing CPT is rows 35-40, columns 0-5
for idx in range(35, 41):
    row = df.iloc[idx]
    vehicle = row[1]
    vol = row[2]
    rate_cube = row[3]
    rate_km = row[4]
    flat_rate = row[5]
    print(f"Vehicle: {vehicle} | Volume: {vol} | Rate/Cube: {rate_cube} | Rate/Km: {rate_km} | FlatRate: {flat_rate}")

print("\n=== LOCAL COSTING: DBN ===")
# Local Costing DBN is rows 35-39, columns 7-12
for idx in range(35, 40):
    row = df.iloc[idx]
    vehicle = row[8]
    vol = row[9]
    rate_cube = row[10]
    rate_km = row[11]
    flat_rate = row[12]
    print(f"Vehicle: {vehicle} | Volume: {vol} | Rate/Cube: {rate_cube} | Rate/Km: {rate_km} | FlatRate: {flat_rate}")

print("\n=== PACKAGING (Client Packing Own) ===")
# rows 49-51, columns 10-11
for idx in range(49, 52):
    row = df.iloc[idx]
    type_box = row[10]
    rate = row[11]
    print(f"Box: {type_box} | Rate: {rate}")

print("\n=== PACKAGING (Boxes + Packing) ===")
# rows 57-59, columns 10-11
for idx in range(57, 60):
    row = df.iloc[idx]
    type_box = row[10]
    rate = row[11]
    print(f"Box: {type_box} | Rate: {rate}")

print("\n=== ADDITIONAL NOTES ===")
# rows 64-65, columns 7-10
for idx in range(64, 66):
    row = df.iloc[idx]
    note_type = row[7]
    desc = row[10]
    print(f"{note_type}: {desc}")
