import csv


# Helper function to compare seasons
def is_later_season(season1, season2):
    seasons_order = ["Winter", "Spring", "Summer", "Autumn", "November", "December"]
    season1_name, season1_year = season1.split()
    season2_name, season2_year = season2.split()

    if int(season1_year) > int(season2_year):
        return True
    elif int(season1_year) == int(season2_year):
        return seasons_order.index(season1_name) > seasons_order.index(season2_name)
    return False


# Define the rules for generating the "name" column
def generate_name(row):
    sku, kind, colour, model, season, alt_thumbnail = row

    if model == "MagSafe iPhone":
        model = "iPhone"
    if model == "iPad 10":
        model = "iPad (10th Generation)"
    if "inch" in model:
        model = model.replace("-inch", "″")
    if "A12X" in model:
        model = model.replace(" A12X", "″")
    if "M1" in model:
        model = model.replace(" M1", "″")

    if "iPad" in model:
        name = f"{kind} for {model}"
    elif "Beats" in kind:
        name = f"Beats {model} Case"
    else:
        name = f"{model} {kind}"

    if is_later_season(season, "Summer 2020") and "iPhone" in model:
        name += " with MagSafe"

    # if is_later_season(season, "Summer 2024") and "iPhone" in model:
    #   name += " and Camera Control"

    if "Sunrise Pink" in colour or "Twilight Blue" in colour:
        name += f" — Special Edition — {colour}"
    elif colour and colour.lower() != "clear case":
        name += f" — {colour}"

    return name


def sort_rows(rows):
    # Update seasons_order to handle months like "November"
    seasons_order = {
        "Winter": 0,
        "Spring": 1,
        "Summer": 2,
        "Autumn": 3,
        "November": 3.5,
        "December": 3.6,
    }

    def season_key(season):
        # Split season into name and year
        name, year = season.split()
        return (
            int(year),
            seasons_order.get(name, 4),
        )  # Default unknown season to after all others

    # Sort rows by season descending, then model, then kind
    return sorted(
        rows,
        key=lambda row: (season_key(row[4]), row[3], row[1]),
        reverse=True,  # Reverse for descending order
    )


# File paths
input_file = "input.csv"
output_file = "output.csv"

# Process the CSV
with open(input_file, "r") as infile, open(output_file, "w", newline="") as outfile:
    reader = csv.reader(infile)
    writer = csv.writer(outfile)

    # Read header and add "name" column
    header = next(reader)
    header.append("name")
    writer.writerow(header)

    # Read and process rows
    rows = [row for row in reader]
    for row in rows:
        row.append(generate_name(row))

    # Sort rows by season, model, and kind
    sorted_rows = sort_rows(rows)

    # Write sorted rows
    writer.writerows(sorted_rows)

print(f"Updated CSV written to {output_file}")
