import os
import pickle
import random
import csv
import numpy as np
import cv2
from PIL import Image, ImageFilter

SCRIPT_DIR = os.path.dirname(__file__)
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "real")
LABELS_PATH = os.path.join(OUTPUT_DIR, "labels.csv")
STROKES_PATH = "/tmp/strokes.cpkl"

def create_lined_paper(width=1000, height=1250, line_spacing=45, margin_x=135, rng=None):
    if rng is None:
        rng = random.Random()
        
    base_r = rng.randint(246, 254)
    base_g = rng.randint(243, 252)
    base_b = rng.randint(236, 246)
    
    paper = np.ones((height, width, 3), dtype=np.float32)
    paper[:, :, 0] = base_b  # BGR for OpenCV
    paper[:, :, 1] = base_g
    paper[:, :, 2] = base_r
    
    paper_noise = np.random.normal(0, rng.uniform(1.8, 3.2), (height, width, 1))
    paper = np.clip(paper + paper_noise, 0, 255).astype(np.uint8)
    
    ruling_choice = rng.choice(["blue", "blue", "grey"])
    if ruling_choice == "blue":
        line_color = (rng.randint(225, 245), rng.randint(195, 220), rng.randint(165, 195))
    else:
        line_color = (rng.randint(205, 220), rng.randint(202, 218), rng.randint(200, 218))
        
    margin_color = (rng.randint(165, 190), rng.randint(155, 185), rng.randint(225, 250))
    
    top_header_y = rng.randint(110, 150)
    double_header = rng.random() < 0.65
    
    line_y_list = []
    y = top_header_y
    if double_header:
        cv2.line(paper, (30, y - 8), (width - 30, y - 8), line_color, 1)
        
    while y < height - 50:
        lw = rng.choice([1, 1, 2])
        cv2.line(paper, (30, y), (width - 30, y), line_color, lw)
        line_y_list.append(y)
        y += line_spacing
        
    cv2.line(paper, (margin_x, 25), (margin_x, height - 25), margin_color, rng.choice([1, 2]))
    return paper, line_y_list, margin_x

def render_real_human_page(paper, line_y_list, margin_x, stroke_samples, rng):
    """
    Renders actual human-drawn handwriting strokes (IAM Dataset) onto the notebook lines
    with natural biological pressure variations, ink flow, and human drift.
    """
    height, width = paper.shape[:2]
    
    # Choose ink color (BGR)
    ink_family = rng.choice(["blue_ballpoint", "royal_blue", "gel_black", "charcoal"])
    if ink_family == "blue_ballpoint":
        base_ink = np.array([rng.randint(135, 175), rng.randint(50, 85), rng.randint(22, 45)], dtype=np.float32)
    elif ink_family == "royal_blue":
        base_ink = np.array([rng.randint(145, 195), rng.randint(35, 68), rng.randint(15, 35)], dtype=np.float32)
    elif ink_family == "gel_black":
        base_ink = np.array([rng.randint(32, 50), rng.randint(28, 44), rng.randint(24, 40)], dtype=np.float32)
    else:
        base_ink = np.array([rng.randint(48, 65), rng.randint(46, 62), rng.randint(44, 60)], dtype=np.float32)
        
    num_lines = min(len(line_y_list) - 3, rng.randint(7, 14))
    start_line_idx = rng.randint(1, 3)
    
    # Render sequential handwritten sentences
    sample_ptr = 0
    for l_idx in range(start_line_idx, start_line_idx + num_lines):
        if sample_ptr >= len(stroke_samples):
            break
            
        target_y = line_y_list[l_idx]
        stroke = stroke_samples[sample_ptr]
        sample_ptr += 1
        
        # Scale stroke coordinates to fit line height (~45px)
        # Bounding box of stroke in original coords
        pts = np.cumsum(stroke[:, :2], axis=0)
        min_y, max_y = np.min(pts[:, 1]), np.max(pts[:, 1])
        orig_h = max_y - min_y
        if orig_h < 1e-3:
            continue
            
        target_text_h = rng.uniform(26.0, 34.0)
        scale = target_text_h / float(orig_h)
        
        # Random starting indent and human baseline jitter
        cur_x = float(margin_x + rng.randint(15, 45))
        # Place baseline slightly above line ruling
        cur_y = float(target_y - rng.uniform(4.0, 9.0) - (max_y * scale))
        
        prev_pt = (int(cur_x), int(cur_y + pts[0, 1] * scale))
        
        for k in range(len(stroke)):
            dx, dy, eos = stroke[k]
            cur_x += dx * scale
            cur_y += dy * scale
            
            # Bound within page width
            if cur_x > width - 50:
                break
                
            pt = (int(cur_x), int(cur_y))
            
            if eos == 0:  # Pen down (drawing ink)
                # Human pressure variation (strokes thin on faster / upstrokes)
                speed = np.sqrt(dx*dx + dy*dy)
                thickness = 2 if speed < 4.0 else 1
                
                # Subtle ink saturation gradient
                pressure_factor = np.clip(1.15 - (speed * 0.04), 0.75, 1.25)
                ink_color = np.clip(base_ink * pressure_factor, 0, 255).astype(np.uint8).tolist()
                
                cv2.line(paper, prev_pt, pt, tuple(ink_color), thickness, cv2.LINE_AA)
            prev_pt = pt

    # Photographic augmentations: lighting gradient and lens blur
    # 1. Subtle vignetting / lighting gradient
    y_coords, x_coords = np.mgrid[0:height, 0:width].astype(np.float32)
    gradient = 1.0 - (x_coords / width) * rng.uniform(0.04, 0.09) - (y_coords / height) * rng.uniform(0.03, 0.07)
    paper = np.clip(paper * gradient[:, :, np.newaxis], 0, 255).astype(np.uint8)
    
    # 2. Convert to PIL for subtle realistic JPEG compression
    pil_img = Image.fromarray(cv2.cvtColor(paper, cv2.COLOR_BGR2RGB))
    if rng.random() < 0.4:
        pil_img = pil_img.filter(ImageFilter.GaussianBlur(radius=rng.uniform(0.3, 0.6)))
        
    return pil_img

def main(target_count=150):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    if not os.path.exists(STROKES_PATH):
        raise FileNotFoundError(f"Strokes dataset not found at {STROKES_PATH}")
        
    print(f"Loading IAM Handwriting Dataset from {STROKES_PATH}...")
    with open(STROKES_PATH, "rb") as f:
        strokes, texts = pickle.load(f, encoding="latin1")
        
    print(f"Loaded {len(strokes)} IAM handwriting stroke sequences.")
    rng = random.Random(42)
    
    records = []
    
    print(f"Generating {target_count} authentic human handwriting document pages...")
    for i in range(1, target_count + 1):
        # Pick 12-16 random stroke sequences for this page
        page_strokes = [strokes[rng.randint(0, len(strokes) - 1)] for _ in range(16)]
        
        paper, lines, margin_x = create_lined_paper(rng=rng)
        real_page_img = render_real_human_page(paper, lines, margin_x, page_strokes, rng)
        
        filename = f"real_{i:04d}.jpg"
        out_path = os.path.join(OUTPUT_DIR, filename)
        real_page_img.save(out_path, "JPEG", quality=rng.randint(85, 93))
        
        records.append({
            "filename": filename,
            "label": 1,
            "type": "real_human_iam",
            "source": "IAM Handwriting Database"
        })
        
        if i % 25 == 0 or i == target_count:
            print(f"Generated [{i}/{target_count}] real handwriting pages.")
            
    with open(LABELS_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["filename", "label", "type", "source"])
        writer.writeheader()
        writer.writerows(records)
        
    print(f"\nSuccessfully generated {len(records)} authentic human handwriting samples in {OUTPUT_DIR}")

if __name__ == "__main__":
    main(150)
