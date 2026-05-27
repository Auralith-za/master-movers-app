import re
import json
import pandas as pd

# Load mockItems.js
with open('src/features/inventory/data/mockItems.js', 'r') as f:
    js_content = f.read()

# Parse JS objects using a simple regex since they are formatted nicely
items_text = re.search(r'export const INVENTORY_ITEMS = \[(.*?)^\s*\];', js_content, re.DOTALL | re.MULTILINE).group(1)
# Each item is { ... }
item_blocks = re.findall(r'\{\s*.*?\s*\}', items_text, re.DOTALL)

mock_items = []
for block in item_blocks:
    # Convert JS object-like string to JSON
    # Replace single quotes, property names without quotes if any, trailing commas, etc.
    # Fortunately, the file is formatted as valid JSON inside curly braces except for comments/formatting
    # Let's clean it up:
    cleaned = block
    # Remove trailing commas before closing braces
    cleaned = re.sub(r',\s*\}', '}', cleaned)
    cleaned = re.sub(r',\s*\]', ']', cleaned)
    try:
        item = json.loads(cleaned)
        mock_items.append(item)
    except Exception as e:
        # print("Failed to parse block:", cleaned, e)
        pass

print(f"Loaded {len(mock_items)} items from mockItems.js")

# Load Additional items Excel
excel_file = 'May 27 Updates to do /Additional items to rooms with volumes.xlsx'
df = pd.read_excel(excel_file, sheet_name='Room Volumes')

current_category = None
excel_items = []
for idx, row in df.iterrows():
    room = row['Room']
    volume = row['Volume (m³)']
    if pd.isna(room):
        continue
    # If volume is NaN, it's a category header
    if pd.isna(volume):
        current_category = room.strip()
        continue
    
    excel_items.append({
        'name': room.strip(),
        'volume': float(volume),
        'excel_category': current_category
    })

print(f"Loaded {len(excel_items)} items from Excel")

# Map excel categories to mockItems categories
# mockItems categories: ["Special Handling Items","Lounge / Living Room","Dining Room","Bedrooms","Appliances","Office / Study","General Furniture","Outdoor & Patio","Boxes & Loose Items"]
category_mapping = {
    'OFFICE/STUDY': 'Office / Study',
    'LOUNGE/LIVING ROOM': 'Lounge / Living Room',
    'DINING ROOM': 'Dining Room',
    'PASSAGE/ENTRANCE': 'Lounge / Living Room', # or General Furniture? Let's check where it fits.
    'BEDROOMS': 'Bedrooms',
    'GENERAL FURNITURE': 'General Furniture'
}

# Compare
missing_items = []
matching_items = []
different_volumes = []

mock_names_map = {item['name'].upper().strip(): item for item in mock_items}

for e_item in excel_items:
    name_upper = e_item['name'].upper()
    matched = mock_names_map.get(name_upper)
    
    # Try fuzzy match or partial name match if not exact
    if not matched:
        # Look for sub-string or similar name
        for m_name, m_item in mock_names_map.items():
            if m_name == name_upper or name_upper in m_name or m_name in name_upper:
                # check if category is similar
                matched = m_item
                break
                
    if matched:
        matching_items.append((e_item, matched))
        # Compare volumes
        if matched['volume'] != e_item['volume']:
            different_volumes.append((e_item, matched))
    else:
        missing_items.append(e_item)

print(f"\nExact/Close matches found: {len(matching_items)}")
print(f"Items missing from website: {len(missing_items)}")
for item in missing_items:
    print(f"  - [{item['excel_category']}] {item['name']} (Volume: {item['volume']})")

print(f"\nDifferent volumes: {len(different_volumes)}")
for e_item, m_item in different_volumes:
    print(f"  - {e_item['name']}: Excel Volume={e_item['volume']} vs Website Volume={m_item['volume']} ({m_item['category']})")
