import os

# File paths
input_csv = "output.csv"
file_list = "ls.txt"
output_dir = "../content/case"

# Create the output directory if it doesn't exist
os.makedirs(output_dir, exist_ok=True)

# Read filenames from a.txt
with open(file_list, "r") as f:
    all_files = f.read().splitlines()


# Helper function to filter image names by SKU
def get_images_for_sku(sku):
    return [f"https://cloudfront.everycase.org/everyimage/{file}" for file in all_files if file.startswith(sku[:5])]


# Process the CSV
with open(input_csv, "r") as csv_file:
    # Skip header
    header = csv_file.readline()

    # Process each line
    for line in csv_file:
        sku, kind, colour, model, season, alt_thumbnail, name = line.strip().split(",")

        # Get images for this SKU
        images = get_images_for_sku(sku)

        # Write the MDX file directly
        output_path = os.path.join(output_dir, f"{sku}.mdx")
        with open(output_path, "w") as mdx_file:
            # Write static imports
            mdx_file.write("import LightboxComponent from '../../components/LightboxComponent'\n")
            mdx_file.write("import { Callout } from 'nextra/components'\n\n")

            # Write the title
            mdx_file.write(f"# {name}\n\n")

            # Write the Callout
            mdx_file.write(
                f"<Callout type='info' emoji='👉🏻'>**{sku}ZM/A** is an order number for this product, used for search engines, auction websites and such.</Callout>\n\n")

            # Write the image gallery section
            mdx_file.write("## Image gallery\n\n")
            mdx_file.write("<LightboxComponent\n    images={[\n")
            for image in images:
                mdx_file.write(f"      {{ src: \"{image}\" }},\n")
            mdx_file.write("    ]}\n  />\n")

print(f"MDX files have been generated in the '{output_dir}' directory.")