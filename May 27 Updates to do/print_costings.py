import pandas as pd
import numpy as np

excel_file = 'May 27 Updates to do /WORKINGS FOR CURT APP PRICING.xlsx 20-05-2026.xlsx'
xl = pd.ExcelFile(excel_file)

for sheet_name in xl.sheet_names:
    print(f"\n==================================================")
    print(f"SHEET: {sheet_name}")
    print(f"==================================================")
    df = pd.read_excel(excel_file, sheet_name=sheet_name)
    # Drop rows that are completely NaN
    df = df.dropna(how='all')
    # Print it row by row to see everything
    for idx, row in df.iterrows():
        # Keep non-nan values
        items = []
        for col_name, val in row.items():
            if pd.notna(val):
                items.append(f"{col_name}: {val}")
        if items:
            print(f"Row {idx}: " + " | ".join(items))
