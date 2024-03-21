"""Primary script that does all Markdown generation"""

import os
import re
import json
import concurrent.futures


# from functools import lru_cache
# @lru_cache(maxsize=None)
def list_directory_contents(file_path):
    """Create listing of folder with images"""
    return os.listdir(file_path)


with open("trash/skus.txt", "r") as file:
    """Read the SKUs from the file and store them in a set"""
    """skus.txt = list of preview images to replace with better-looking ones"""
    extended_skus = set(file.read().splitlines())


def get_extended_sku(original_sku):
    """Check if default preview image needs to be replaced"""
    for sku in extended_skus:
        if sku.startswith(original_sku):
            return sku

    """If no "extended" filename is found in the cache, return the original SKU"""
    return original_sku


def generate_jsx(filenames):
    """Returns Image Gallery MDX code for given filenames"""
    image_entries = ",\n      ".join(
        [
            f"""{{
        src: "https://cloudfront.everycase.org/everysource/{filename}.webp"
      }}"""
            for filename in filenames
            # ignores some of improved preview images
            if "_cut" not in filename
        ]
    )

    jsx = (
        # "<div style={{ width: '100%', maxWidth: '768px' }}>\n"
        "<LightboxComponent\n    images={[\n      "
        + image_entries
        + "\n    ]}\n  />\n"
        # + "</div>"
    )

    return jsx


def grep_sku_from_folder(sku, folder_path):
    """Checks how many images are there for a single SKU"""
    matches = []

    # Get folder contents. This will be cached after the first call.
    folder_contents = list_directory_contents(folder_path)

    for item in folder_contents:
        if sku in item:
            matches.append(item.rsplit(".", 1)[0].strip())

    matches = sorted(matches)

    return matches


def generate_sku_file_content(
    header, head, first_col, cell_content, file_name_without_extension
):
    """Returns full contents of SKU.mdx files"""
    match = re.search(r"iPhone (\d+)", header)

    if match:
        iphone_number = int(match.group(1))
        if "Clear Case" in first_col:
            if iphone_number >= 12:
                new_header = f"# {header} Clear Case with MagSafe\n\n"
            else:
                new_header = f"# {header} Clear Case\n\n"
        else:
            if iphone_number >= 12:
                new_header = f"# {header} {head} with MagSafe — {first_col}\n\n"
            else:
                new_header = f"# {header} {head} — {first_col}\n\n"
    else:
        new_header = f"# {header} {head} — {first_col}\n\n"

    """Hardcoded path to folder with images"""
    matches = grep_sku_from_folder(
        cell_content[:5],
        os.path.expanduser("/Volumes/Storage/Images/nobg-1536-webp-99"),
    )

    with open("trash/keyboards.txt", "r") as file:
        keyboards_list = [line.strip() for line in file.readlines()]

    """Hack for Smart Keyboards"""
    if cell_content[:5] in keyboards_list:
        callout = (
            "is an order number for US ANSI version. The last two letters will be different for different "
            "locales; like SM for Swiss, UA for Ukrainian, etc."
        )
    else:
        callout = "is an order number for this product, used for search engines, auction websites and such."

    if len(matches) > 1:
        return (
            f"import LightboxComponent from '/components/LightboxComponent'\n"
            f"import {{ Callout }} from 'nextra/components'\n\n"
            f"{new_header}"
            f"<Callout type='info' emoji='👉🏻'>**{cell_content[:7]}** {callout}"
            f"</Callout>\n\n"
            f"## Image gallery\n\n"
            f"{generate_jsx(matches)}"
            # TODO alt = "..."
        )
    else:
        return (
            f"import SingleImage from '/components/SingleImage'\n"
            f"import {{ Callout }} from 'nextra/components'\n\n"
            f"{new_header}"
            f"<Callout type='info' emoji='👉🏻'>**{cell_content[:7]}** {callout}"
            f"</Callout>\n\n"
            f"## Image\n\n"
            f"<SingleImage image='https://everycase.imgix.net/everysource/{cell_content[:5]}.webp' title='{new_header[2:-2]}'/>\n"
        )


def write_meta_to_file(folder_path):
    """Creates _meta.json in given folder to hide all the entries"""
    data = {
        "*": {
            "theme": {
                "pagination": False,
                "toc": True,
                "breadcrumb": True,
                "typesetting": "article",
                "footer": False,
                "sidebar": True,
                "layout": "full",
            },
            "display": "hidden",
        }
    }

    # Ensure the folder exists
    os.makedirs(folder_path, exist_ok=True)

    # Create the full path to the _meta.json file
    file_path = os.path.join(folder_path, "_meta.json")

    with open(file_path, "w") as file:
        json.dump(data, file, indent=2)


def get_mapped_name(name, config_file_path="trash/folders.txt"):
    """
    Returns path to put Markdown files into based on folders.txt
    """

    # Load the mappings from the config file
    with open(config_file_path, "r") as f:
        mappings = {}
        for line in f.readlines():
            # Ignore comments and empty lines
            if line.strip().startswith("#") or not line.strip():
                continue
            old, new = line.strip().split("=>")
            mappings[old.strip()] = new.strip()

    # Return the mapped name + original name or just the original name if no mapping found
    if name in mappings:
        return f"{mappings[name]}/{name}"
    else:
        return name


KEYWORDS = ["iPhone", "iPad", "AirTag", "Apple Pencil", "MacBook"]


def generate_tab_or_table(
    headers, rows, generate_everycase, file_name_without_extension
):
    """
    Table generation for level one docs
    + call to generate SKU docs using table data
    """
    table = []

    """Hack to replace material in tables with just Color"""
    with open("trash/hide_material.txt", "r") as file:
        hide_material_list = [line.strip() for line in file.readlines()]

    if any(keyword in headers[0].strip() for keyword in KEYWORDS):
        if file_name_without_extension in hide_material_list:
            table.append(f"| {headers[1]} | SKU | Tap for more: |")
            heading = headers[1]
        else:
            table.append(f"| Color | SKU | Tap for more: |")
            heading = headers[1]
    else:
        if file_name_without_extension in hide_material_list:
            table.append(f"| {headers[0]} | SKU | Tap for more: |")
            heading = headers[0]
        else:
            table.append(f"| Color | SKU | Tap for more: |")
            heading = headers[1]

    table.append("| --- | --- | --- |")

    sorted_rows = sorted(rows, key=lambda x: ord(x[1][0]))

    for row in sorted_rows:
        first_col = row[0]
        cell_content = row[1]
        new_cell = f"{cell_content[:5]}<wbr/>{cell_content[5:]}"
        image_cell = f'<Link href="/{get_mapped_name(file_name_without_extension)}/{cell_content[:5]}"><img src="https://cloudfront.everycase.org/everypreview/{get_extended_sku(cell_content[:5])}.webp" alt="{first_col} {heading}"/></Link>'

        table.append(f"| {first_col} | {new_cell} | {image_cell} |")

        if generate_everycase:
            directory = f"pages/{get_mapped_name(file_name_without_extension)}"
            write_meta_to_file(directory)

            # Create directory if it doesn't exist
            if not os.path.exists(directory):
                os.makedirs(directory, exist_ok=True)

            if cell_content[:5].strip():
                with open(f"{directory}/{cell_content[:5]}.mdx", "w") as sku_file:
                    if any(keyword in headers[0].strip() for keyword in KEYWORDS):
                        sku_file_content = generate_sku_file_content(
                            headers[0],
                            headers[1],
                            first_col,
                            cell_content,
                            file_name_without_extension,
                        )
                    else:
                        sku_file_content = generate_sku_file_content(
                            headers[1],
                            headers[0],
                            first_col,
                            cell_content,
                            file_name_without_extension,
                        )

                    sku_file.write(sku_file_content)

    return table


def convert_table_to_tabs(
    table_content, file_name_without_extension, generate_everycase=True
):
    """Receives table, splits it into Tabs"""
    lines = table_content.strip().split("\n")

    headers = [h.strip() for h in lines[0].split("|")[1:-1]]

    rows = [[cell.strip() for cell in row.split("|")[1:-1]] for row in lines[2:]]

    # If cell 1:1 contains the word "Item", return the table directly
    if "Item" in headers[0]:
        return table_content

    headers = [h.strip() for h in lines[0].split("|")[1:-1]]
    rows = [[cell.strip() for cell in row.split("|")[1:-1]] for row in lines[2:]]

    if len(headers) == 2:
        return "\n".join(
            generate_tab_or_table(
                headers, rows, generate_everycase, file_name_without_extension
            )
        )

    tabs = []
    for index, header in enumerate(headers[1:], start=1):
        current_header = [headers[0], header]
        current_rows = [[row[0], row[index]] for row in rows]
        tabs.append(
            "\n".join(
                generate_tab_or_table(
                    current_header,
                    current_rows,
                    generate_everycase,
                    file_name_without_extension,
                )
            )
        )

    """Hack to avoid duplicating word iPhone in tab names"""
    formatted_headers = []
    previous_headers = ""
    for header in headers[1:]:
        if "iPhone" in header and "iPhone" in previous_headers and len(headers) > 3:
            formatted_headers.append(header.replace("iPhone ", ""))
        elif "iPad" in header and "iPad" in previous_headers and len(headers) > 3:
            formatted_headers.append(header.replace("iPad ", ""))
        elif "MacBook" in header and "MacBook" in previous_headers and len(headers) > 3:
            formatted_headers.append(header.replace("MacBook ", ""))
        else:
            formatted_headers.append(header)
            previous_headers += header + " "

    header_items = ", ".join([f"'{header}'" for header in formatted_headers])
    all_tabs = "\n\n".join([f"<Tabs.Tab>\n\n{tab}\n\n</Tabs.Tab>" for tab in tabs])

    return f"<Tabs\n  items={{[{header_items}]}}>\n\n{all_tabs}\n</Tabs>"


def extract_tables_from_file(filename):
    """Returns all tables found in Markdown file"""
    with open(filename, "r") as f:
        lines = f.readlines()

    tables = []
    current_table = []
    in_table = False

    for line in lines:
        if line.startswith("|"):
            in_table = True
            current_table.append(line.strip())
        else:
            if in_table:
                tables.append("\n".join(current_table))
                current_table = []
                in_table = False

    # Handling the case where the file ends with a table
    if current_table:
        tables.append("\n".join(current_table))

    return tables


def process_single_file(file_info):
    root, file, generate_mdx, generate_everycase = file_info
    if file.endswith(".md"):
        input_filename = os.path.join(root, file)
        output_filename = os.path.join("pages", get_mapped_name(file[:-3]) + ".mdx")
        convert_and_save_to_mdx(
            input_filename, output_filename, generate_mdx, generate_everycase
        )


def replace_mdx_content(filename):
    """mash Split Tables into tabs"""

    with open(filename, "r") as file:
        content = file.read()

    def replace_single_mdx(match_obj):
        # Extract the blocks of content
        split_table_1_content = match_obj.group(2)
        split_table_2_content = match_obj.group(4)
        table_1_title = match_obj.group(1)
        table_2_title = match_obj.group(3)

        return f"""<Tabs items={{['{table_1_title}', '{table_2_title}']}}>
  <Tabs.Tab>
{split_table_1_content}
  </Tabs.Tab>
  <Tabs.Tab>
{split_table_2_content}
  </Tabs.Tab>
</Tabs>"""

    # Using a regex to extract and replace split tables
    content = re.sub(
        r'SPLIT_TABLE_1 = "(.*?)"\n\n(.*?)\n\nSPLIT_TABLE_2 = "(.*?)"\n\n(.*?)\n\nSPLIT_TABLE_END',
        replace_single_mdx,
        content,
        flags=re.DOTALL,
    )

    # Save the changes
    with open(filename, "w") as file:
        file.write(content)


def process_directory(directory_path, generate_mdx=True, generate_everycase=True):
    file_infos = []
    for root, dirs, files in os.walk(directory_path):
        for file in files:
            file_infos.append((root, file, generate_mdx, generate_everycase))

    # Process files in parallel
    with concurrent.futures.ProcessPoolExecutor() as executor:
        executor.map(process_single_file, file_infos)

    for root, dirs, files in os.walk("pages"):
        for file in files:
            if file.endswith(".mdx"):
                replace_mdx_content(os.path.join(root, file))


def convert_and_save_to_mdx(
    input_filename, output_filename, generate_mdx=True, generate_everycase=True
):
    file_name_without_extension = os.path.basename(input_filename).replace(".md", "")
    with open(input_filename, "r") as f:
        content = f.read()

    tables = extract_tables_from_file(input_filename)

    for table in tables:
        converted_table = convert_table_to_tabs(
            table, file_name_without_extension, generate_everycase
        )
        content = content.replace(table, converted_table)

    if generate_mdx:
        with open(
            input_filename.replace("trash/layout/", "trash/pages/"), "r"
        ) as md_file:
            content = (
                'import { Tabs } from "nextra/components";\nimport Link from "next/link"\n\n'
                + md_file.read()
                + "\n"
                + content
            )
        with open(output_filename, "w") as f:
            f.write(content)


if __name__ == "__main__":
    directory_path = "trash/layout"

    process_directory(directory_path, generate_mdx=True, generate_everycase=True)
