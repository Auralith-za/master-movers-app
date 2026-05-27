import pandas as pd
import numpy as np

def clean_and_dump_excel(file_path):
    print(f"=== READING EXCEL: {file_path} ===")
    xl = pd.ExcelFile(file_path)
    for sheet_name in xl.sheet_names:
        print(f"\n--- SHEET: {sheet_name} ---")
        df = pd.read_excel(file_path, sheet_name=sheet_name)
        # Drop completely empty rows and columns
        df = df.dropna(how='all').dropna(how='all', axis=1)
        # Display nicely
        print(df.to_string(index=False))

clean_and_dump_excel('WORKINGS FOR CURT APP PRICING.xlsx 20-05-2026.xlsx')
clean_and_dump_excel('Additional items to rooms with volumes.xlsx')
