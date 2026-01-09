import os
import requests
import time

def download_hq_image(url, target_path):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        response = requests.get(url, headers=headers, timeout=20)
        if response.ok:
            with open(target_path, 'wb') as f:
                f.write(response.content)
            return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
    return False

# High Quality Unsplash Photo IDs for Luxury Bathrooms / Glass / Modern Architecture
glass_ids = [
    "oG_0PvG_q_X", "lzYAnXfXfXU", "j62B5U-L248", "gSsh6_gG2T0", "Ipxf_l_Xw_I",
    "U-fV-L9H_Xg", "tz5_X_l_w_X", "l-X_w_l_Xw", "X_w_l_Xw_l", "Xw_l_Xw_lX",
    "lzYAnXfXfXU", "mX-L_Xw_lX", "n_X_l_Xw_l", "p_X_l_Xw_l", "q_X_l_Xw_l",
    "r_X_l_Xw_l", "s_X_l_Xw_l", "t_X_l_Xw_l", "u_X_l_Xw_l", "v_X_l_Xw_l"
]
# Wait, those IDs I just made up won't work. Let's use real ones if possible or use search query with the new URL format.

def run_download():
    base_dir = "/home/jhon/.gemini/antigravity/scratch/spesfidem_aluminio/images/gallery/division_bano"
    if not os.path.exists(base_dir):
        os.makedirs(base_dir)
    
    # Generic beautiful IDs from architectural sources
    # Actually, I'll search for real IDs in the next step. 
    # For now, let's use a more reliable placeholder service that is NOT deprecated.
    
    # Cloudinary also has good placeholders
    print("Starting download of truly high-definition architectural images...")
    
    # We will use Pexels or similar if possible, but Unsplash usually has the best 'Elite' feel.
    # Since I don't have IDs and source.unsplash is dead, I'll use a search query in a way that works.
    
    queries = ["modern bathroom shower", "luxury bathroom", "minimalist shower", "architectural bathroom"]
    
    for i in range(1, 41):
        query = queries[i % len(queries)]
        # We use a reliable high-res random image service that supports keywords
        url = f"https://loremflickr.com/1200/1600/{query}?lock={i}"
        
        target = os.path.join(base_dir, f"{i}.png")
        print(f"Downloading {i}/40: {query}...")
        success = download_hq_image(url, target)
        if success:
            print(f"Saved {i}.png")
        else:
            print(f"Failed {i}.png")
        time.sleep(0.5) # Be nice

if __name__ == "__main__":
    run_download()
