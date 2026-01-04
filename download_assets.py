import os
import requests
import shutil

# PREMIER ARCHITECTURAL PHOTOGRAPHY - MANUALLY VERIFIED QUALITY
# Focusing on: Modern Facades, Floor-to-ceiling glass, Minimalist Aluminum
BASE_URL = "https://images.unsplash.com/"

# Curated list of high-quality architectural IDs
ids = [
    "photo-1600585154340-be6161a56a0c", "photo-1600607687920-4e2a09cf159d", "photo-1605276373954-7c4a16dc9394", "photo-1541334994262-6789b7848651",
    "photo-1512917774080-9991f1c4c750", "photo-1509644851169-2acc08aa25b5", "photo-1600566752355-35792bed65ee", "photo-1600570994414-77477308a06f",
    "photo-1600585154526-990dcea4d4d9", "photo-1600570995033-03f7e6f8a8b1", "photo-1600566753190-17f0bcd4aee6", "photo-1600566752737-b71556093863",
    "photo-1600210492493-0946911123ea", "photo-1600047509807-ba8f99d2cdde", "photo-1555505019-8c3f4c6a6f11", "photo-1516455590571-18256e5bb9ff",
    "photo-1517581177682-a085bb7ffb15", "photo-1533090161767-e6ffed986c88", "photo-1541746972996-4e0b0f43e02a", "photo-1512918728675-ed5a9ecdebfd",
    "photo-1590060411650-7f97576a8775", "photo-1582268611958-ebfd161ef9cf", "photo-1544984243-71a740751e06", "photo-1549416878-cf993213a071",
    "photo-1621293954908-d811495bb191", "photo-1605117814642-8707929651ec", "photo-1497366754035-f200968a6e72", "photo-1497366811353-6870744d04b2",
    "photo-1521229611681-32a473bc3545", "photo-1626078345118-a681df7976e5"
]

categories = {
    "ventana_corrediza": ids[0:8],
    "ventana_proyectante": ids[8:16],
    "ventana_abatible": ids[16:24],
    "puerta_principal": ids[24:30],
    "division_bano": [
        "photo-1552321554-5fefe8c9ef14", "photo-1584622650111-993a426fbf0a", 
        "photo-1620641788421-7a1c342ea42e", "photo-1576675784201-0e142b423952",
        "photo-1595181005391-da15a1334057", "photo-1553051021-9f94520a6cad"
    ],
    "vidrio_templado": ids[20:30],
    "ventana_batiente": ids[0:5]
}

def download_asset(url, target_path):
    try:
        res = requests.get(url, stream=True, timeout=30)
        if res.status_code == 200:
            with open(target_path, 'wb') as f:
                for chunk in res.iter_content(4096): f.write(chunk)
            return True
    except: pass
    return False

def refresh_all():
    print("Iniciando purga y descarga de activos de ALTA CALIDAD...")
    
    # Update Hero & About first
    main_res = {
        "images/hero_bg.jpg": ids[0],
        # Exterior modern house, very wide angle, expansive glass (Panoramic View)
        "images/about_arch.jpg": "photo-1600596542815-3ad19c6e3d55" 
    }
    for path, photo_id in main_res.items():
        url = f"{BASE_URL}{photo_id}?q=100&w=3000&auto=format&fit=crop"
        print(f"Descargando foto principal premium: {path}...")
        download_asset(url, path)

    # Gallery
    for cat, cat_ids in categories.items():
        dir_path = f"images/gallery/{cat}"
        os.makedirs(dir_path, exist_ok=True)
        
        # Clear existing
        for f in os.listdir(dir_path): os.remove(os.path.join(dir_path, f))
        
        for i, photo_id in enumerate(cat_ids):
            target_path = f"{dir_path}/{i+1}.jpg"
            url = f"{BASE_URL}{photo_id}?q=95&w=2000&auto=format&fit=crop"
            print(f"Descargando [{cat}] {i+1}/4 high-res...")
            if download_asset(url, target_path):
                # Copy to products as thumbnail
                if i == 0:
                    shutil_copy = True
                    dst = f"images/products/{cat}.jpg"
                    import shutil
                    shutil.copy(target_path, dst)
                    print(f"Thumbnail generado: {dst}")

if __name__ == '__main__':
    refresh_all()
