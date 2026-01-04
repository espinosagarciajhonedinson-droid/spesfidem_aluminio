from PIL import Image, ImageDraw, ImageFont
import os
import random

# Categories
categories = [
    "ventana_corrediza", "ventana_proyectante", "ventana_casement", 
    "ventana_fija", "ventana_basculante", "puerta_principal", 
    "puerta_patio", "puerta_plegable", "puerta_bano", 
    "division_bano", "vidrio_templado"
]

# Base colors for variety - slate, gray, zinc, neutral, stone + tints
bg_colors = [
    "#0f172a", "#1e293b", "#334155", "#475569", "#64748b",
    "#18181b", "#27272a", "#3f3f46", "#52525b", "#71717a",
    "#1c1917", "#292524", "#44403c", "#57534e", "#78716c"
]

def create_gallery_image(category, index, total):
    # Ensure dir exists
    dir_path = os.path.join("images", "gallery", category)
    os.makedirs(dir_path, exist_ok=True)
    
    # Setup
    width, height = 800, 600
    # Pick a random dark color
    bg = random.choice(bg_colors)
    
    img = Image.new('RGB', (width, height), color=bg)
    d = ImageDraw.Draw(img)
    
     # Try to load a font
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 150)
        font_med = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
    except IOError:
        font_large = ImageFont.load_default()
        font_med = ImageFont.load_default()
        font_small = ImageFont.load_default()

    # Draw "Photo N"
    text_num = f"{index}"
    bbox_num = d.textbbox((0, 0), text_num, font=font_large)
    w_num = bbox_num[2] - bbox_num[0]
    h_num = bbox_num[3] - bbox_num[1]
    
    # Center Number
    d.text(((width - w_num) / 2, (height - h_num) / 2 - 40), text_num, fill="#ffffff", font=font_large)

    # Draw Category Name
    cat_name = category.replace("_", " ").upper()
    bbox_cat = d.textbbox((0, 0), cat_name, font=font_med)
    w_cat = bbox_cat[2] - bbox_cat[0]
    
    d.text(((width - w_cat) / 2, height - 120), cat_name, fill="#94a3b8", font=font_med)

    # Draw Watermark
    watermark = "SPESFIDEM DESIGN"
    bbox_wat = d.textbbox((0, 0), watermark, font=font_small)
    w_wat = bbox_wat[2] - bbox_wat[0]
    d.text(((width - w_wat) / 2, height - 50), watermark, fill="#475569", font=font_small)

    # Add a border
    d.rectangle([0, 0, width-1, height-1], outline="#334155", width=15)

    # Save
    filename = f"{index}.png"
    path = os.path.join(dir_path, filename)
    img.save(path)
    print(f"Generated {path}")

# Generate 15 images for each category (Total ~165 images)
IMAGES_PER_CATEGORY = 15

for cat in categories:
    print(f"Generating for {cat}...")
    for i in range(1, IMAGES_PER_CATEGORY + 1):
        create_gallery_image(cat, i, IMAGES_PER_CATEGORY)

print("Batch generation complete.")
