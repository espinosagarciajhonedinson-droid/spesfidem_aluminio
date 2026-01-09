import os
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

def super_enhance_image(directory):
    print(f"Applying Super-HD Enhancement in {directory}...")
    valid_extensions = ('.png', '.jpg', '.jpeg')
    
    for filename in os.listdir(directory):
        if filename.lower().endswith(valid_extensions):
            file_path = os.path.join(directory, filename)
            try:
                with Image.open(file_path) as img:
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    # 1. Advanced Upscaling (2x for higher density)
                    width, height = img.size
                    img = img.resize((width * 2, height * 2), resample=Image.LANCZOS)
                    
                    # 2. Denoising / Smoothing (Removes digital noise before sharpening)
                    img = img.filter(ImageFilter.SMOOTH_MORE)
                    
                    # 3. Dynamic Range Optimization (Auto-levels)
                    img = ImageOps.autocontrast(img, cutoff=1) # 1% cutoff for better whites/blacks
                    
                    # 4. Unsharp Masking (Professional Sharpening technique)
                    # radius=2, percent=150, threshold=3
                    img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
                    
                    # 5. Detail Enhancement pass
                    img = img.filter(ImageFilter.DETAIL)
                    
                    # 6. Final Polish
                    # Contrast: Make the aluminum "pop"
                    contrast = ImageEnhance.Contrast(img).enhance(1.15)
                    # Color: Slightly more vivid but natural
                    color = ImageEnhance.Color(contrast).enhance(1.1)
                    # Brightness: Ensure it looks professional
                    final = ImageEnhance.Brightness(color).enhance(1.02)
                    
                    # Save as high-quality PNG
                    target_name = filename
                    if not filename.endswith('.png'):
                        target_name = os.path.splitext(filename)[0] + '.png'
                        os.remove(file_path)
                    
                    final.save(os.path.join(directory, target_name), 'PNG', compress_level=1)
                    print(f"Ultra-HD Processed: {target_name}")
                    
            except Exception as e:
                print(f"Error on {filename}: {e}")

if __name__ == "__main__":
    target_dir = "/home/jhon/.gemini/antigravity/scratch/spesfidem_aluminio/images/gallery/division_bano"
    super_enhance_image(target_dir)
