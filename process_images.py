
import os
import shutil
from PIL import Image

# Define paths
source_dir = "/home/jhon/.gemini/antigravity/brain/b50d731d-0e88-4f72-b21a-ccc1f1e8c784"
dest_dir = "/home/jhon/.gemini/antigravity/scratch/spesfidem_aluminio/images/gallery/ventana_batiente"

# Files to process (order matters if we want to be deterministic, but here any order is fine)
files = [
    "uploaded_image_0_1767563889488.png",
    "uploaded_image_1_1767563889488.png",
    "uploaded_image_2_1767563889488.png",
    "uploaded_image_3_1767563889488.png"
]

# Start index
start_index = 16

print(f"Processing {len(files)} files...")

for i, filename in enumerate(files):
    src_path = os.path.join(source_dir, filename)
    new_filename = f"{start_index + i}.jpg"
    dest_path = os.path.join(dest_dir, new_filename)
    
    try:
        if os.path.exists(src_path):
            print(f"Converting {src_path} to {dest_path}")
            # Open and convert
            with Image.open(src_path) as img:
                rgb_im = img.convert('RGB')
                rgb_im.save(dest_path)
            print(f"Success: {dest_path}")
        else:
            print(f"Error: Source file not found: {src_path}")
    except Exception as e:
        print(f"Failed to process {filename}: {e}")

print("Done.")
