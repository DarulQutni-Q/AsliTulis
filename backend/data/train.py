import os
import glob
import cv2
import numpy as np
import pandas as pd
import joblib
from concurrent.futures import ProcessPoolExecutor
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import StratifiedKFold, cross_validate

import sys
SCRIPT_DIR = os.path.dirname(__file__)
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
sys.path.insert(0, PROJECT_ROOT)

from backend.app.features import extract_forensic_features

DATA_DIR = os.path.join(PROJECT_ROOT, "backend", "data")
SYNTHETIC_DIR = os.path.join(DATA_DIR, "synthetic")
REAL_DIR = os.path.join(DATA_DIR, "real")
MODELS_DIR = os.path.join(PROJECT_ROOT, "backend", "models")
MODEL_OUTPUT_PATH = os.path.join(MODELS_DIR, "classifier.joblib")

def process_single_image(args):
    path, label = args
    try:
        img = cv2.imread(path)
        if img is None:
            return None
        res = extract_forensic_features(img)
        return {
            "path": path,
            "label": label,
            "clone_ratio": res["clone_ratio"],
            "max_sim": res["max_sim"],
            "stroke_cv": res["stroke_cv"],
            "baseline_res_std": res["baseline_res_std"],
            "height_cv": res["height_cv"],
            "cluster_3plus_count": res["cluster_3plus_count"],
            "ink_std": res["ink_std"]
        }
    except Exception as e:
        print(f"Error extracting features from {path}: {e}")
        return None

def extract_all_dataset_features():
    tasks = []
    
    # Fake synthetic images (label 0)
    syn_files = sorted(glob.glob(os.path.join(SYNTHETIC_DIR, "fake_*.jpg")))
    for p in syn_files:
        tasks.append((p, 0))
        
    # Real handwriting images (label 1)
    real_patterns = ["real_*.jpg", "WhatsApp Image*.jpeg", "real_user_*.jpg", "*.png"]
    real_files = []
    for pat in real_patterns:
        real_files.extend(glob.glob(os.path.join(REAL_DIR, pat)))
    real_files = sorted(list(set(real_files)))
    for p in real_files:
        tasks.append((p, 1))
        
    print(f"Extracting forensic features from {len(tasks)} samples ({len(syn_files)} fake, {len(real_files)} real)...")
    
    records = []
    with ProcessPoolExecutor(max_workers=4) as executor:
        results = executor.map(process_single_image, tasks)
        for r in results:
            if r is not None:
                records.append(r)
                
    df = pd.DataFrame(records)
    print(f"Extraction complete! Dataset shape: {df.shape}")
    return df

def train_and_evaluate_model():
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    df = extract_all_dataset_features()
    if len(df) < 20:
        raise ValueError(f"Dataset too small ({len(df)} samples). Ensure images exist in synthetic/ and real/.")
        
    feature_cols = [
        "clone_ratio",
        "max_sim",
        "stroke_cv",
        "baseline_res_std",
        "height_cv",
        "cluster_3plus_count",
        "ink_std"
    ]
    X = df[feature_cols].values
    y = df["label"].values
    
    print("\nFeature Summary by Class:")
    for label_val, name in [(0, "Fake (Font/Plotter)"), (1, "Real (Human)")]:
        sub = df[df["label"] == label_val]
        print(f"\n--- {name} (N={len(sub)}) ---")
        for col in feature_cols:
            print(f"  {col:20s}: mean={sub[col].mean():.4f}, std={sub[col].std():.4f}")
            
    # Pipeline: StandardScaler + RandomForestClassifier
    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(n_estimators=200, max_depth=10, min_samples_split=2, random_state=42))
    ])
    
    # 5-fold cross validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_validate(pipe, X, y, cv=cv, scoring=["accuracy", "precision", "recall", "f1", "roc_auc"])
    
    print("\n5-Fold Stratified Cross-Validation Results:")
    print(f"  Accuracy:  {scores['test_accuracy'].mean():.4f} (+/- {scores['test_accuracy'].std():.4f})")
    print(f"  Precision: {scores['test_precision'].mean():.4f} (+/- {scores['test_precision'].std():.4f})")
    print(f"  Recall:    {scores['test_recall'].mean():.4f} (+/- {scores['test_recall'].std():.4f})")
    print(f"  F1 Score:  {scores['test_f1'].mean():.4f} (+/- {scores['test_f1'].std():.4f})")
    print(f"  ROC-AUC:   {scores['test_roc_auc'].mean():.4f} (+/- {scores['test_roc_auc'].std():.4f})")
    
    # Fit on all data
    pipe.fit(X, y)
    
    # Feature importances
    importances = pipe.named_steps["clf"].feature_importances_
    feat_imp = {col: round(float(imp), 4) for col, imp in zip(feature_cols, importances)}
    print("\nFeature Importances:")
    for col, imp in sorted(feat_imp.items(), key=lambda x: x[1], reverse=True):
        print(f"  {col:20s}: {imp * 100:.1f}%")
        
    # Save model bundle
    artifact = {
        "model": pipe,
        "feature_cols": feature_cols,
        "feature_importances": feat_imp,
        "cv_accuracy": float(scores['test_accuracy'].mean()),
        "cv_roc_auc": float(scores['test_roc_auc'].mean())
    }
    
    joblib.dump(artifact, MODEL_OUTPUT_PATH)
    print(f"\nModel artifact successfully saved to: {MODEL_OUTPUT_PATH}")

if __name__ == "__main__":
    train_and_evaluate_model()
