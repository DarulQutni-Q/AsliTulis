import os
import glob
import cv2
import numpy as np
import unittest
import joblib

import sys
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, PROJECT_ROOT)

from backend.app.features import extract_forensic_features
SYNTHETIC_DIR = os.path.join(PROJECT_ROOT, "backend", "data", "synthetic")
REAL_DIR = os.path.join(PROJECT_ROOT, "backend", "data", "real")
MODEL_PATH = os.path.join(PROJECT_ROOT, "backend", "models", "classifier.joblib")

class TestModelAccuracy(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        assert os.path.exists(MODEL_PATH), f"Model not found at {MODEL_PATH}"
        artifact = joblib.load(MODEL_PATH)
        cls.model = artifact["model"]

    def classify_image(self, img_bgr):
        features = extract_forensic_features(img_bgr)
        max_sim = features["max_sim"]
        clone_ratio = features["clone_ratio"]
        cluster_3plus = features.get("cluster_3plus_count", 0)
        
        is_hard_clone = (
            (max_sim >= 0.950) or
            (clone_ratio >= 0.035 and max_sim >= 0.930) or
            (cluster_3plus >= 1 and max_sim >= 0.930)
        )
        
        X_sample = np.array([features["feature_vector"]])
        pred = self.model.predict(X_sample)[0] # 0 = Fake, 1 = Real
        is_fake = is_hard_clone or (pred == 0)
        return is_fake, features

    def test_01_user_reported_fake_images(self):
        """
        Specifically tests fake_0012.jpg, fake_0020.jpg, and fake_0032.jpg.
        Must be detected as synthetic/fake.
        """
        reported = ["fake_0012.jpg", "fake_0020.jpg", "fake_0032.jpg"]
        for fname in reported:
            p = os.path.join(SYNTHETIC_DIR, fname)
            self.assertTrue(os.path.exists(p), f"Missing {fname}")
            img = cv2.imread(p)
            is_fake, feats = self.classify_image(img)
            self.assertTrue(
                is_fake,
                f"FAILED: {fname} was mistakenly classified as Authentic! "
                f"(max_sim={feats['max_sim']:.4f}, clone_ratio={feats['clone_ratio']:.4f}, c3={feats['cluster_3plus_count']})"
            )
        print("\n[PASSED] All user-reported fake images correctly identified as synthetic!")

    def test_02_all_synthetic_images_detected_as_fake(self):
        """
        Evaluates ALL 350 synthetic images in backend/data/synthetic/.
        Ensures 100% of fake images are classified as fake (0 false negatives).
        """
        syn_files = sorted(glob.glob(os.path.join(SYNTHETIC_DIR, "fake_*.jpg")))
        self.assertGreaterEqual(len(syn_files), 300)
        
        failed_fakes = []
        for p in syn_files:
            img = cv2.imread(p)
            if img is None:
                continue
            is_fake, feats = self.classify_image(img)
            if not is_fake:
                failed_fakes.append((os.path.basename(p), feats["max_sim"], feats["clone_ratio"]))
                
        self.assertEqual(
            len(failed_fakes), 0,
            f"{len(failed_fakes)} synthetic images were incorrectly classified as authentic: {failed_fakes[:10]}"
        )
        print(f"\n[PASSED] 100% ({len(syn_files)}/{len(syn_files)}) synthetic images correctly identified as synthetic!")

    def test_03_all_real_handwriting_detected_as_authentic(self):
        """
        Evaluates ALL real handwriting images in backend/data/real/ (WhatsApp student submissions + IAM).
        Ensures 100% of real images are classified as authentic (0 false positives).
        """
        real_files = sorted([
            p for p in glob.glob(os.path.join(REAL_DIR, "*"))
            if p.lower().endswith((".jpg", ".jpeg", ".png"))
        ])
        self.assertGreaterEqual(len(real_files), 50)
        
        failed_real = []
        for p in real_files:
            img = cv2.imread(p)
            if img is None:
                continue
            is_fake, feats = self.classify_image(img)
            if is_fake:
                failed_real.append((os.path.basename(p), feats["max_sim"], feats["clone_ratio"]))
                
        self.assertEqual(
            len(failed_real), 0,
            f"{len(failed_real)} real images were incorrectly classified as synthetic: {failed_real[:10]}"
        )
        print(f"\n[PASSED] 100% ({len(real_files)}/{len(real_files)}) real handwriting images correctly identified as authentic!")

if __name__ == "__main__":
    unittest.main()
