# Define file paths
input_file = 'models.txt'
output_file = 'models_with_suffixes.txt'

# List of suffixes you want to add
suffixes = [
    "AV01", "AV02", "AV03", "AV04", "AV05", "AV06", "AV07", "AV08", "AV09", "AV10",
    "AV1", "AV2", "AV3", "AV4", "AV5", "AV6", "AV7", "AV8", "AV9"
]  # Add more suffixes here as needed

# Read the input file
with open(input_file, 'r') as file:
    lines = file.readlines()

# Prepare the output list
output_lines = []

# Process each model
for line in lines:
    # Strip whitespace and skip empty lines or headers
    model = line.strip()
    if not model or model.endswith(':'):
        output_lines.append(line)  # Add headers like 'everyphone:' back unchanged
        continue

    # Loop through each suffix and add it to the model
    for suffix in suffixes:
        output_lines.append(f"{model}_{suffix}")

# Write results to the output file
with open(output_file, 'w') as file:
    for line in output_lines:
        file.write(line + '\n')

print("Generated records saved to", output_file)