"""Lists all the potential versions of images for each SKU"""
import os


def list_markdown_files(directory, output_file="models.txt"):
    md_files = []

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
            f.write(file_name + "_AV01_RED\n")
            f.write(file_name + "_AV1_RED\n")
            f.write(file_name + "_AV01_JET_BLACK\n")
            f.write(file_name + "_AV1_JET_BLACK\n")

            f.write(file_name + "_AV02_RED\n")
            f.write(file_name + "_AV2_RED\n")
            f.write(file_name + "_AV02_JET_BLACK\n")
            f.write(file_name + "_AV2_JET_BLACK\n")

            f.write(file_name + "_AV03_RED\n")
            f.write(file_name + "_AV3_RED\n")
            f.write(file_name + "_AV03_JET_BLACK\n")
            f.write(file_name + "_AV3_JET_BLACK\n")

            f.write(file_name + "_AV04_RED\n")
            f.write(file_name + "_AV4_RED\n")
            f.write(file_name + "_AV04_JET_BLACK\n")
            f.write(file_name + "_AV4_JET_BLACK\n")

    # Join file names with a newline and return
    return "\n".join(md_files)


# Example usage:
directory_path = "./pages"  # Replace with your folder path
list_markdown_files(directory_path)
