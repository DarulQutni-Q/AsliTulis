import cv2
import numpy as np
from typing import Dict, List, Tuple, Any

def preprocess_image(img_bgr: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """
    Converts image to grayscale, applies bilateral filtering to preserve stroke edges,
    and returns (gray, binary) with text as foreground (white) and background as black.
    """
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    # Mild denoising
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    
    # Otsu thresholding (invert so ink = 255, paper = 0)
    _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # Remove long horizontal ruling lines if any
    # Ruling lines are very wide (> 200px) and thin (<= 2px)
    h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (45, 1))
    lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, h_kernel)
    
    # Text mask without ruled lines
    text_binary = cv2.subtract(binary, lines)
    
    return gray, text_binary

def extract_glyph_candidates(text_binary: np.ndarray, max_glyphs: int = 160) -> List[Dict[str, Any]]:
    """
    Finds connected component contours representing character/sub-word glyphs.
    Filters out margins, paper boundaries, and speckles.
    """
    h_img, w_img = text_binary.shape
    mx = int(w_img * 0.04) # ignore outer 4% margins
    my = int(h_img * 0.04)
    
    contours, _ = cv2.findContours(text_binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    glyphs = []
    
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        
        # Exclude outer paper boundaries, margins, or binder punch holes
        if x < mx or (x + w) > (w_img - mx) or y < my or (y + h) > (h_img - my):
            continue
            
        # Valid character-sized components (filter out tiny dots, commas, speckles)
        area = cv2.contourArea(cnt)
        if 18 <= h <= 95 and 14 <= w <= 130 and area >= 60:
            aspect = w / float(h)
            if 0.20 <= aspect <= 3.0:
                # Extract normalized 32x32 glyph patch
                patch = text_binary[y:y+h, x:x+w]
                patch_norm = cv2.resize(patch, (32, 32), interpolation=cv2.INTER_AREA)
                
                density = area / float(w * h) if w * h > 0 else 0
                
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
    In true font/plotter text, recurring instances of the same letter have
    identical mathematical shape (NCC >= 0.93) and repeat systematically across multiple words.
    In human handwriting, motor variance causes natural fluctuations (coincidences are <= 0.88).
    
    Returns:
        clone_ratio: Fraction of tested glyphs that have an identical clone
        max_similarity: Highest correlation found between distinct glyphs
        top_clone_pairs: Coordinates and metadata for top detected cloned pairs
        cluster_3plus_count: Number of glyphs participating in multi-instance font clusters
    """
    if len(glyphs) < 6:
        return 0.0, 0.0, [], 0
        
    num_glyphs = len(glyphs)
    cloned_indices = set()
    max_sim = 0.0
    detected_pairs = []
    
    # Graph of clone matches at high confidence (>= 0.93)
    clone_matches = {i: set() for i in range(num_glyphs)}
    
    # Compare glyphs with similar aspect ratio and height
    for i in range(num_glyphs):
        g1 = glyphs[i]
        p1 = g1["patch"].astype(np.float32)
        norm1 = np.linalg.norm(p1)
        if norm1 < 1e-4:
            continue
            
        for j in range(i + 1, num_glyphs):
            g2 = glyphs[j]
            
            # Spatial separation: must be distinct occurrences (at least 25px apart)
            dx = abs(g1["center"][0] - g2["center"][0])
            dy = abs(g1["center"][1] - g2["center"][1])
            if dx < 25 and dy < 15:
                continue
                
            # Aspect ratio and height compatibility
            if abs(g1["aspect"] - g2["aspect"]) > 0.30:
                continue
            if abs(g1["height"] - g2["height"]) / max(g1["height"], g2["height"]) > 0.22:
                continue
                
            p2 = g2["patch"].astype(np.float32)
            norm2 = np.linalg.norm(p2)
            if norm2 < 1e-4:
                continue
                
            # Normalized Cross Correlation
            ncc = float(np.sum(p1 * p2) / (norm1 * norm2))
            
            if ncc > max_sim:
                max_sim = ncc
                
            # Strict threshold for true font template duplication (font glyphs are >= 0.93)
            if ncc >= 0.93:
                cloned_indices.add(i)
                cloned_indices.add(j)
                clone_matches[i].add(j)
                clone_matches[j].add(i)
                
            # Only record pairs with real, high-confidence clone resemblance (>= 0.91)
            if ncc >= 0.91:
                detected_pairs.append({
                    "score": round(ncc * 100, 1),
                    "g1": g1["bbox"],
                    "g2": g2["bbox"],
                    "height": g1["height"]
                })
                
    # Sort pairs by highest similarity
    detected_pairs = sorted(detected_pairs, key=lambda x: x["score"], reverse=True)
    
    # Count how many glyphs belong to multi-occurrence font clusters (clusters of size >= 3)
    cluster_3plus_count = sum(1 for i in range(num_glyphs) if len(clone_matches[i]) >= 2)
    
    # Keep top non-overlapping representative pairs
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
                "label": f"Glif Serupa • Korelasi {p['score']}%"
            })
            if len(curated_pairs) >= 3:
                break
                
    # In handwriting, 1 or 2 isolated pairs with 90-91% is sheer chance (e.g. two vertical stems of 'l').
    # A true font generator/plotter exhibits systemic repeating allographs across the document.
    if len(cloned_indices) < 6:
        clone_ratio = 0.0
    else:
        clone_ratio = len(cloned_indices) / float(num_glyphs) if num_glyphs > 0 else 0.0
        
    return clone_ratio, max_sim, curated_pairs, cluster_3plus_count

def compute_stroke_width_variance(text_binary: np.ndarray) -> Tuple[float, float]:
    """
    Measures pen pressure gradient and stroke width variation using Distance Transform.
    Digital font rendering has extremely uniform stroke thickness (low CV < 0.22).
    Genuine human ballpoint / ink handwriting has natural tapering, pen-up/pen-down pressure
    gradients, and speed variation (CV > 0.32).
    
    Returns:
        (mean_stroke_width, stroke_width_cv)
    """
    # Euclidean distance transform
    dist = cv2.distanceTransform(text_binary, cv2.DIST_L2, 5)
    
    # Morphological skeleton to isolate medial stroke axis
    skeleton = np.zeros(text_binary.shape, np.uint8)
    element = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))
    temp_bin = text_binary.copy()
    
    for _ in range(12):
        eroded = cv2.erode(temp_bin, element)
        temp = cv2.dilate(eroded, element)
        temp = cv2.subtract(temp_bin, temp)
        skeleton = cv2.bitwise_or(skeleton, temp)
        temp_bin = eroded.copy()
        if cv2.countNonZero(temp_bin) == 0:
            break
            
    # Sample stroke radii along the skeleton
    stroke_radii = dist[skeleton > 0]
    
    if len(stroke_radii) < 20:
        return 1.5, 0.25
        
    # Stroke width = 2 * radius
    stroke_widths = stroke_radii * 2.0
    mean_sw = float(np.mean(stroke_widths))
    std_sw = float(np.std(stroke_widths))
    cv_sw = float(std_sw / mean_sw) if mean_sw > 1e-4 else 0.0
    
    return mean_sw, cv_sw

def compute_baseline_rigidity(glyphs: List[Dict[str, Any]], img_h: int) -> Tuple[float, float]:
    """
    Groups glyphs into horizontal lines and calculates standard deviation of vertical residuals
    from the fitted baseline.
    Font-rendered text has a mathematically rigid baseline (low std < 1.4 px, high rigidity %).
    Human writing naturally meanders and fluctuates vertically (std > 3.2 px).
    
    Returns:
        (baseline_residual_std, baseline_rigidity_pct)
    """
    if len(glyphs) < 10:
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
            
    if len(residuals) < 8:
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
    2. Stroke width coefficient of variation
    3. Baseline rigidity & residual std
    4. Glyph size entropy
    
    Returns structured feature dict for classifier and UI visualization.
    """
    h_img, w_img = img_bgr.shape[:2]
    gray, text_binary = preprocess_image(img_bgr)
    
    # Extract glyph candidates
    glyphs = extract_glyph_candidates(text_binary, max_glyphs=140)
    
    # 1. Cloned glyphs
    clone_ratio, max_sim, top_pairs, cluster_3plus_count = compute_glyph_cloning(glyphs)
    
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
        
    feature_vector = [
        clone_ratio,
        max_sim,
        stroke_cv,
        res_std,
        height_cv
    ]
    
    return {
        "feature_vector": feature_vector,
        "clone_ratio": clone_ratio,
        "max_sim": max_sim,
        "stroke_cv": stroke_cv,
        "baseline_res_std": res_std,
        "baseline_rigidity": baseline_rigidity,
        "height_cv": height_cv,
        "num_glyphs_analyzed": len(glyphs),
        "cluster_3plus_count": cluster_3plus_count,
        "top_pairs": top_pairs,
        "img_width": w_img,
        "img_height": h_img
    }
