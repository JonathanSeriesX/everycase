import pandas as pd
import os


def parse_markdown_table(md_table, season):
    # Split the markdown table into lines and extract headers and rows
    lines = md_table.strip().splitlines()
    headers = [header.strip() for header in lines[0].split("|")[1:-1]]
    rows = [line.split("|")[1:-1] for line in lines[2:]]

    # Extract material from the first cell in the first row
    material = headers[0] if headers else "Unknown Material"

    # Create a DataFrame from the extracted data
    data = []
    for row in rows:
        color = row[0].strip()
        for model, sku in zip(headers[1:], row[1:]):
            data.append(
                {
                    "SKU": sku.strip().replace("ZM/A", ""),
                    "material": material,
                    "colour": color,
                    "model": model.strip(),
                    "season": season,
                }
            )

    return pd.DataFrame(data)


def save_to_csv(df, file_path):
    # Check if file already exists
    if os.path.exists(file_path):
        # Load existing data
        existing_df = pd.read_csv(file_path)
        # Concatenate new data with existing data
        combined_df = pd.concat([existing_df, df])
        # Remove duplicates based on all columns
        combined_df.drop_duplicates(inplace=True)
    else:
        # If the file does not exist, use the new data only
        combined_df = df

    # Save to CSV, overwriting with updated data
    combined_df.to_csv(file_path, index=False, columns=["SKU", "material", "colour", "model", "season"])
    print(f"Data saved to '{file_path}' without duplicates.")


def main():
    file_path = "output.csv"

    while True:
        # Read Markdown table from stdin
        print("\nPlease paste your Markdown table below (end with an empty line):")
        md_table_lines = []
        while True:
            line = input()
            if not line.strip():
                break
            md_table_lines.append(line)
        md_table = "\n".join(md_table_lines)

        # Ask for the season only
        season = input("Enter the season: ").strip()

        # Parse the table and convert it to a DataFrame
        df = parse_markdown_table(md_table, season)

        # Save DataFrame to CSV without duplicates
        save_to_csv(df, file_path)

        # Ask if the user wants to continue
        cont = "yes"#input("\nDo you want to add another table? (yes to continue, no to stop): ").strip().lower()
        if cont != "yes":
            print("Exiting the program.")
            break


# Run the main function if the script is executed
if __name__ == "__main__":
    main()