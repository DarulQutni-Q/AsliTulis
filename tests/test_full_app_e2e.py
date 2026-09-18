import os
import sys
import time
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = "tests/screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

REAL_IMAGE_PATH = "/home/darulqutni/AsliTulis/frontend/assets/samples/sample_real_user.jpg"

def run_tests():
    print("=== STARTING ASLITULIS COMPLETE E2E TEST SUITE ===")
    
    with sync_playwright() as p:
        # Launch Chromium using system binary
        browser = p.chromium.launch(
            executable_path="/usr/sbin/chromium",
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        )
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # -------------------------------------------------------------
        # TEST 1: Load Page & Verify Clean Header (No Useless NIP, No Green Pulse Dot)
        # -------------------------------------------------------------
        print("\n[TEST 1] Loading http://localhost:8000 ...")
        page.goto("http://localhost:8000", wait_until="networkidle")
        title = page.title()
        print(f"  Page Title: {title}")
        assert "AsliTulis" in title, f"Title does not match: {title}"

        # Verify header has clean branding and new upload button, no redundant mock badges
        header_text = page.locator("header").inner_text()
        assert "AsliTulis" in header_text, "Brand logo title missing"
        assert "Uji Naskah Baru" in header_text, f"New Upload button missing: {header_text}"
        assert "LAB ENGINE" not in header_text, "Found redundant mock LAB ENGINE badge in header!"
        assert "43 Model Alograf" not in header_text, "Found redundant mock 43 Model Alograf text in header!"
        assert "NIP" not in header_text, "Found unwanted NIP bureaucratic text in header!"
        
        # Verify no tacky pulsating green dot and no fake mock glyph comparison card
        assert page.locator("header .animate-pulse").count() == 0, "Found tacky pulsating green dot in header!"
        assert page.locator("#glyph-comparison-card").count() == 0, "Found fake mock glyph comparison card!"
        print("  ✓ Test 1 Passed: Clean editorial header loaded without redundant badges, dots, or fake mock cards.")

        # -------------------------------------------------------------
        # TEST 2: Navigation Links Between Views
        # -------------------------------------------------------------
        print("\n[TEST 2] Testing Navigation Tabs ...")
        
        # Lembar Analisis
        page.click("button.nav-link[data-view='lembar-analisis']")
        page.wait_for_timeout(300)
        assert page.locator("#view-lembar-analisis").is_visible(), "Lembar Analisis view should be visible"
        print("  ✓ Tab 'Lembar Analisis' active")

        # Buku Catatan Arsip
        page.click("button.nav-link[data-view='arsip-pengujian']")
        page.wait_for_timeout(300)
        assert page.locator("#view-arsip-pengujian").is_visible(), "Buku Catatan Arsip view should be visible"
        print("  ✓ Tab 'Buku Catatan Arsip' active")

        # Back to Pemeriksaan Berkas
        page.click("button.nav-link[data-view='pemeriksaan-berkas']")
        page.wait_for_timeout(300)
        assert page.locator("#view-pemeriksaan-berkas").is_visible(), "Pemeriksaan Berkas view should be visible"
        print("  ✓ Tab 'Pemeriksaan Berkas' active")
        print("  ✓ Test 2 Passed: Navigation tabs switch views smoothly.")

        # -------------------------------------------------------------
        # TEST 3: Demo Scan Flow (Synthetic Specimen)
        # -------------------------------------------------------------
        print("\n[TEST 3] Testing Demo Simulation ...")
        page.click("#btn-demo")
        
        # Wait for scanning sequence and auto-navigation to lembar-analisis
        page.wait_for_selector("#view-lembar-analisis.active", timeout=15000)
        page.wait_for_timeout(1000)
        
        verdict_pill = page.locator("#doc-verdict-pill").inner_text()
        prob_text = page.locator("#prob-number").inner_text()
        print(f"  Demo Verdict Pill: {verdict_pill}, Probability: {prob_text}")
        assert "TERINDIKASI" in verdict_pill, "Demo should trigger synthetic indication"
        
        page.screenshot(path=f"{SCREENSHOT_DIR}/01_demo_scan_result.png")
        print("  ✓ Test 3 Passed: Demo scan completed, classified, and displayed in Lembar Analisis.")

        # -------------------------------------------------------------
        # TEST 4: Inspection Desk Toolbar Controls & Print Verification
        # -------------------------------------------------------------
        print("\n[TEST 4] Testing Inspection Desk Toolbar Controls ...")
        
        # Verify initial state: Ruler grid is visible
        assert page.locator("#ruler-grid-overlay").is_visible(), "Ruler grid overlay should be visible initially"
        assert "bg-primary" in (page.locator("#btn-toggle-ruler").get_attribute("class") or ""), "Ruler button should have active class initially"

        # Toggle Ruler OFF
        page.click("#btn-toggle-ruler")
        page.wait_for_timeout(200)
        assert not page.locator("#ruler-grid-overlay").is_visible(), "Ruler grid should be hidden after toggle"
        assert "Tampilkan" in page.locator("#label-toggle-ruler").inner_text()

        # Toggle Ruler back ON
        page.click("#btn-toggle-ruler")
        page.wait_for_timeout(200)
        assert page.locator("#ruler-grid-overlay").is_visible(), "Ruler grid should be visible again"
        assert "Sembunyikan" in page.locator("#label-toggle-ruler").inner_text()
        print("  ✓ Ruler grid toggle verified with high-contrast calibration overlay and button state")

        # Toggle Annotations
        page.click("#btn-toggle-annotations")
        page.wait_for_timeout(200)
        assert "Nonaktif" in page.locator("#label-toggle-annotations").inner_text()
        page.click("#btn-toggle-annotations")
        page.wait_for_timeout(200)
        print("  ✓ Annotations toggle verified")

        # Toggle Loupe
        page.click("#btn-toggle-loupe")
        page.wait_for_timeout(200)
        assert "Aktif" in page.locator("#label-toggle-loupe").inner_text()
        page.click("#btn-toggle-loupe")
        page.wait_for_timeout(200)
        print("  ✓ Loupe 2.5x toggle verified")

        # 5 Forensic Methods Modal
        page.click("#btn-open-methods-modal")
        page.wait_for_selector("#methods-modal.open", timeout=3000)
        methods_content = page.locator("#methods-modal").inner_text()
        assert "5 Metode Pembeda" in methods_content, "Methods modal content missing"
        assert "Dynamic Time Warping" in methods_content, "DTW method missing in modal"
        page.click("#btn-close-methods-modal")
        page.wait_for_timeout(300)
        assert "open" not in (page.locator("#methods-modal").get_attribute("class") or ""), "Methods modal should be closed"
        print("  ✓ 5 Forensic Methods modal open/close verified")

        # Official Report Modal
        page.click("#btn-print-report")
        page.wait_for_selector("#report-modal.open", timeout=3000)
        report_content = page.locator("#report-modal-body").inner_text()
        assert "BERITA ACARA AUDIT FORENSIK TULISAN TANGAN" in report_content
        assert "NIP" not in report_content, "Bureaucratic NIP found in official report!"
        assert "AsliTulis Engine Core" in report_content
        page.click("#btn-close-modal")
        page.wait_for_timeout(300)
        assert "open" not in (page.locator("#report-modal").get_attribute("class") or ""), "Report modal should be closed"
        print("  ✓ Official Report modal open/close verified without NIP form")

        # Copy Summary Clipboard
        page.click("#btn-copy-summary")
        page.wait_for_timeout(300)
        copy_label = page.locator("#label-copy-summary").inner_text()
        assert "Tersalin" in copy_label, f"Copy label did not update: {copy_label}"
        print("  ✓ Copy forensic summary to clipboard button verified")

        # -------------------------------------------------------------
        # PRINT MEDIA AUDIT (Verify NO Buttons in PDF output)
        # -------------------------------------------------------------
        print("  Checking @media print rules (guaranteeing 0 buttons in PDF) ...")
        page.emulate_media(media="print")
        page.wait_for_timeout(300)
        
        # Verify all toolbar buttons are hidden in print
        assert not page.locator("#btn-toggle-ruler").is_visible(), "Ruler toggle button must be HIDDEN in print/PDF"
        assert not page.locator("#btn-toggle-annotations").is_visible(), "Annotations button must be HIDDEN in print/PDF"
        assert not page.locator("#btn-toggle-loupe").is_visible(), "Loupe button must be HIDDEN in print/PDF"
        assert not page.locator("#btn-open-methods-modal").is_visible(), "5 Methods button must be HIDDEN in print/PDF"
        assert not page.locator("#btn-header-new-upload").is_visible(), "Header new upload button must be HIDDEN in print/PDF"
        assert not page.locator("#btn-print-report").is_visible(), "Print report button must be HIDDEN in print/PDF"
        assert not page.locator("#btn-copy-summary").is_visible(), "Copy summary button must be HIDDEN in print/PDF"
        assert not page.locator("#specimen-choice-container").is_visible(), "Specimen buttons must be HIDDEN in print/PDF"
        
        # Switch back to screen media
        page.emulate_media(media="screen")
        page.wait_for_timeout(200)
        print("  ✓ PDF / Print Media Audit: ZERO unprintable buttons appear in PDF export.")

        print("  ✓ Test 4 Passed: All toolbar controls, modals, and print rules verified.")

        # -------------------------------------------------------------
        # TEST 5: Specimen Switcher Buttons & Authentic Green Theme Verification
        # -------------------------------------------------------------
        print("\n[TEST 5] Testing Specimen Quick Switcher & Green Metric Styling ...")
        
        # Test Mali
        page.click("button.btn-specimen-choice[data-specimen='mali']")
        page.wait_for_timeout(400)
        assert "Siti Rahmawati" in page.locator("#exam-student-header").inner_text()
        print("  ✓ Specimen 'Mali' rendered")

        # Test Dekko
        page.click("button.btn-specimen-choice[data-specimen='dekko']")
        page.wait_for_timeout(400)
        assert "Rafi Aditya" in page.locator("#exam-student-header").inner_text()
        print("  ✓ Specimen 'Dekko' rendered")

        # Test User Handwriting (Authentic Sample)
        page.click("button.btn-specimen-choice[data-specimen='user_handwriting']")
        page.wait_for_timeout(400)
        student_header = page.locator("#exam-student-header").inner_text()
        verdict_status = page.locator("#stat-status-badge").inner_text()
        verdict_pill = page.locator("#doc-verdict-pill").inner_text()
        prob_text = page.locator("#prob-number").inner_text()
        prob_label = page.locator("#prob-label").inner_text()
        
        print(f"  Authentic Specimen Header: {student_header}")
        print(f"  Status Badge: {verdict_status}, Pill: {verdict_pill}, Metric: {prob_label} {prob_text}")
        
        assert "LOLOS" in verdict_status or "OTENTIK" in verdict_status, f"Expected authentic verdict, got {verdict_status}"
        assert "LOLOS (OTENTIK)" in verdict_pill
        
        # VERIFY EMERALD GREEN HIGHLIGHTS FOR AUTHENTIC RESULTS
        assert "text-emerald-600" in (page.locator("#prob-number").get_attribute("class") or ""), "Percentage number MUST be colored EMERALD GREEN for authentic!"
        assert "text-emerald-700" in (page.locator("#prob-label").get_attribute("class") or ""), "Metric label MUST be colored EMERALD GREEN for authentic!"
        assert "text-emerald-700" in (page.locator("#val-entropy").get_attribute("class") or ""), "Entropy metric MUST be EMERALD GREEN for authentic!"
        assert "bg-emerald-100" in (page.locator("#doc-verdict-pill").get_attribute("class") or ""), "Verdict pill MUST be EMERALD GREEN for authentic!"
        print("  ✓ Authentic Green Theme Verified: All percentages, labels, and parameters shine in vivid emerald green.")
        
        page.screenshot(path=f"{SCREENSHOT_DIR}/02_authentic_specimen.png")
        print("  ✓ Test 5 Passed: Specimen switching works, authentic sample is correctly verified with green theme.")

        # -------------------------------------------------------------
        # TEST 6: Real Upload of User's Actual Handwritten Image & + Uji Naskah Baru Button
        # -------------------------------------------------------------
        print("\n[TEST 6] Testing '+ Uji Naskah Baru' Button & Real File Classification ...")
        
        # Click header new upload to reset to view 1
        page.click("#btn-header-new-upload")
        page.wait_for_timeout(400)
        assert page.locator("#view-pemeriksaan-berkas").is_visible(), "Should switch back to upload desk"
        assert page.locator("#drop-zone").is_visible(), "Dropzone should be visible after clicking + Uji Naskah Baru"
        print("  ✓ Reset to Meja Periksa via #btn-header-new-upload works seamlessly")

        # Upload the user's authentic handwritten image file
        print(f"  Uploading: {REAL_IMAGE_PATH}")
        page.set_input_files("#file-input", REAL_IMAGE_PATH)
        
        # Wait for real scan and analysis sequence to finish
        page.wait_for_selector("#view-lembar-analisis.active", timeout=20000)
        page.wait_for_timeout(1000)

        # Verify real analysis result
        real_status_badge = page.locator("#stat-status-badge").inner_text()
        real_verdict_pill = page.locator("#doc-verdict-pill").inner_text()
        real_prob = page.locator("#prob-number").inner_text()
        
        print(f"  Real File Verdict: {real_status_badge} | {real_verdict_pill} | Index: {real_prob}")
        assert "LOLOS" in real_status_badge or "OTENTIK" in real_status_badge, f"User's real handwriting was FALSELY flagged! Got: {real_status_badge}"
        assert "LOLOS (OTENTIK)" in real_verdict_pill

        # Verify real scan also displays vivid emerald green theme
        assert "text-emerald-600" in (page.locator("#prob-number").get_attribute("class") or ""), "Real upload percentage MUST be EMERALD GREEN!"
        assert "text-emerald-700" in (page.locator("#prob-label").get_attribute("class") or ""), "Real upload label MUST be EMERALD GREEN!"

        page.screenshot(path=f"{SCREENSHOT_DIR}/03_real_upload_authentic_result.png")
        print("  ✓ Test 6 Passed: Real user handwriting passed through full CV/ML pipeline, classified OTENTIK (LOLOS), with vivid green visuals!")

        # -------------------------------------------------------------
        # TEST 6B: Direct Test of User's Specific Notebook Sample (WhatsApp Image 10.22.44 (2).jpeg)
        # -------------------------------------------------------------
        print("\n[TEST 6B] Testing User's Specific Notebook Sample (WhatsApp 10.22.44 (2).jpeg) ...")
        user_messy_img = "/home/darulqutni/AsliTulis/backend/data/real/WhatsApp Image 2026-09-18 at 10.22.44 (2).jpeg"
        
        # Click + Uji Naskah Baru
        page.click("#btn-header-new-upload")
        page.wait_for_timeout(400)
        assert page.locator("#view-pemeriksaan-berkas").is_visible()
        
        # Upload messy notebook image
        page.set_input_files("#file-input", user_messy_img)
        page.wait_for_selector("#view-lembar-analisis.active", timeout=20000)
        page.wait_for_timeout(1000)
        
        messy_status_badge = page.locator("#stat-status-badge").inner_text()
        messy_verdict_pill = page.locator("#doc-verdict-pill").inner_text()
        messy_prob = page.locator("#prob-number").inner_text()
        
        print(f"  User Messy Notebook Verdict: {messy_status_badge} | {messy_verdict_pill} | Index: {messy_prob}")
        assert "LOLOS" in messy_status_badge or "OTENTIK" in messy_status_badge, f"Messy handwriting was FALSELY flagged! Got: {messy_status_badge}"
        assert "LOLOS (OTENTIK)" in messy_verdict_pill
        assert "text-emerald-600" in (page.locator("#prob-number").get_attribute("class") or "")
        
        # Verify genuine CV metrics are present and gimmicks are removed
        assert page.locator("#val-similarity").is_visible(), "Max NCC similarity metric should be visible"
        assert page.locator("#val-entropy").is_visible(), "Entropy metric should be visible"
        assert page.locator("#val-pressure").is_visible(), "Pressure metric should be visible"
        assert page.locator("#val-baseline").is_visible(), "Baseline metric should be visible"
        assert page.locator("#val-slant").count() == 0, "Fake slant metric must be removed!"
        assert page.locator("#val-penlifts").count() == 0, "Fake penlifts metric must be removed!"
        assert page.locator("#glyph-comparison-card").count() == 0, "Fake mock glyph card must be removed!"
        
        page.screenshot(path=f"{SCREENSHOT_DIR}/03b_user_messy_notebook_authentic.png")
        print("  ✓ Test 6B Passed: Student notebook handwriting (10.22.44 (2).jpeg) correctly classified as LOLOS (OTENTIK) with NO fake mockups and NO false twin boxes!")

        # -------------------------------------------------------------
        # TEST 6C: Testing Previously Failing Synthetic Sample (fake_0032.jpg)
        # -------------------------------------------------------------
        print("\n[TEST 6C] Testing Synthetic Sample (fake_0032.jpg) ...")
        page.click("button.nav-link[data-view='pemeriksaan-berkas']")
        page.wait_for_timeout(400)
        
        fake_32_path = "/home/darulqutni/AsliTulis/backend/data/synthetic/fake_0032.jpg"
        page.set_input_files("#file-input", fake_32_path)
        page.wait_for_timeout(2500)
        page.click("button.nav-link[data-view='lembar-analisis']")
        page.wait_for_timeout(400)
        
        fake32_badge = page.locator("#stat-status-badge").inner_text()
        fake32_pill = page.locator("#doc-verdict-pill").inner_text()
        fake32_prob = page.locator("#prob-number").inner_text()
        
        print(f"  fake_0032 Verdict: {fake32_badge} | {fake32_pill} | Index: {fake32_prob}")
        assert "SINTETIS" in fake32_badge or "TERINDIKASI" in fake32_badge, f"Fake image was mistakenly passed as authentic! Got: {fake32_badge}"
        assert "TERINDIKASI" in fake32_pill or "FONT" in fake32_pill or "SINTETIS" in fake32_pill
        
        page.screenshot(path=f"{SCREENSHOT_DIR}/05_fake_0032_suspect_verified.png")
        print("  ✓ Test 6C Passed: Synthetic image (fake_0032.jpg) correctly flagged as TERINDIKASI SINTETIS!")

        # -------------------------------------------------------------
        # TEST 7: Dynamic Archive (Buku Catatan Arsip)
        # -------------------------------------------------------------
        print("\n[TEST 7] Testing Dynamic Archive Ledger & Filtering ...")
        page.click("button.nav-link[data-view='arsip-pengujian']")
        page.wait_for_timeout(500)

        # Verify table has rows
        rows = page.locator("#archive-tbody tr")
        row_count = rows.count()
        print(f"  Archive rows count: {row_count}")
        assert row_count >= 4, f"Expected at least 4 archive rows, got {row_count}"

        # Test Search Filter
        print("  Testing search input ...")
        search_input = page.locator("#archive-search")
        search_input.fill("Ahmad")
        page.wait_for_timeout(300)
        visible_rows = [r for r in rows.all() if r.is_visible()]
        print(f"  Visible rows searching 'Ahmad': {len(visible_rows)}")
        assert len(visible_rows) >= 1, "Search should show matching rows"

        search_input.fill("")
        page.wait_for_timeout(300)

        # Test Status Dropdown Filter
        print("  Testing status dropdown filter ...")
        filter_select = page.locator("#archive-filter")
        
        filter_select.select_option("suspect")
        page.wait_for_timeout(300)
        visible_suspect = [r for r in rows.all() if r.is_visible()]
        print(f"  Visible suspect rows: {len(visible_suspect)}")
        assert len(visible_suspect) >= 2, "Expected suspect rows"

        filter_select.select_option("authentic")
        page.wait_for_timeout(300)
        visible_authentic = [r for r in rows.all() if r.is_visible()]
        print(f"  Visible authentic rows: {len(visible_authentic)}")
        assert len(visible_authentic) >= 1, "Expected authentic rows"

        filter_select.select_option("all")
        page.wait_for_timeout(300)

        # Test "Buka Lembar" action button from archive
        first_open_btn = page.locator(".btn-open-archive-item").first
        first_open_btn.click()
        page.wait_for_timeout(500)
        assert page.locator("#view-lembar-analisis").is_visible(), "Clicking 'Buka Lembar' should open Lembar Analisis"
        print("  ✓ 'Buka Lembar' action button reloads specimen and switches view")

        page.screenshot(path=f"{SCREENSHOT_DIR}/04_archive_inspection.png")
        print("  ✓ Test 7 Passed: Dynamic archive stores records, filters in real-time, and opens specimens.")

        browser.close()
        print("\n=======================================================")
        print(">>> ALL 7 ENHANCED TEST SUITES PASSED FLAWLESSLY! <<<")
        print("=======================================================")

if __name__ == "__main__":
    run_tests()
