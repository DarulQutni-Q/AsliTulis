
PRD: AsliTulis — Classifier Keaslian Tulisan Tangan (Human vs AI/Font-Generated)

Kompetisi: Lomba Vibe Coding — Tema: Klasifikasi Deadline repo: 18 September 2026, 23:59 WIB Status: Draft v1 — siap langsung dieksekusi
1. Latar Belakang & Masalah

Sekarang banyak tool text-to-handwriting generator yang bisa mengubah teks ketikan (termasuk hasil AI) jadi gambar/PDF yang terlihat seperti tulisan tangan asli — lengkap dengan pilihan font handwriting, jenis kertas bergaris, dan output yang didesain supaya terlihat seperti hasil foto tugas asli. Ini membuka celah baru: mahasiswa bisa "menulis tangan" tugas tanpa benar-benar menulis, dan dosen tidak punya cara mudah untuk memverifikasi keasliannya dari foto.

Insight kunci: tulisan yang dihasilkan tool semacam ini punya karakteristik yang secara visual berbeda dari tulisan tangan asli — huruf yang sama akan terlihat nyaris identik berulang kali (karena berasal dari font yang sama persis), baseline terlalu presisi, dan lebar goresan terlalu seragam. Tulisan tangan asli secara alami punya variasi kecil di setiap pengulangan huruf karena faktor motorik manusia.
2. Tujuan (Goals)

    Web app tempat user upload foto halaman tulisan tangan → sistem mengklasifikasikan "Kemungkinan Asli (Human)" vs "Kemungkinan AI/Font-Generated", lengkap dengan confidence score dan penjelasan visual (bagian mana yang jadi indikator).
    Menunjukkan pipeline klasifikasi yang genuinely trained (bukan cuma if-else), sesuai tema lomba.

3. Non-Goals (scope sengaja dipersempit, waktu cuma ~1 hari)

    Tidak mendeteksi semua bentuk kecurangan (pemalsuan tulisan tangan manual oleh orang lain, atau GAN handwriting generator canggih) — fokus MVP ke ancaman paling realistis: tool text-to-handwriting generator berbasis font.
    Tidak ada analisis multi-halaman/batch di MVP (stretch goal kalau waktu sisa).
    Tidak klaim akurasi tinggi ke juri — posisikan sebagai alat bantu indikasi, bukan bukti mutlak. Ini penting secara etis (jangan sampai dipakai buat menuduh mahasiswa tanpa verifikasi manual).

4. Target User

    Primer: dosen/guru yang mau spot-check kecurigaan tugas tulisan tangan.
    Sekunder: mahasiswa iseng cek tulisan sendiri (angle demo yang menarik dan lucu buat juri).

5. Working Name

AsliTulis (asli + tulis). Bebas diganti, tapi cukup jelas dan gampang diingat buat pitch.
6. Core Features (prioritas, mengingat waktu mepet)

P0 — wajib ada, ini inti nilai lomba:

    Upload foto (JPG/PNG) halaman tulisan tangan
    Preprocessing gambar (crop, deskew, enhance kontras)
    Segmentasi karakter/kata (OCR/contour detection)
    Ekstraksi fitur pembeda (lihat bagian 8)
    Klasifikasi via model terlatih → label + confidence %
    Visualisasi hasil: highlight huruf/area yang jadi indikator kecurigaan
    Halaman hasil dengan penjelasan singkat kenapa (feature breakdown)
    Riwayat analisis tersimpan (biar keliatan sebagai produk, bukan tool sekali pakai)
    Export hasil ke PDF
    Batch/multi-page analysis
    Public API
    Integrasi LMS

7. Strategi Data (bagian paling kritis — baca pelan-pelan)

Ini bukan masalah klasifikasi teks biasa, jadi tidak ada dataset publik siap pakai untuk "foto tulisan asli vs foto tulisan font-generated". Harus dibuat sendiri, tapi bisa cepat:

Kelas 0 — Font-generated (fake):

    Generate secara programatik: render teks contoh (banyak variasi kalimat Bahasa Indonesia) pakai kumpulan font handwriting (Google Fonts kategori Handwriting: Caveat, Kalam, Patrick Hand, Shadows Into Light, Architects Daughter, Reenie Beanie, dll — ambil 15-20 font).
    Render di atas background kertas bergaris (bisa pakai texture kertas asli yang di-scan, atau generate simpel).
    Penting: tambahkan augmentasi fotografis (blur ringan, noise, gradient shadow, sedikit rotasi/perspective warp, variasi lighting/JPEG compression) supaya hasilnya terlihat seperti difoto HP, bukan render digital bersih. Tanpa langkah ini, model cuma akan belajar bedain "gambar digital vs foto" — bukan bedain tulisan tangannya, dan itu shortcut yang salah.
    Target: 300-500 gambar, bisa digenerate via script dalam hitungan menit.

Kelas 1 — Real handwriting (asli):

    Tulis sendiri beberapa halaman dengan gaya berbeda (cepat, lambat, rapi, agak berantakan) — malam ini juga.
    Minta 2-3 teman kirim foto tulisan tangan mereka (chat cepat, kumpulin sebelum tidur).
    Kalau masih kurang, pakai dataset publik seperti IAM Handwriting Database sebagai suplemen (bahasa Inggris, tapi karakteristik visual tulisan tangan tetap relevan buat fitur yang diekstrak).
    Target: minimal 100-150 gambar.

Catatan jujur: dataset ini kecil dan tidak sepenuhnya representatif. Itu wajar untuk MVP kompetisi — jangan overclaim akurasi ke juri, framing sebagai "prototipe fungsional, akan makin baik dengan data lebih banyak."
8. Pendekatan Teknis Klasifikasi

Kenapa bukan CNN dari raw pixel: dataset terlalu kecil untuk training CNN yang reliable dalam waktu terbatas — risiko overfitting tinggi dan hasil tidak bisa dipertanggungjawabkan kalau ditanya juri.

Pendekatan yang direkomendasikan: feature engineering + classical ML classifier. Lebih cepat dilatih (detik-menit, bisa CPU), lebih mudah dijelaskan ke juri (interpretable), dan risiko overfitting jauh lebih kecil dibanding deep learning dengan data minim.

Fitur yang diekstrak per gambar:

    Konsistensi bentuk huruf berulang — ambil huruf yang sama yang muncul beberapa kali dalam satu gambar, ukur variance bentuknya (huruf font-generated nyaris identik; tulisan asli bervariasi). Ini fitur paling kuat.
    Variasi lebar stroke — real handwriting bervariasi karena tekanan pena berubah-ubah; font rendering biasanya seragam.
    Kelurusan baseline — tulisan asli sedikit naik-turun; font-rendered biasanya presisi lurus.
    Regularitas spasi antar huruf/kata.
    (opsional, fitur sekunder) tekstur tinta mikro — efeknya kadang hilang setelah kompresi foto, jangan terlalu diandalkan.

Model: scikit-learn — Logistic Regression atau Random Forest, dilatih dari fitur-fitur di atas, disimpan pakai joblib. Bisa expose feature importance untuk slide presentasi (nilai plus di "kerapian" dan storytelling teknis).
9. Arsitektur & Tech Stack
Layer 	Rekomendasi 	Alasan
Frontend 	Next.js + Tailwind 	Cepat di-scaffold dengan AI assistant, familiar
Backend 	Python FastAPI 	Cocok buat image processing & ML inference
Image processing 	OpenCV 	Standar, dokumentasi banyak
OCR/segmentasi 	Tesseract atau EasyOCR 	Buat deteksi & crop per karakter
ML 	scikit-learn 	Training cepat, interpretable
Storage (P1) 	SQLite 	Paling cepat di-setup dalam sehari
Deployment 	Opsional — Vercel (frontend) + Railway/Render (backend) 	Boleh skip kalau waktu mepet, demo lokal juga sah (deployment bukan syarat wajib)
10. Struktur Repo (usulan)

asli-tulis/
├── frontend/            # Next.js app
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI entrypoint
│   │   ├── preprocess.py    # crop, deskew, enhance
│   │   ├── features.py      # ekstraksi fitur
│   │   ├── model.py         # load/predict classifier
│   │   └── routes.py
│   ├── data/
│   │   ├── generate_fake.py # script generate data sintetis
│   │   └── train.py         # training + save model
│   └── models/
│       └── classifier.joblib
├── README.md             # wajib jelasin pemanfaatan AI di sini
└── docs/
    └── prd.md

11. API Endpoints (draft)

POST /api/classify

    Input: multipart form, file gambar
    Output:

{
  "label": "asli" | "kemungkinan_ai",
  "confidence": 0.87,
  "features": { "letter_consistency": 0.12, "stroke_variance": 0.34, "baseline_straightness": 0.91 },
  "explanation": "Huruf 'a' muncul 6 kali dengan variasi bentuk sangat rendah",
  "annotated_image_url": "/static/annotated/xxxx.png"
}

GET /api/history (P1) — list histori analisis tersimpan
12. Alur Pengguna

    User buka web, upload/foto halaman tulisan tangan
    Sistem preprocessing (auto-crop, enhance)
    Sistem ekstraksi fitur & jalankan model
    Tampilkan hasil: label + confidence % + visualisasi highlight
    (opsional) User lihat breakdown detail per fitur

13. Success Metrics (internal, bukan janji ke juri)

    Akurasi minimal 75-80% di data test sendiri — realistis untuk sehari
    Waktu proses < 5 detik per gambar
    UI bisa dipakai tanpa instruksi tambahan

14. Timeline (sisa waktu ~1 hari)

Malam ini (17 Sept):

    Setup skeleton FastAPI + Next.js (pakai AI assistant buat scaffolding)
    Tulis script generate data sintetis (font rendering + augmentasi)
    Kumpulin data real (tulis sendiri + minta teman)

Besok pagi–siang (18 Sept):

    Feature extraction pipeline (OpenCV + OCR)
    Training classifier, cek akurasi awal
    Integrasi backend–frontend, UI hasil + visualisasi

Besok sore–malam (18 Sept, sebelum 23:59 WIB):

    Testing end-to-end, perbaikan bug
    Tulis README yang jelasin cara AI dimanfaatkan selama proses (wajib, ini bagian penilaian)
    Push ke GitHub (repo public), submit form
    Siapkan bahan presentasi + demo yang PASTI jalan

15. Risiko & Mitigasi
Risiko 	Mitigasi
Dataset kecil/bias 	Jujur ke juri soal keterbatasan, framing sebagai prototipe fungsional
Model gagal generalisasi ke sample baru dari juri 	Siapkan contoh asli+fake sendiri yang PASTI berhasil buat demo utama, tetap terbuka kalau diminta coba sample baru
Waktu habis sebelum P0 selesai 	Potong P1/P2 tanpa ragu, P0 adalah non-negotiable
Model belajar shortcut "digital vs foto" bukan tulisan tangan 	Augmentasi fotografis wajib di data sintetis (lihat bagian 7)
16. Narasi Presentasi (15 menit + 10 menit QnA)

    Buka dengan masalah nyata — tunjukin screenshot salah satu tools text-to-handwriting generator, jelasin kenapa ini ancaman ke integritas akademik.
    Jelasin insight teknis kalian (konsistensi bentuk huruf sebagai sinyal utama) — ini yang bikin solusi kalian kelihatan "mikir", bukan cuma pasang model generic.
    Demo live: upload 1 contoh asli, 1 contoh fake, tunjukin hasil + visualisasi.
    Jelasin transparan keterbatasan model & cara AI dimanfaatkan selama development.

Langkah paling kritis sekarang: script generate data sintetis. Itu critical path — begitu itu jalan, sisanya (feature extraction, training, UI) bisa disusul cepat. Mau langsung gue bantu buatin skeleton script-nya?

