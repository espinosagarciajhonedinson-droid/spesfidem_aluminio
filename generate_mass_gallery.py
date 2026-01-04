from PIL import Image, ImageDraw, ImageFont
import os
import random
import string

# Categories
categories = [
    "ventana_corrediza", "ventana_proyectante", "ventana_abatible", 
    "ventana_fija", "ventana_basculante", "puerta_principal", 
    "puerta_patio", "puerta_plegable", "puerta_bano", 
    "division_bano", "vidrio_templado", "ventana_batiente"
]

# Colors
bg_colors = [
    "#0f172a", "#1e293b", "#334155", "#171717", "#262626", 
    "#1c1917", "#292524", "#020617", "#111827", "#1f2937"
]

def generate_ref_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def create_tech_card(category, index):
    dir_path = os.path.join("images", "gallery", category)
    os.makedirs(dir_path, exist_ok=True)
    
    width, height = 800, 600
    bg = random.choice(bg_colors)
    
    img = Image.new('RGB', (width, height), color=bg)
    d = ImageDraw.Draw(img)
    
    # Fonts
    try:
        font_main = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
        font_ref = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 20)
        font_sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    except IOError:
        font_main = ImageFont.load_default()
        font_ref = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    # Design Element (Subtle Line)
    line_y = height // 3
    d.line([(50, line_y), (width - 50, line_y)], fill="#475569", width=2)
    
    # Title (Category)
    title = category.replace("_", " ").upper()
    bbox = d.textbbox((0, 0), title, font=font_main)
    w_title = bbox[2] - bbox[0]
    d.text(((width - w_title) / 2, line_y - 60), title, fill="#e2e8f0", font=font_main)

    # Reference Code
    ref_code = f"REF-{generate_ref_code()}"
    bbox_ref = d.textbbox((0, 0), ref_code, font=font_ref)
    w_ref = bbox_ref[2] - bbox_ref[0]
    d.text(((width - w_ref) / 2, line_y + 30), ref_code, fill="#94a3b8", font=font_ref)

    # "Specs" Simulation
    specs = [
        "Material: Aluminio Premium",
        "Vidrio: Templado / Laminado",
        "Acabado: Pintura Electrostática",
        "Garantía: 100% Calidad Spesfidem"
    ]
    
    start_y = line_y + 80
    for i, spec in enumerate(specs):
        d.text((100, start_y + (i * 30)), f"• {spec}", fill="#cbd5e1", font=font_sub)

    # Logo / Footer
    d.text((width - 200, height - 40), "SPESFIDEM CATALOG", fill="#64748b", font=font_sub)

    # Border
    d.rectangle([0, 0, width-1, height-1], outline="#334155", width=5)

    # Save
    filename = f"{index}.png"
    path = os.path.join(dir_path, filename)
    img.save(path)

# Generate 100 for each category
IMAGES_PER_CAT = 100

print(f"Starting generation of {len(categories) * IMAGES_PER_CAT} images...")

for cat in categories:
    print(f"Processing {cat}...")
    for i in range(1, IMAGES_PER_CAT + 1):
        create_tech_card(cat, i)

print("Generation Complete.")
