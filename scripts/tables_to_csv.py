import pandas as pd
import re


def parse_markdown_table(md_table, material, season):
    # Split the markdown table into lines and extract headers and rows
    lines = md_table.strip().splitlines()
    headers = [header.strip() for header in lines[0].split("|")[1:-1]]
    rows = [line.split("|")[1:-1] for line in lines[2:]]

    # Create a DataFrame from the extracted data
    data = []
    for row in rows:
        color = row[0].strip()
        for model, sku in zip(headers[1:], row[1:]):
            data.append(
                {
                    "SKU": sku.strip().replace("/A", ""),
                    "material": material,
                    "colour": color,
                    "model": model.strip(),
                    "season": season,
                }
            )

    return pd.DataFrame(data)


# Markdown-style table input
md_table = """
| Silicone Case | iPhone 15 | iPhone 15 Plus | iPhone 15 Pro | iPhone 15 Pro Max |
| ------------- | --------- | -------------- | ------------- | ----------------- |
| Light Blue    | MWND3ZM/A | MWNG3ZM/A      | MWNL3ZM/A     | MWNR3ZM/A         |
| Pink          | MWNE3ZM/A | MWNE3ZM/A      | MWNJ3ZM/A     | MWNN3ZM/A         |
| Soft Mint     | MWNC3ZM/A | MWNG3ZM/A      | MWNL3ZM/A     | MWNQ3ZM/A         |
| Sunshine      | MWNA3ZM/A | MWNF3ZM/A      | MWNK3ZM/A     | MWNP3ZM/A         |
"""

# Set material and season as per your requirement
material = "Silicone Case"
season = "Spring 2024"

# Parse the table and convert it to a DataFrame
df = parse_markdown_table(md_table, material, season)

# Save DataFrame to CSV
df.to_csv(
    "output.csv", index=False, columns=["SKU", "material", "colour", "model", "season"]
)
print("CSV file saved as 'output.csv'")
