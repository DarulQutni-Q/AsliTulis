import os
import json
import csv
import random
import math
from concurrent.futures import ProcessPoolExecutor, as_completed
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SCRIPT_DIR = os.path.dirname(__file__)
FONTS_DIR = os.path.join(SCRIPT_DIR, "..", "assets", "fonts")
MANIFEST_PATH = os.path.join(FONTS_DIR, "fonts.json")
SENTENCES_PATH = os.path.join(SCRIPT_DIR, "sentences.json")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "synthetic")
LABELS_PATH = os.path.join(OUTPUT_DIR, "labels.csv")

def load_fonts_and_sentences():
    if not os.path.exists(MANIFEST_PATH):
        raise FileNotFoundError(f"Manifest not found: {MANIFEST_PATH}. Run download_fonts.py first.")
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        fonts = json.load(f)

    if not os.path.exists(SENTENCES_PATH):
        raise FileNotFoundError(f"Sentences file not found: {SENTENCES_PATH}")
    with open(SENTENCES_PATH, "r", encoding="utf-8") as f:
        sentences = json.load(f)

    return fonts, sentences

def create_lined_paper(width=1000, height=1250, line_spacing=45, margin_x=135, rng=None):
    """
    Generates a realistic student notebook lined paper background
    with paper grain, horizontal blue/grey lines, and a red margin line.
    """
    if rng is None:
        rng = random.Random()

    # 1. Base paper tone (warm off-white / light cream / subtle notebook grey)
    base_r = rng.randint(246, 254)
    base_g = rng.randint(243, 252)
    base_b = rng.randint(236, 246)
    
    paper = np.ones((height, width, 3), dtype=np.float32)
    paper[:, :, 0] = base_r
    paper[:, :, 1] = base_g
    paper[:, :, 2] = base_b

    # 2. Add subtle organic paper grain / texture
    paper_noise = np.random.normal(0, rng.uniform(1.8, 3.2), (height, width, 1))
    paper = np.clip(paper + paper_noise, 0, 255).astype(np.uint8)

    # Convert to PIL for crisp line drawing
    paper_img = Image.fromarray(paper)
    draw = ImageDraw.Draw(paper_img)

    # 3. Choose ruling style
    ruling_choice = rng.choice(["blue", "blue", "grey"])
    if ruling_choice == "blue":
        line_color = (
            rng.randint(165, 195),
            rng.randint(195, 220),
            rng.randint(225, 245)
        )
    else:
        line_color = (
            rng.randint(200, 218),
            rng.randint(202, 218),
            rng.randint(205, 220)
        )

    margin_color = (
        rng.randint(225, 250),
        rng.randint(155, 185),
        rng.randint(165, 190)
    )

    # Top header line offset
    top_header_y = rng.randint(110, 150)
    double_header = rng.random() < 0.65

    # Draw horizontal ruling lines
    line_y_list = []
    y = top_header_y
    if double_header:
        draw.line([(30, y - 8), (width - 30, y - 8)], fill=line_color, width=1)

    while y < height - 50:
        line_width = rng.choice([1, 1, 2])
        draw.line([(30, y), (width - 30, y)], fill=line_color, width=line_width)
        line_y_list.append(y)
        y += line_spacing

    # Draw vertical red margin line
    draw.line([(margin_x, 25), (margin_x, height - 25)], fill=margin_color, width=rng.choice([1, 2]))

    return paper_img, line_y_list, margin_x

def wrap_text(text, font, max_width):
    """
    Wraps text to fit within max_width using font metrics.
    """
    words = text.split()
    lines = []
    current_line = []

    for word in words:
        test_line = " ".join(current_line + [word])
        bbox = font.getbbox(test_line)
        line_w = bbox[2] - bbox[0]
        if line_w <= max_width or not current_line:
            current_line.append(word)
        else:
            lines.append(" ".join(current_line))
            current_line = [word]

    if current_line:
        lines.append(" ".join(current_line))

    return lines

def render_handwritten_note(paper_img, sentence, font_path, line_y_list, margin_x, rng=None):
    """
    Renders the sentence text aligned to the notebook ruled lines with natural ink colors.
    """
    if rng is None:
        rng = random.Random()

    width, height = paper_img.size
    max_text_width = width - margin_x - rng.randint(50, 90)

    # Calibrate font size relative to line spacing (~45px)
    font_size = rng.randint(27, 33)
    font = ImageFont.truetype(font_path, font_size)

    lines = wrap_text(sentence, font, max_text_width)

    # Choose pen ink color (blue ballpoint, royal blue, gel black, or dark charcoal)
    ink_family = rng.choice(["blue_ballpoint", "royal_blue", "gel_black", "charcoal_black"])
    if ink_family == "blue_ballpoint":
        ink_rgb = (
            rng.randint(22, 45),
            rng.randint(50, 85),
            rng.randint(135, 175)
        )
    elif ink_family == "royal_blue":
        ink_rgb = (
            rng.randint(15, 35),
            rng.randint(35, 68),
            rng.randint(145, 195)
        )
    elif ink_family == "gel_black":
        ink_rgb = (
            rng.randint(22, 38),
            rng.randint(22, 38),
            rng.randint(24, 40)
        )
    else:  # charcoal_black
        ink_rgb = (
            rng.randint(40, 58),
            rng.randint(40, 58),
            rng.randint(42, 60)
        )

    # Start line: random row near top of page
    start_row = rng.randint(1, min(4, max(1, len(line_y_list) - len(lines) - 1)))

    # Create transparent layer for text rendering
    text_overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    text_draw = ImageDraw.Draw(text_overlay)

    # Indent option for first line
    first_indent = rng.choice([0, 0, 25, 35])

    for i, line in enumerate(lines):
        row_idx = start_row + i
        if row_idx >= len(line_y_list):
            break
        
        ruled_y = line_y_list[row_idx]
        
        # Position baseline naturally on top of the blue line
        baseline_jitter = rng.uniform(-2.0, 1.5)
        text_baseline_y = ruled_y - 2 + baseline_jitter
        
        start_x = margin_x + rng.randint(14, 22) + (first_indent if i == 0 else 0)

        # Draw text with anchor='ls' (left baseline)
        text_draw.text(
            (start_x, text_baseline_y),
            line,
            font=font,
            fill=(*ink_rgb, 255),
            anchor="ls"
        )

    # Natural ink bleed: apply tiny micro-diffusion so edges blend into paper fibers
    text_overlay = text_overlay.filter(ImageFilter.GaussianBlur(radius=0.32))

    # Alpha composite onto paper
    result = paper_img.copy().convert("RGBA")
    result.alpha_composite(text_overlay)
    return result.convert("RGB")

def apply_photographic_augmentations(pil_img, rng=None):
    """
    Applies comprehensive smartphone photo augmentations:
    - Gradient shadows / directional room lighting
    - Soft vignette / phone body shadow
    - Perspective warp (non-perpendicular camera angle)
    - Subtle rotation (-1.5 to +1.5 deg)
    - Optical defocus / lens blur
    - Camera sensor ISO noise
    - White balance / color temperature jitter
    - Realistic JPEG compression
    """
    if rng is None:
        rng = random.Random()

    img_np = np.array(pil_img).astype(np.float32)
    h, w, _ = img_np.shape

    # 1. Gradient Shadows & Directional Room Lighting
    angle = rng.uniform(0, 2 * math.pi)
    x_coords, y_coords = np.meshgrid(np.linspace(-1, 1, w), np.linspace(-1, 1, h))
    directional_field = x_coords * math.cos(angle) + y_coords * math.sin(angle)
    light_contrast = rng.uniform(0.10, 0.22)
    lighting_mask = 1.0 + directional_field * light_contrast

    # Secondary soft phone/hand shadow (radial or corner darkening)
    if rng.random() < 0.70:
        shadow_center_x = rng.uniform(0.1, 0.9)
        shadow_center_y = rng.uniform(0.0, 0.5)
        dist = np.sqrt(((x_coords - (shadow_center_x * 2 - 1)) ** 2) + ((y_coords - (shadow_center_y * 2 - 1)) ** 2))
        shadow_falloff = np.clip(1.0 - (dist * rng.uniform(0.08, 0.18)), 0.75, 1.05)
        lighting_mask = lighting_mask * shadow_falloff

    # Apply lighting mask
    img_np = img_np * lighting_mask[:, :, np.newaxis]

    # 2. Color Temperature / White Balance Adjustment
    wb_temp = rng.choice(["warm", "cool", "neutral", "warm"])
    if wb_temp == "warm":
        img_np[:, :, 0] *= rng.uniform(1.01, 1.05)  # Boost Red
        img_np[:, :, 2] *= rng.uniform(0.95, 0.99)  # Reduce Blue
    elif wb_temp == "cool":
        img_np[:, :, 0] *= rng.uniform(0.96, 0.99)
        img_np[:, :, 2] *= rng.uniform(1.01, 1.04)

    # 3. Overall Exposure / Brightness Jitter
    exposure = rng.uniform(0.94, 1.06)
    img_np = np.clip(img_np * exposure, 0, 255).astype(np.uint8)

    # 4. Subtle Rotation & Perspective Warp
    rot_angle = rng.uniform(-1.6, 1.6)
    rot_mat = cv2.getRotationMatrix2D((w / 2, h / 2), rot_angle, 1.0)
    img_np = cv2.warpAffine(img_np, rot_mat, (w, h), borderMode=cv2.BORDER_REPLICATE)

    max_shift = rng.uniform(10, 24)
    src_pts = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
    dst_pts = np.float32([
        [rng.uniform(0, max_shift), rng.uniform(0, max_shift)],
        [w - rng.uniform(0, max_shift), rng.uniform(0, max_shift)],
        [w - rng.uniform(0, max_shift), h - rng.uniform(0, max_shift)],
        [random.uniform(0, max_shift), h - rng.uniform(0, max_shift)]
    ])
    persp_mat = cv2.getPerspectiveTransform(src_pts, dst_pts)
    img_np = cv2.warpPerspective(img_np, persp_mat, (w, h), borderMode=cv2.BORDER_REPLICATE)

    # 5. Optical Defocus / Lens Softness
    blur_sigma = rng.uniform(0.45, 0.85)
    img_np = cv2.GaussianBlur(img_np, (3, 3), sigmaX=blur_sigma, sigmaY=blur_sigma)

    # 6. Camera Sensor ISO Noise
    noise_sigma = rng.uniform(1.6, 3.6)
    sensor_noise = np.random.normal(0, noise_sigma, img_np.shape)
    img_np = np.clip(img_np.astype(np.float32) + sensor_noise, 0, 255).astype(np.uint8)

    # 7. Realistic JPEG Compression (mimics camera save / WhatsApp / Telegram sharing)
    jpeg_quality = rng.randint(74, 91)
    img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), jpeg_quality]
    _, encimg = cv2.imencode(".jpg", img_bgr, encode_param)
    dec_bgr = cv2.imdecode(encimg, cv2.IMREAD_COLOR)
    final_rgb = cv2.cvtColor(dec_bgr, cv2.COLOR_BGR2RGB)

    return Image.fromarray(final_rgb)

def generate_single_sample(args):
    """
    Worker function to generate a single synthetic image sample.
    """
    idx, font_info, sentence, seed = args
    rng = random.Random(seed)
    np.random.seed(seed % (2**32))

    font_name = font_info["font_name"]
    font_file = os.path.join(FONTS_DIR, font_info["file_name"])
    filename = f"fake_{idx:04d}.jpg"
    filepath = os.path.join(OUTPUT_DIR, filename)

    # 1. Create notebook lined paper
    width = rng.randint(950, 1050)
    height = rng.randint(1200, 1300)
    line_spacing = rng.randint(42, 47)
    margin_x = rng.randint(120, 150)

    paper_img, line_y_list, margin_x = create_lined_paper(
        width=width,
        height=height,
        line_spacing=line_spacing,
        margin_x=margin_x,
        rng=rng
    )

    # 2. Render text
    rendered_note = render_handwritten_note(
        paper_img=paper_img,
        sentence=sentence,
        font_path=font_file,
        line_y_list=line_y_list,
        margin_x=margin_x,
        rng=rng
    )

    # 3. Apply photographic augmentations
    final_img = apply_photographic_augmentations(rendered_note, rng=rng)

    # 4. Save image
    final_img.save(filepath, "JPEG", quality=rng.randint(80, 92))

    return {
        "index": idx,
        "filename": filename,
        "font_used": font_name,
        "label": "fake"
    }

def generate_dataset(target_count=350, max_workers=8):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    fonts, sentences = load_fonts_and_sentences()

    print(f"Loaded {len(fonts)} unique handwriting fonts.")
    print(f"Loaded {len(sentences)} Indonesian sentences.")
    print(f"Target images to generate: {target_count}")

    # Build balanced font and sentence schedule
    # Repeat fonts and sentences evenly to reach target_count
    font_schedule = (fonts * math.ceil(target_count / len(fonts)))[:target_count]
    sentence_schedule = (sentences * math.ceil(target_count / len(sentences)))[:target_count]

    # Shuffle with fixed seed for balanced distribution
    rng_master = random.Random(42)
    rng_master.shuffle(font_schedule)
    rng_master.shuffle(sentence_schedule)

    tasks = []
    for i in range(target_count):
        idx = i + 1
        font_info = font_schedule[i]
        sentence = sentence_schedule[i]
        seed = 1000 + i * 37
        tasks.append((idx, font_info, sentence, seed))

    results = []
    completed = 0

    print(f"Starting parallel generation with {max_workers} worker processes...")
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(generate_single_sample, task): task for task in tasks}
        for future in as_completed(futures):
            res = future.result()
            results.append(res)
            completed += 1
            if completed % 50 == 0 or completed == target_count:
                print(f"Progress: {completed}/{target_count} ({completed/target_count*100:.1f}%) images generated.")

    # Sort results by index
    results.sort(key=lambda x: x["index"])

    # Write labels.csv
    with open(LABELS_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["filename", "font_used", "label"])
        writer.writeheader()
        for r in results:
            writer.writerow({
                "filename": r["filename"],
                "font_used": r["font_used"],
                "label": r["label"]
            })

    print("\n" + "="*55)
    print(f"SUCCESS: Generated {len(results)} synthetic images in {OUTPUT_DIR}")
    print(f"Labels saved to: {LABELS_PATH}")
    print("="*55)

    return len(results)

if __name__ == "__main__":
    import sys
    count = 350
    if len(sys.argv) > 1:
        count = int(sys.argv[1])
    generate_dataset(target_count=count)
