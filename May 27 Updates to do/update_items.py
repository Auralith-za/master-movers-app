import re
import json
import pandas as pd

# Load mockItems.js content
file_path = 'src/features/inventory/data/mockItems.js'
with open(file_path, 'r') as f:
    js_content = f.read()

# Extract INVENTORY_ITEMS list
m = re.search(r'export const INVENTORY_ITEMS = (\[.*?\]);', js_content, re.DOTALL | re.MULTILINE)
if not m:
    print("Could not find INVENTORY_ITEMS array!")
    exit(1)

items_block = m.group(1)
# Parse individual objects. We clean it up so it is valid JSON
cleaned_block = items_block
cleaned_block = re.sub(r',\s*\}', '}', cleaned_block)
cleaned_block = re.sub(r',\s*\]', ']', cleaned_block)
cleaned_block = re.sub(r'//.*?\n', '\n', cleaned_block) # remove comments
mock_items = json.loads(cleaned_block)

print(f"Original items count: {len(mock_items)}")

# Load the excel items
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

# Map categories
category_mapping = {
    'OFFICE/STUDY': 'Office / Study',
    'LOUNGE/LIVING ROOM': 'Lounge / Living Room',
    'DINING ROOM': 'Dining Room',
    'PASSAGE/ENTRANCE': 'Lounge / Living Room',
    'BEDROOMS': 'Bedrooms',
    'GENERAL FURNITURE': 'General Furniture'
}

# Create maps for search
mock_by_name = {item['name'].upper().strip(): item for item in mock_items}
mock_by_id = {item['id']: item for item in mock_items}

updated_count = 0
added_count = 0

for e_item in excel_items:
    name_upper = e_item['name'].upper().strip()
    
    # Check if there is an exact or close match in existing items
    matched = mock_by_name.get(name_upper)
    
    # Try custom matches for common synonyms
    if not matched:
        # Check by name matching (sub-string)
        for m_item in mock_items:
            m_name_upper = m_item['name'].upper().strip()
            if m_name_upper == name_upper or m_name_upper in name_upper or name_upper in m_name_upper:
                # check if categories are compatible
                matched = m_item
                break

    if matched:
        # Update existing item volume
        if matched['volume'] != e_item['volume']:
            print(f"Updating volume for '{matched['name']}': {matched['volume']} -> {e_item['volume']}")
            matched['volume'] = e_item['volume']
            updated_count += 1
    else:
        # Add new item
        new_category = category_mapping.get(e_item['excel_category'], 'General Furniture')
        # Generate clean ID
        new_id = re.sub(r'[^a-z0-9]+', '-', e_item['name'].lower().strip()).strip('-')
        # Ensure ID uniqueness
        base_id = new_id
        counter = 1
        while new_id in mock_by_id:
            new_id = f"{base_id}-{counter}"
            counter += 1
            
        new_item = {
            "id": new_id,
            "name": e_item['name'].upper(),
            "category": new_category,
            "volume": e_item['volume'],
            "image": "🛋️" if new_category == "Lounge / Living Room" else "🛏️" if new_category == "Bedrooms" else "🍽️" if new_category == "Dining Room" else "📦",
            "requiresPhoto": False,
            "requiresCrate": False,
            "autoPackagingType": None,
            "variationOptions": None
        }
        
        # Check special attributes
        if 'piano' in new_id or 'billiard' in new_id or 'pool-table' in new_id:
            new_item['isHeavy'] = True
            new_item['category'] = "Special Handling Items"
            new_item['image'] = "🎹" if 'piano' in new_id else "⚙️"
            
        mock_items.append(new_item)
        mock_by_id[new_id] = new_item
        mock_by_name[new_item['name'].upper()] = new_item
        print(f"Adding new item: '{new_item['name']}' in category '{new_item['category']}' with volume {new_item['volume']}")
        added_count += 1

# Jose requested: "Inventory Master List: Please add 'Pedestals' to the Bedroom category."
# Let's ensure Pedestal is added to Bedroom category (usually PEDESTAL volume is 5.1).
# Let's check if 'pedestals' is already added or needs adding.
if "PEDESTALS" not in mock_by_name:
    pedestals_item = {
        "id": "pedestals",
        "name": "PEDESTALS",
        "category": "Bedrooms",
        "volume": 5.1,
        "image": "🛏️",
        "requiresPhoto": False,
        "requiresCrate": False,
        "autoPackagingType": None,
        "variationOptions": None
    }
    mock_items.append(pedestals_item)
    print("Adding required item 'PEDESTALS' to Bedrooms category.")
    added_count += 1

print(f"\nSummary: Updated {updated_count} volumes, Added {added_count} new items. Total items: {len(mock_items)}")

# Serialize mock_items back to mockItems.js format
# To preserve the exact layout, we output it as nicely formatted JSON and reconstruct the file
formatted_array = json.dumps(mock_items, indent=4)
# Restore the file
new_js_content = f"export const INVENTORY_ITEMS = {formatted_array};\n\nexport const CATEGORIES = [\"Special Handling Items\",\"Lounge / Living Room\",\"Dining Room\",\"Bedrooms\",\"Appliances\",\"Office / Study\",\"General Furniture\",\"Outdoor & Patio\",\"Boxes & Loose Items\"];\n"

with open(file_path, 'w') as f:
    f.write(new_js_content)
print("mockItems.js written successfully!")
