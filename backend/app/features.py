import cv2
import numpy as np
from typing import Dict, List, Tuple, Any

def preprocess_image(img_bgr: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """
    Converts image to grayscale, applies illumination-invariant background estimation,
    removes printed notebook margin lines and top header markings,
    and returns (gray, text_binary) with ink strokes as 255 and paper as 0.
    """
    h_img, w_img = img_bgr.shape[:2]
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    # Denoise
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    
    # Illumination-invariant background estimation:
    # Morphological dilation on blurred grayscale finds local paper background luminance
    # Subtracting blurred from bg isolates foreground ink strokes regardless of phone shadows or vignettes.
    bg = cv2.morphologyEx(blurred, cv2.MORPH_DILATE, cv2.getStructuringElement(cv2.MORPH_RECT, (25, 25)))
    diff = cv2.absdiff(bg, blurred)
    
    # High-contrast thresholding on difference image
    _, binary = cv2.threshold(diff, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Exclude top 12% printed notebook header (factory brand logos, checkboxes, spiral wire holes)
    binary[:int(h_img * 0.12), :] = 0
    # Exclude bottom 7% margin (desk border, table shadows, notebook outer edges)
    binary[int(h_img * 0.93):, :] = 0
    
    # Remove vertical notebook margin lines (typically red or dark lines spanning > 45px vertically)
    v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 45))
    v_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, v_kernel)
    v_lines = cv2.dilate(v_lines, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 1)))
    text_binary = cv2.subtract(binary, v_lines)
    
    return gray, text_binary

def normalize_glyph_patch(patch: np.ndarray, target_size: int = 32) -> np.ndarray:
    """
    Normalizes a glyph patch onto a fixed-size canvas while strictly preserving aspect ratio.
    Prevents artificial cross-correlation inflation from stretching thin vertical lines into identical squares.
    """
    h, w = patch.shape[:2]
    if h == 0 or w == 0:
        return np.zeros((target_size, target_size), dtype=np.uint8)
    scale = (target_size - 4) / max(h, w)
    new_w = max(1, int(round(w * scale)))
    new_h = max(1, int(round(h * scale)))
    resized = cv2.resize(patch, (new_w, new_h), interpolation=cv2.INTER_AREA)
    canvas = np.zeros((target_size, target_size), dtype=np.uint8)
    start_x = (target_size - new_w) // 2
    start_y = (target_size - new_h) // 2
    canvas[start_y:start_y+new_h, start_x:start_x+new_w] = resized
    return canvas

def extract_glyph_candidates(text_binary: np.ndarray, max_glyphs: int = 160) -> List[Dict[str, Any]]:
    """
    Finds connected component contours representing character/sub-word glyphs.
    Filters out margins, paper boundaries, extreme 1D line segments, and speckles.
    """
    h_img, w_img = text_binary.shape
    mx = int(w_img * 0.03) # ignore outer 3% margins
    my = int(h_img * 0.03)
    
    contours, _ = cv2.findContours(text_binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    glyphs = []
    
    # Adaptive dimension thresholds proportional to image scan resolution
    min_h = max(16, int(h_img * 0.006))
    min_w = max(12, int(w_img * 0.005))
    min_area = max(65, int(min_h * min_w * 0.35))
    max_h = max(110, int(h_img * 0.08))
    max_w = max(140, int(w_img * 0.12))
    
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        
        # Exclude outer paper boundaries or binder punch holes
        if x < mx or (x + w) > (w_img - mx) or y < my or (y + h) > (h_img - my):
            continue
            
        area = cv2.contourArea(cnt)
        # Valid character-sized components: lowercase letters to capitals
        if min_h <= h <= max_h and min_w <= w <= max_w and area >= min_area:
            aspect = w / float(h)
            density = area / float(w * h) if w * h > 0 else 0
            # Exclude extreme 1D line segments (slashes, thin sticks) while keeping valid letter shapes
            if 0.35 <= aspect <= 3.0 and 0.12 <= density <= 0.70:
                patch = text_binary[y:y+h, x:x+w]
                patch_norm = normalize_glyph_patch(patch, target_size=32)
                glyphs.append({
                    "bbox": (x, y, w, h),
                    "aspect": aspect,
                    "height": h,
                    "width": w,
                    "area": area,
                    "patch": patch_norm,
                    "density": density,
                    "center": (x + w / 2.0, y + h / 2.0)
                })
                
    # Sort glyphs by position: top-to-bottom, left-to-right
    glyphs = sorted(glyphs, key=lambda g: (g["center"][1] // 35, g["center"][0]))
    return glyphs[:max_glyphs]

def compute_glyph_cloning(glyphs: List[Dict[str, Any]]) -> Tuple[float, float, List[Dict[str, Any]], int]:
    """
    Compares candidate glyphs pairwise across the document.
    Identifies systemic font repetition.
    In digital fonts and pen-plotters, repeating instances of the same letter have
    near-identical mathematical shapes (NCC >= 0.93) and repeat systematically.
    In human handwriting, motor variance causes natural fluctuations (real letters are <= 0.925).
    
    Returns:
        clone_ratio: Fraction of tested glyphs that have an identical clone
        max_similarity: Highest correlation found between distinct glyphs
        top_clone_pairs: Coordinates and metadata for top detected cloned pairs
        cluster_3plus_count: Number of glyphs participating in multi-instance font clusters
    """
    if len(glyphs) < 4:
        return 0.0, 0.0, [], 0, 0
        
    num_glyphs = len(glyphs)
    cloned_indices = set()
    max_sim = 0.0
    detected_pairs = []
    
    # Graph of clone matches at high confidence (>= 0.93)
    clone_matches = {i: set() for i in range(num_glyphs)}
    
    # Compare glyphs with compatible aspect ratio and height
    for i in range(min(num_glyphs, 150)):
        g1 = glyphs[i]
        p1 = g1["patch"].astype(np.float32)
        norm1 = np.linalg.norm(p1)
        if norm1 < 1e-4:
            continue
            
        for j in range(i + 1, min(num_glyphs, 150)):
            g2 = glyphs[j]
            
            # Spatial separation: must be distinct occurrences (at least 20px apart horizontally or 12px vertically)
            dx = abs(g1["center"][0] - g2["center"][0])
            dy = abs(g1["center"][1] - g2["center"][1])
            if dx < 20 and dy < 12:
                continue
                
            p2 = g2["patch"].astype(np.float32)
            norm2 = np.linalg.norm(p2)
            if norm2 < 1e-4:
                continue
                
            # Normalized Cross Correlation
            ncc = float(np.sum(p1 * p2) / (norm1 * norm2))
            
            # Aspect ratio and height difference
            aspect_diff = abs(g1["aspect"] - g2["aspect"])
            height_diff = abs(g1["height"] - g2["height"]) / max(g1["height"], g2["height"])
            
            # Strict clone criteria for classification features
            if aspect_diff <= 0.25 and height_diff <= 0.20:
                if ncc > max_sim:
                    max_sim = ncc
                if ncc >= 0.94:
                    cloned_indices.add(i)
                    cloned_indices.add(j)
                    clone_matches[i].add(j)
                    clone_matches[j].add(i)
                    
            # Candidate pairs for visual annotation (ranking ensures top 5 pairs always selected)
            if height_diff <= 0.40 and aspect_diff <= 0.50:
                detected_pairs.append({
                    "score": round(ncc * 100, 1),
                    "g1": g1["bbox"],
                    "g2": g2["bbox"],
                    "height": g1["height"]
                })
                
    # Sort pairs by highest similarity
    detected_pairs = sorted(detected_pairs, key=lambda x: x["score"], reverse=True)
    
    # Count how many glyphs belong to multi-occurrence font clusters
    # cluster_3plus: clusters of size >= 3 (matches >= 2)
    cluster_3plus_count = sum(1 for i in range(num_glyphs) if len(clone_matches[i]) >= 2)
    # cluster_5plus: clusters of size >= 5 (matches >= 4)
    cluster_5plus_count = sum(1 for i in range(num_glyphs) if len(clone_matches[i]) >= 4)
    
    # Keep top 5 non-overlapping representative pairs
    curated_pairs = []
    seen_boxes = set()
    pin_symbols = ["①", "②", "③", "④", "⑤"]
    
    for p in detected_pairs:
        b1, b2 = p["g1"], p["g2"]
        if b1 not in seen_boxes and b2 not in seen_boxes:
            seen_boxes.add(b1)
            seen_boxes.add(b2)
            pin = pin_symbols[len(curated_pairs) % len(pin_symbols)]
            curated_pairs.append({
                "pin": pin,
                "score": p["score"],
                "box1": {"x": b1[0], "y": b1[1], "w": b1[2], "h": b1[3]},
                "box2": {"x": b2[0], "y": b2[1], "w": b2[2], "h": b2[3]},
                "label": f"Glif Kembar {pin} • Korelasi {p['score']}%"
            })
            if len(curated_pairs) >= 5:
                break
                
    clone_ratio = len(cloned_indices) / float(num_glyphs) if num_glyphs > 0 else 0.0
    return clone_ratio, max_sim, curated_pairs, cluster_3plus_count, cluster_5plus_count

def compute_stroke_width_variance(text_binary: np.ndarray) -> Tuple[float, float]:
    """
    Measures pen pressure gradient and stroke width variation using Euclidean Distance Transform.
    Digital font rendering has extremely uniform stroke thickness (low CV < 0.25).
    Genuine human ballpoint / ink handwriting has natural tapering, pen-up/pen-down pressure
    gradients, and speed variation (CV > 0.35).
    
    Returns:
        (mean_stroke_width, stroke_width_cv)
    """
    dist = cv2.distanceTransform(text_binary, cv2.DIST_L2, 5)
    sw = dist[dist > 0]
    if len(sw) < 30:
        return 1.5, 0.35
    sw_mean = float(np.mean(sw))
    sw_std = float(np.std(sw))
    sw_cv = float(sw_std / sw_mean) if sw_mean > 0 else 0.35
    return sw_mean, sw_cv

def compute_ink_color_variance(img_bgr: np.ndarray, text_binary: np.ndarray) -> float:
    """
    Measures the standard deviation of pixel color values across ink strokes.
    Digital font rendering uses a uniform RGB fill color (low std < 20.0).
    Real human handwriting exhibits natural ink pool depletion, solvent absorption into paper fibers,
    and pressure shading (std >= 25.0).
    """
    ink_pixels = img_bgr[text_binary > 0]
    if len(ink_pixels) < 20:
        return 30.0
    return float(np.std(ink_pixels))

def compute_baseline_rigidity(glyphs: List[Dict[str, Any]], img_h: int) -> Tuple[float, float]:
    """
    Groups glyphs into horizontal lines and calculates standard deviation of vertical residuals
    from the fitted baseline.
    Font-rendered text has a mathematically rigid baseline (low std < 1.8 px, high rigidity %).
    Human writing naturally meanders and fluctuates vertically (std > 3.0 px).
    
    Returns:
        (baseline_residual_std, baseline_rigidity_pct)
    """
    if len(glyphs) < 6:
        return 2.5, 75.0
        
    # Group by line based on y-coordinate clustering
    sorted_by_y = sorted(glyphs, key=lambda g: g["bbox"][1] + g["bbox"][3])
    lines = []
    curr_line = [sorted_by_y[0]]
    
    for g in sorted_by_y[1:]:
        base_y = g["bbox"][1] + g["bbox"][3]
        prev_base_y = curr_line[-1]["bbox"][1] + curr_line[-1]["bbox"][3]
        if abs(base_y - prev_base_y) < 28:
            curr_line.append(g)
        else:
            if len(curr_line) >= 4:
                lines.append(curr_line)
            curr_line = [g]
            
    if len(curr_line) >= 4:
        lines.append(curr_line)
        
    residuals = []
    for line in lines:
        pts = [(g["center"][0], g["bbox"][1] + g["bbox"][3]) for g in line]
        pts = sorted(pts, key=lambda p: p[0])
        xs = np.array([p[0] for p in pts], dtype=np.float32)
        ys = np.array([p[1] for p in pts], dtype=np.float32)
        
        # Fit 1st order polynomial (line)
        if len(xs) >= 3 and (xs.max() - xs.min()) > 60:
            poly = np.polyfit(xs, ys, 1)
            predicted_ys = np.polyval(poly, xs)
            res = ys - predicted_ys
            residuals.extend(res.tolist())
            
    if len(residuals) < 6:
        return 2.0, 80.0
        
    res_std = float(np.std(residuals))
    
    # Rigidity formula: std <= 1.0 -> 99.5% rigid, std >= 5.0 -> 40% rigid
    rigidity_pct = max(10.0, min(99.9, 100.0 - (res_std * 14.5)))
    return res_std, rigidity_pct

def extract_forensic_features(img_bgr: np.ndarray) -> Dict[str, Any]:
    """
    Main forensic extraction pipeline.
    Combines:
    1. Glyph duplication / clone ratio
    2. Maximum glyph similarity (NCC)
    3. Stroke width coefficient of variation
    4. Baseline residual std & rigidity
    5. Glyph height variation (height_cv)
    6. Cluster 3+ count (multi-instance font repetition)
    7. Ink color standard deviation (pigment shading gradient)
    
    Returns structured feature dict for classifier and UI visualization.
    """
    h_img, w_img = img_bgr.shape[:2]
    gray, text_binary = preprocess_image(img_bgr)
    
    # Extract glyph candidates
    glyphs = extract_glyph_candidates(text_binary, max_glyphs=150)
    
    # 1. Cloned glyphs & repetition
    clone_ratio, max_sim, top_pairs, cluster_3plus_count, cluster_5plus_count = compute_glyph_cloning(glyphs)
    
    # 2. Stroke width variation
    mean_sw, stroke_cv = compute_stroke_width_variance(text_binary)
    
    # 3. Baseline rigidity
    res_std, baseline_rigidity = compute_baseline_rigidity(glyphs, h_img)
    
    # 4. Glyph height entropy (variation of character height)
    if glyphs:
        heights = [g["height"] for g in glyphs]
        height_cv = float(np.std(heights) / np.mean(heights)) if np.mean(heights) > 0 else 0.0
    else:
        height_cv = 0.2
        
    # 5. Ink pigment variation
    ink_std = compute_ink_color_variance(img_bgr, text_binary)
        
    feature_vector = [
        clone_ratio,
        max_sim,
        stroke_cv,
        res_std,
        height_cv,
        cluster_3plus_count,
        ink_std
    ]
    
    return {
        "feature_vector": feature_vector,
        "clone_ratio": clone_ratio,
        "max_sim": max_sim,
        "stroke_cv": stroke_cv,
        "baseline_res_std": res_std,
        "baseline_rigidity": baseline_rigidity,
        "height_cv": height_cv,
        "cluster_3plus_count": cluster_3plus_count,
        "cluster_5plus_count": cluster_5plus_count,
        "ink_std": ink_std,
        "num_glyphs_analyzed": len(glyphs),
        "top_pairs": top_pairs,
        "glyphs": glyphs,
        "img_width": w_img,
        "img_height": h_img
    }
