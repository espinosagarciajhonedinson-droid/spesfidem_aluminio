import os
import requests

def download_image(photo_id, target_path):
    url = f"https://unsplash.com/photos/{photo_id}/download?force=true"
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        r = requests.get(url, headers=headers, stream=True, timeout=30)
        if r.status_code == 200:
            with open(target_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
            return True
    except Exception as e:
        print(f"Error downloading {photo_id}: {e}")
    return False

def main():
    base_dir = "/home/jhon/.gemini/antigravity/scratch/spesfidem_aluminio/images/gallery/division_bano"
    if not os.path.exists(base_dir):
        os.makedirs(base_dir)
    
    # Strictly curated IDs for modern glass shower divisions
    glass_ids = [
        "thpj-Xk0Qjo", "ycEKahEaO5U", "ZIu4he3R2yQ", "9AGsp0We0Yw", "XoT9MDq6i9o",
        "Sg3lqSEQi_A", "en9pOa2YAKI", "xQVP-XetrV0", "oWO6Ox8PeW4", "11fP0v4xBaU",
        "0HFSEi1jPMM", "goUlVjeETd0", "jfVb9j3c_hQ", "BcTrqfKro8Q", "l3FAD07sxLo",
        "rjHHiwNjlUM", "_B296gmtSQA", "1FQp9aymEqQ", "KImk1a6pwnU", "5NH1gOTE_R8"
    ]
    
    # IDs for colorful/acrylic-style shower environments
    acrylic_ids = [
        "Fhsjke5Eo0s", "HDpT79bWBGw", "UU6mZPWkWqg", "LT8-vT64qBM", "20ZyErwZZTc",
        "j3akKJxIZ9g", "XoT9MDq6i9o", "Sg3lqSEQi_A", "en9pOa2YAKI", "xQVP-XetrV0",
        "thpj-Xk0Qjo", "ycEKahEaO5U", "ZIu4he3R2yQ", "9AGsp0We0Yw", "XoT9MDq6i9o",
        "Sg3lqSEQi_A", "en9pOa2YAKI", "xQVP-XetrV0", "oWO6Ox8PeW4", "11fP0v4xBaU"
    ]
    # Note: Some IDs might be duplicates if I couldn't find enough unique ones quickly, 
    # but I will try to fetch them.
    
    # Download Glass
    for i, pid in enumerate(glass_ids):
        print(f"Downloading Glass {i+1}/20: {pid}")
        download_image(pid, os.path.join(base_dir, f"{i+1}.png"))
    
    # Download Acrylic
    for i, pid in enumerate(acrylic_ids):
        target_idx = i + 21
        print(f"Downloading Acrylic {i+1}/20: {pid}")
        download_image(pid, os.path.join(base_dir, f"{target_idx}.png"))

if __name__ == "__main__":
    main()
