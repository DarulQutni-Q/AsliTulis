# AsliTulis (Konsol Forensik Keaslian Tulisan Tangan)

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Design System](https://img.shields.io/badge/Design%20System-Stitch%20Archival-maroon.svg)](https://stitch.googleapis.com)
[![Status](https://img.shields.io/badge/Status-Step%201%20Complete-emerald.svg)](#)

> **Platform forensik digital & audit integritas akademik** untuk memverifikasi keaslian naskah tugas/ujian tulis tangan mahasiswa terhadap manipulasi generator font sintetis dan eksekusi pena robot (*pen-plotter AI*).

---

## 📌 Gambaran Umum

Perkembangan teknologi font tulisan tangan dan mesin *pen-plotter* berbasis AI memungkinkan pembuatan tugas tulis tangan palsu dengan tingkat kerapian tinggi yang sulit dibedakan dengan mata telanjang. **AsliTulis** hadir sebagai solusi berbasis analisis citra digital dan *computer vision* untuk mengevaluasi parameter mikroskopis naskah, meliputi:

1. **Konsistensi Glif Berulang (Glyph Entropy)**: Mendeteksi alograf huruf sejenis yang identik 100% (*clone glyphs*) melalui teknik *Dynamic Time Warping* (DTW). Tangan manusia mustahil mengulang kurvatura yang sama persis tanpa *jitter* biologis.
2. **Linearitas Garis Dasar (Baseline Rigidity)**: Menganalisis deviasi kelurusan garis terhadap mistar buku bergaris (*Hough Transform Linearity*). Plotter mekanis mempertahankan linearitas kaku tanpa deviasi lelah motorik.
3. **Dinamika & Kedalaman Resapan Tinta (Ink Pressure Gradient)**: Mengukur profil gradien saturasi pigmen tinta pada serat kertas, titik henti (*pen-lifts*), dan penekanan awal (*landing points*).

---

## 🗂 Struktur Repositori

```text
AsliTulis/
├── backend/
│   ├── assets/
│   │   └── fonts/              # 43 font handwriting Google Fonts unik (OFL)
│   │       ├── fonts.json      # Manifest nama font, sumber, dan lisensi
│   │       └── *.ttf           # File binary TrueType fonts
│   └── data/
│       ├── download_fonts.py   # Script pengunduh font Google Fonts
│       ├── generate_fake.py    # Generator dataset sintetis dengan augmentasi foto
│       ├── sentences.json      # Korpus 45 kalimat Bahasa Indonesia kaya huruf berulang
│       └── synthetic/          # 350 foto naskah sintetis (Kelas 0: Fake) + labels.csv
├── frontend/                   # Konsol Forensik Web (HTML5 / Vanilla CSS / JS)
│   ├── assets/
│   │   ├── logo.svg            # Logo vektor AsliTulis
│   │   └── samples/            # Citra sampel resolusi tinggi (Caveat, Dekko, Mali)
│   ├── css/
│   │   └── style.css           # Styling GPU-accelerated (Stitch Design System)
│   ├── js/
│   │   └── app.js              # Controller interaktif, SVG annotations & 2.5x Loupe
│   └── index.html              # Antarmuka Meja Periksa, Lembar Analisis & Buku Arsip
├── stitch_designs/             # Desain referensi & aset Google Stitch
├── .gitignore                  # Aturan ignore standar Git (Python, Web, OS, IDE)
├── requirements.txt            # Dependensi Python
├── PRD.md                      # Product Requirements Document
└── README.md                   # Dokumentasi proyek
```

---

## 🚀 Panduan Memulai (Quickstart)

### 1. Prasyarat Sistem
- Python 3.10 atau lebih baru
- Web browser modern (Chrome, Edge, Firefox, Safari)

### 2. Instalasi Dependensi Python
Buat virtual environment dan pasang dependensi:
```bash
# Buat virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Pasang dependensi
pip install -r requirements.txt
```

### 3. Menjalankan Konsol Forensik Web
Jalankan server HTTP lokal untuk membuka konsol forensik:
```bash
python3 -m http.server 3000 --directory frontend
```
Buka browser dan akses: **`http://localhost:3000`**

---

## 🖥 Fitur Konsol Forensik Web

- **Meja Periksa Naskah**:
  - Drag-and-drop foto tulisan tangan mahasiswa (JPG, PNG, WEBP).
  - Simulasi pemindaian laser berkas (*scanning beam*) dengan estimasi sudut rotasi dan deteksi kepadatan glif.
- **Lembar Analisis Forensik**:
  - **Citra Foto Asli**: Menampilkan pindaian foto beresolusi tinggi nyata dengan serat kertas folio, garis bergaris biru, dan resapan tinta pulpen riil.
  - **Anotasi Vektor Hairline (Anti-Tabrakan)**: Bounding box putus-putus halus dengan penanda pin sirkular (`①`, `②`, `③`).
  - **Floating Cursor Tooltip**: Keterangan nilai DTW dan deviasi mikro melayang di dekat kursor mouse tanpa menutupi tulisan.
  - **Baki Legenda Interaktif**: Klik pin pada legenda untuk menyorot alograf kembar secara serentak.
  - **Kaca Pembesar 2.5x (Forensic Loupe)**: Memperbesar serat kertas dan mikrograf goresan pena secara langsung.
  - **Pemilih Spesimen Cepat**: Uji komparasi instan antara sampel plotter (`Caveat`, `Dekko`) dan sampel tulisan tangan manusia otentik (`Mali`).
- **Berita Acara Forensik (PDF Resmi)**:
  - Generate dokumen resmi Berita Acara Pemeriksaan Forensik yang siap dicetak/diekspor ke PDF dengan tanda tangan petugas pemeriksa.
- **Pengaturan Profil Pemeriksa**:
  - Default *Mode Tamu / Lab Mandiri* tanpa memaksakan akun tertentu.
  - Modal identitas petugas pemeriksa untuk kustomisasi nama penguji, NIP, dan institusi.

---

## 🧪 Generator Data Sintetis (Kelas 0 - Fake)

Untuk menghasilkan ulang dataset foto tulisan tangan sintetis:
```bash
# Unduh font handwriting berlisensi komersial
python backend/data/download_fonts.py

# Render 350 foto naskah sintetis dengan augmentasi kamera HP
python backend/data/generate_fake.py
```

Augmentasi fotografis meliputi:
- Tekstur kertas bergaris prosedural (*procedural ruled notebook paper*).
- Bayangan gradien pencahayaan miring (*directional lighting shadow*).
- Kemiringan perspektif kamera smartphone (*perspective tilt & warp*).
- *Optical defocus / lens blur* & *sensor ISO noise*.
- Kompresi kualitas JPEG adaptif (khas kiriman kamera smartphone/WhatsApp).

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE). Font handwriting yang digunakan bersumber dari Google Fonts dengan lisensi SIL Open Font License (OFL 1.1) dan Apache 2.0.
