import os
import json
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import ImageFont

FONTS_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "fonts")
MANIFEST_PATH = os.path.join(FONTS_DIR, "fonts.json")

# List of distinct handwriting font families from Google Fonts (SIL Open Font License)
# Each item represents a unique font family (strictly 1 font file per family).
CANDIDATE_FONTS = [
    # Neat / School notebook style (Rapi)
    {"name": "Kalam", "style": "Neat", "path": "ofl/kalam/Kalam-Regular.ttf"},
    {"name": "Pangolin", "style": "Neat", "path": "ofl/pangolin/Pangolin-Regular.ttf"},
    {"name": "Mali", "style": "Neat", "path": "ofl/mali/Mali-Regular.ttf"},
    {"name": "Itim", "style": "Neat", "path": "ofl/itim/Itim-Regular.ttf"},
    {"name": "Delius", "style": "Neat", "path": "ofl/delius/Delius-Regular.ttf"},
    {"name": "Neucha", "style": "Neat", "path": "ofl/neucha/Neucha.ttf"},
    {"name": "Gaegu", "style": "Neat", "path": "ofl/gaegu/Gaegu-Regular.ttf"},
    {"name": "Klee One", "style": "Neat", "path": "ofl/kleeone/KleeOne-Regular.ttf"},
    {"name": "Sriracha", "style": "Neat", "path": "ofl/sriracha/Sriracha-Regular.ttf"},

    # Cursive / Italic style (Miring / Sambung)
    {"name": "Caveat", "style": "Cursive", "path": "ofl/caveat/Caveat%5Bwght%5D.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Dancing Script", "style": "Cursive", "path": "ofl/dancingscript/DancingScript%5Bwght%5D.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Satisfy", "style": "Cursive", "path": "apache/satisfy/Satisfy-Regular.ttf", "license": "Apache License, 2.0"},
    {"name": "Marck Script", "style": "Cursive", "path": "ofl/marckscript/MarckScript-Regular.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Courgette", "style": "Cursive", "path": "ofl/courgette/Courgette-Regular.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Sacramento", "style": "Cursive", "path": "ofl/sacramento/Sacramento-Regular.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Yellowtail", "style": "Cursive", "path": "apache/yellowtail/Yellowtail-Regular.ttf", "license": "Apache License, 2.0"},
    {"name": "Bad Script", "style": "Cursive", "path": "ofl/badscript/BadScript-Regular.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Parisienne", "style": "Cursive", "path": "ofl/parisienne/Parisienne-Regular.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Great Vibes", "style": "Cursive", "path": "ofl/greatvibes/GreatVibes-Regular.ttf", "license": "SIL Open Font License, 1.1"},

    # Casual / Notebook / Print style (Santai / Biasa)
    {"name": "Patrick Hand", "style": "Casual", "path": "ofl/patrickhand/PatrickHand-Regular.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Indie Flower", "style": "Casual", "path": "ofl/indieflower/IndieFlower-Regular.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Shadows Into Light", "style": "Casual", "path": "ofl/shadowsintolight/ShadowsIntoLight.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Gochi Hand", "style": "Casual", "path": "ofl/gochihand/GochiHand-Regular.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Architects Daughter", "style": "Casual", "path": "ofl/architectsdaughter/ArchitectsDaughter-Regular.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Dekko", "style": "Casual", "path": "ofl/dekko/Dekko-Regular.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Gamja Flower", "style": "Casual", "path": "ofl/gamjaflower/GamjaFlower-Regular.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Hi Melody", "style": "Casual", "path": "ofl/himelody/HiMelody-Regular.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Schoolbell", "style": "Casual", "path": "apache/schoolbell/Schoolbell-Regular.ttf", "license": "Apache License, 2.0"},
    {"name": "Crafty Girls", "style": "Casual", "path": "apache/craftygirls/CraftyGirls-Regular.ttf", "license": "Apache License, 2.0"},
    {"name": "The Girl Next Door", "style": "Casual", "path": "ofl/thegirlnextdoor/TheGirlNextDoor.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Walter Turncoat", "style": "Casual", "path": "apache/walterturncoat/WalterTurncoat-Regular.ttf", "license": "Apache License, 2.0"},

    # Quick notes / Expressive / Spidery / Marker (Sketsa / Cepat / Nyentrik)
    {"name": "Reenie Beanie", "style": "Quick", "path": "ofl/reeniebeanie/ReenieBeanie.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Just Another Hand", "style": "Quick", "path": "apache/justanotherhand/JustAnotherHand-Regular.ttf", "license": "Apache License, 2.0"},
    {"name": "Covered By Your Grace", "style": "Quick", "path": "ofl/coveredbyyourgrace/CoveredByYourGrace.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Homemade Apple", "style": "Quick", "path": "apache/homemadeapple/HomemadeApple-Regular.ttf", "license": "Apache License, 2.0"},
    {"name": "Rock Salt", "style": "Quick", "path": "apache/rocksalt/RockSalt-Regular.ttf", "license": "Apache License, 2.0"},
    {"name": "Nothing You Could Do", "style": "Quick", "path": "ofl/nothingyoucoulddo/NothingYouCouldDo.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Sedgwick Ave", "style": "Quick", "path": "ofl/sedgwickave/SedgwickAve-Regular.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Gloria Hallelujah", "style": "Quick", "path": "ofl/gloriahallelujah/GloriaHallelujah.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Zeyada", "style": "Quick", "path": "ofl/zeyada/Zeyada.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Waiting for the Sunrise", "style": "Quick", "path": "ofl/waitingforthesunrise/WaitingfortheSunrise.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Loved by the King", "style": "Quick", "path": "ofl/lovedbytheking/LovedbytheKing.ttf", "license": "SIL Open Font License, 1.1"},
    {"name": "Permanent Marker", "style": "Quick", "path": "apache/permanentmarker/PermanentMarker-Regular.ttf", "license": "Apache License, 2.0"},
]

BASE_URL = "https://raw.githubusercontent.com/google/fonts/main/"

def download_and_verify_font(item):
    name = item["name"]
    style = item["style"]
    subpath = item["path"]
    filename = f"{name.replace(' ', '')}.ttf"
    target_path = os.path.join(FONTS_DIR, filename)
    url = BASE_URL + subpath

    try:
        resp = requests.get(url, timeout=15)
        if resp.status_code == 200 and len(resp.content) > 1000:
            with open(target_path, "wb") as f:
                f.write(resp.content)
            # Verify font can be loaded with Pillow and render glyphs
            test_font = ImageFont.truetype(target_path, 24)
            test_bbox = test_font.getbbox("Karakteristik 123!?")
            if test_bbox and test_bbox[2] > 0:
                return {
                    "font_name": name,
                    "family": name,
                    "file_name": filename,
                    "style_category": style,
                    "source_url": f"https://fonts.google.com/specimen/{name.replace(' ', '+')}",
                    "raw_download_url": url,
                    "license": item.get("license", "SIL Open Font License, 1.1"),
                    "file_size_bytes": len(resp.content),
                    "valid": True
                }
        return {"font_name": name, "valid": False, "error": f"HTTP {resp.status_code}"}
    except Exception as e:
        return {"font_name": name, "valid": False, "error": str(e)}

def main():
    os.makedirs(FONTS_DIR, exist_ok=True)
    print(f"Starting download of {len(CANDIDATE_FONTS)} candidate Google Fonts...")

    successful_fonts = []
    failed_fonts = []

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(download_and_verify_font, item): item for item in CANDIDATE_FONTS}
        for future in as_completed(futures):
            res = future.result()
            if res.get("valid"):
                successful_fonts.append(res)
                print(f"[OK] {res['font_name']} ({res['style_category']}) -> {res['file_name']} ({res['file_size_bytes']} bytes)")
            else:
                failed_fonts.append(res)
                print(f"[FAIL] {res['font_name']}: {res.get('error')}")

    # Ensure no duplicates by font family name
    unique_fonts = {}
    for f in successful_fonts:
        if f["font_name"] not in unique_fonts:
            unique_fonts[f["font_name"]] = f

    final_font_list = sorted(list(unique_fonts.values()), key=lambda x: x["font_name"])

    # Write fonts.json manifest
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(final_font_list, f, indent=2, ensure_ascii=False)

    print("\n" + "="*50)
    print(f"Total Unique Fonts Downloaded & Verified: {len(final_font_list)}")
    print(f"Manifest written to: {MANIFEST_PATH}")
    print("="*50)

    # Breakdown by style category
    categories = {}
    for f in final_font_list:
        cat = f["style_category"]
        categories[cat] = categories.get(cat, 0) + 1
    for cat, count in categories.items():
        print(f" - {cat}: {count} fonts")

if __name__ == "__main__":
    main()
