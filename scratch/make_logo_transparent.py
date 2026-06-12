import os
from PIL import Image

def make_transparent(img_path, output_path):
    print(f"Opening image: {img_path}")
    img = Image.open(img_path).convert("RGBA")
    datas = img.getdata()
    
    # Get the background color from the top-left pixel
    bg_color = datas[0]
    print(f"Detected background color: {bg_color}")
    
    new_data = []
    # Threshold for color matching to handle slight compression artifacts
    threshold = 30
    
    for item in datas:
        # Check if the pixel color is close to the background color
        if (abs(item[0] - bg_color[0]) < threshold and 
            abs(item[1] - bg_color[1]) < threshold and 
            abs(item[2] - bg_color[2]) < threshold):
            # Make transparent
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Save the output
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, "PNG")
    print(f"Saved transparent logo to: {output_path}")

if __name__ == "__main__":
    src = r"C:\Users\ADITYA\.gemini\antigravity\brain\c88a6382-ad13-4043-9048-b80f79559304\media__1781281185232.png"
    dest = r"c:\Users\ADITYA\HACKTHONE\rakshika\assets\logo.png"
    make_transparent(src, dest)
