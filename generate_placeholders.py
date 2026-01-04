from PIL import Image, ImageDraw, ImageFont
import os

# Ensure images directory exists
os.makedirs('images', exist_ok=True)

def create_placeholder(filename, text, bg_color="#1e293b", text_color="#ffffff"):
    # Create image
    width, height = 800, 600
    img = Image.new('RGB', (width, height), color=bg_color)
    d = ImageDraw.Draw(img)
    
    # Try to load a font, fallback to default
    try:
        # Using a bold font usually available on linux
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
        small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
    except IOError:
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()

    # Calculate text position
    # Main Text
    bbox = d.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    d.text(((width - text_w) / 2, (height - text_h) / 2), text, fill=text_color, font=font)
    
    # Subtitle
    subtitle = "Spesfidem Aluminio"
    bbox_sub = d.textbbox((0, 0), subtitle, font=small_font)
    sub_w = bbox_sub[2] - bbox_sub[0]
    d.text(((width - sub_w) / 2, (height / 2) + 40), subtitle, fill="#94a3b8", font=small_font)

    # Add a border
    d.rectangle([0, 0, width-1, height-1], outline=text_color, width=10)

    # Save
    path = os.path.join('images', filename)
    img.save(path)
    print(f"Generated {path}")

# List of missing unique images
placeholders = [
    ("window_projected.png", "Ventana Proyectante", "#334155"),
    ("window_casement.png", "Ventana Casement", "#475569"),
    ("window_fixed.png", "Ventana Fija", "#64748b"),
    ("window_basculant.png", "Ventana Basculante", "#334155"),
    ("door_patio.png", "Puerta Patio", "#1e293b"),
    ("door_folding.png", "Puerta Plegable", "#0f172a"),
    ("door_bathroom.png", "Puerta de Baño", "#334155"),
    ("glass_tempered.png", "Vidrio Templado", "#475569")
]

for filename, text, color in placeholders:
    create_placeholder(filename, text.upper(), bg_color=color)
