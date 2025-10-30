import csv



# File paths (replace with your actual paths)
csv_file_path = "cases.csv"
txt_file_path = "additional_skus.txt"
output_csv_file_path = "updated_cases.csv"

# Load SKUs from the text file into a dictionary for quick lookup
sku_mapping = {}
with open(txt_file_path, "r") as txt_file:
    for line in txt_file:
        full_sku = line.strip()  # Get the full SKU from the line
        base_sku = full_sku.split("_")[0]  # Extract the base SKU before the underscore
        sku_mapping[base_sku] = full_sku  # Map base SKU to full SKU

# Read the CSV and update rows with matching SKUs
updated_rows = []
with open(csv_file_path, "r") as csv_file:
    csv_reader = csv.reader(csv_file)
    header = next(csv_reader)  # Read the header
    if len(header) < 6:
        header.append("alt_thumbnail")  # Ensure the column exists in the header
    updated_rows.append(header)

    for row in csv_reader:
        if len(row) < 6:
            row.append("")  # Add an empty last column if missing
        base_sku = row[0]  # The SKU is in the first column
        if not row[5]:  # Check if the alt_thumbnail column is empty
            if base_sku in sku_mapping:
                row[5] = sku_mapping[base_sku]  # Append the matching full SKU to the last column
        updated_rows.append(row)

# Write the updated rows to a new CSV file
with open(output_csv_file_path, "w", newline="") as output_file:
    csv_writer = csv.writer(output_file)
    csv_writer.writerows(updated_rows)

print(f"Updated CSV saved to {output_csv_file_path}")