"""Lists all the potential versions of images for each SKU"""

import os


def list_markdown_files(directory, output_file="models.txt"):
    md_files = [
        "MWNF3",
        "MWNE3",
        "MWNG3",
        "MWNG3",
        "MWNA3",
        "MWN93",
        "MWNC3",
        "MWND3",
        "MWNK3",
        "MWNJ3",
        "MWNL3",
        "MWNM3",
        "MWNP3",
        "MWNN3",
        "MWNQ3",
        "MWNR3",
    ]

    # Walk through directory including its subdirectories
    for dirpath, dirnames, filenames in os.walk(directory):
        # Check if "ipad" is in the directory path
        if "iphone_7" in dirpath.lower():
            for filename in filenames:
                if filename.endswith(".md"):
                    # Append only the file name without extension
                    md_files.append(os.path.splitext(filename)[0])

    with open(output_file, "w") as f:
        f.write("everyphone:\n")
        for file_name in md_files:
            f.write(file_name + "_AV1\n")
            f.write(file_name + "_AV2\n")
            f.write(file_name + "_AV3\n")
            f.write(file_name + "_AV4_GEO_GB\n")

    # Join file names with a newline and return
    return "\n".join(md_files)


# Example usage:
directory_path = "./pages"  # Replace with your folder path
list_markdown_files(directory_path)
