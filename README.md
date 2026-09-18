# AsliTulis — Konsol Forensik Keaslian Tulisan Tangan

[![Python](https://img.shields.io/badge/Python-3.12%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.10%2B-5C3EE8.svg)](https://opencv.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.5%2B-F7931E.svg)](https://scikit-learn.org/)
[![Playwright](https://img.shields.io/badge/E2E-Playwright%20Tested-2EAD33.svg)](https://playwright.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Platform audit forensik digital dan integritas akademik** untuk memverifikasi keaslian naskah tugas dan lembar ujian tulis tangan terhadap manipulasi generator font sintetis, kecerdasan buatan (*handwriting font synthesis*), dan eksekusi pena robot (*mechanical pen-plotter*).

---

## 📌 Ringkasan Eksekutif

Pemanfaatan font tulisan tangan berbasis kecerdasan buatan dan mesin *pen-plotter* kini memungkinkan pembuatan tugas tulis tangan palsu yang tampak rapi dan meyakinkan secara kasat mata. Namun, secara fisik dan biomekanik, naskah digital sintetis meninggalkan anomali struktural mikroskopis: **pengulangan bentuk vektor glif yang matematis identik**, **ketebalan goresan pena yang seragam**, **deviasi garis dasar yang terlalu kaku terhadap mistar**, serta **warna pigmen tinta yang datar tanpa gradien alami penyerapan serat kertas**.

**AsliTulis** memadukan teknik *Computer Vision* (OpenCV) dan *Machine Learning* (Random Forest multivariat) untuk membedakan variasi motorik biologis alami manusia dari template font digital secara deterministik dan terukur.

---

## 🔬 Metodologi & Arsitektur Forensik

```
                      [ Pindaian / Foto Naskah ]
                                   │
                                   ▼
        [ Illumination-Invariant Background Estimation (cv2.absdiff) ]
                                   │
                                   ▼
      [ Eliminasi Header Cetak Kertas (12%) & Garis Tepi Merah Margin ]
                                   │
                                   ▼
       ┌───────────────────────────┴───────────────────────────┐
       ▼                                                       ▼
[ Ekstraksi Glif & NCC ]                             [ Morfologi & Pigmen ]
 • Max NCC Similarity                                 • Stroke Width CV (Distance Transform)
 • Clone Ratio (NCC ≥ 0.93)                           • Baseline Rigidity (Polynomial Fit)
 • Cluster 3+ Allographs                              • Glyph Height Entropy
                                                      • Ink Color Std (Pigment Gradient)
       └───────────────────────────┬───────────────────────────┘
                                   │
                                   ▼
                     [ Vektor Forensik 7-Dimensi ]
                                   │
               ┌───────────────────┴───────────────────┐
               ▼                                       ▼
    [ Lapisan 1: Hard Clone Law ]             [ Lapisan 2: ML Random Forest ]
     • Max NCC ≥ 0.950                         • Pipeline StandardScaler + RF
     • Clone Ratio ≥ 0.035 & NCC ≥ 0.930       • Estimasi Probabilitas Multivariat
     • Cluster 3+ ≥ 1 & NCC ≥ 0.930            • Menangani Font Kursif/Sambung
               └───────────────────┬───────────────────┘
                                   │
                                   ▼
          [ Hasil Verifikasi: LOLOS (OTENTIK) / TERINDIKASI SINTETIS ]
```

### Parameter Evaluasi Forensik

1. **Korelasi Kemiripan Glif (Max NCC)**: Mengukur nilai *Normalized Cross Correlation* tertinggi antar-karakter yang terpisah pada naskah. Tangan manusia menghasilkan korelasi kebetulan $\le 0.925$, sedangkan generator font mengulang template yang sama persis ($\ge 0.940 - 0.995$).
2. **Rasio Glif Kembar (Clone Ratio)**: Persentase karakter pada dokumen yang memiliki kembaran identik pada kata lain.
3. **Klaster Alograf Berulang ($\ge 3$ Cluster)**: Frekuensi karakter identik yang muncul berulang 3 kali atau lebih lintas baris.
4. **Variasi Tekanan Tinta (Stroke Width CV)**: Dihitung menggunakan *Euclidean Distance Transform* sepanjang sumbu goresan. Pena digital/plotter memiliki ketebalan konstan (CV rendah), sementara pena manusia memiliki penipisan goresan (*tapering*) dan gradien tekanan alami.
5. **Linearitas Garis Dasar (Baseline Rigidity)**: Standar deviasi residu penempatan huruf terhadap kurva garis mistar buku.
6. **Entropi Bentuk Karakter**: Variasi proporsi tinggi-lebar karakter yang mencerminkan fluktuasi biologis manusia.
7. **Gradien Warna Pigmen Tinta (`ink_std`)**: Menilai variasi saturasi resapan tinta pulpen asli pada pori-pori kertas vs warna solid flat hasil *render* piksel komputer.

---

## 📊 Hasil Uji Benchmark & Akurasi

Model dievaluasi secara menyeluruh terhadap **350 sampel data sintetis** (43 variasi font kursif, santai, dan rapi) serta **181 sampel naskah asli manusia** (koleksi tugas mahasiswa nyata via foto kamera smartphone & database IAM):

| Kategori Data | Total Naskah | Hasil Uji: Sintetis | Hasil Uji: Otentik | Akurasi | False Positives | False Negatives |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Data Sintetis / AI (`synthetic/`)** | **350** | **350** (100.0%) | 0 | **100.0%** | 0 | **0** |
| **Data Asli Mahasiswa (`real/`)** | **181** | 0 | **181** (100.0%) | **100.0%** | **0** | 0 |

- **5-Fold Stratified Cross-Validation**: Akurasi $99.44\%$, ROC-AUC $0.9999$.
- **0 False Negatives**: Seluruh naskah buatan font digital berhasil diidentifikasi sebagai *TERINDIKASI SINTETIS*.
- **0 False Positives**: Seluruh lembar tulisan tangan asli mahasiswa terverifikasi sebagai *LOLOS (OTENTIK)* tanpa kotak merah palsu.

---

## 🖥 Fitur Antarmuka Pengguna

- **Meja Periksa Naskah**:
  - *Drag-and-drop* pengunggahan berkas pindaian/foto naskah (JPG, PNG, WEBP).
  - Simulasi pemindaian laser presisi dengan estimasi sudut rotasi dan deteksi kepadatan glif.
- **Lembar Analisis Forensik**:
  - **Anotasi Vektor Interaktif**: Kotak penanda dinamis dengan pin berlabel (`①`, `②`, `③`) yang menyorot karakter kembar pada dokumen.
  - **Kaca Pembesar 2.5x**: Pembesaran resolusi tinggi untuk memeriksa serat kertas dan mikro-goresan tinta secara langsung.
  - **Kisi Mistar (Ruler Grid Calibration)**: Overlay garis kalibrasi mistar 50px untuk memeriksa linearitas baris.
  - **Metrik Forensik Murni**: Menampilkan 4 parameter utama terhitung (Kemiripan Glif, Entropi Bentuk, Variasi Tekanan Tinta, Linearitas Garis Dasar) tanpa data *mock*.
  - **Styling Adaptif**: Tampilan tema hijau zamrud (*emerald*) untuk naskah otentik dan palet peringatan terkalibrasi untuk naskah sintetis.
- **Buku Catatan Arsip**:
  - Ledger audit otomatis yang mencatat histori pemeriksaan, nomor berkas, NIM mahasiswa, checksum SHA-256, dan status verifikasi.
  - Fitur pencarian instan berdasarkan nama/NIM dan filter status naskah.
- **Ekspor Berita Acara Forensik (PDF)**:
  - Format Berita Acara Pemeriksaan resmi yang dioptimalkan untuk cetak PDF fisik tanpa elemen tombol antarmuka yang tidak relevan.

---

## 📂 Struktur Proyek

```text
AsliTulis/
├── backend/
│   ├── app/
│   │   ├── features.py             # Ekstraksi fitur forensik CV & segmentasi glif
│   │   └── main.py                 # Endpoint API FastAPI (/api/classify) & static router
│   ├── data/
│   │   ├── download_fonts.py       # Pengunduh 43 koleksi font Google Fonts
│   │   ├── download_real_data.py   # Pipeline ekstraksi dataset tulisan tangan asli (IAM)
│   │   ├── generate_fake.py        # Generator citra sintetis dengan augmentasi kamera HP
│   │   ├── sentences.json          # Korpus naskah Bahasa Indonesia
│   │   ├── real/                   # 181 foto naskah tulisan tangan asli manusia
│   │   ├── synthetic/              # 350 citra naskah sintetis / AI font
│   │   └── train.py                # Pipeline pelatihan & validasi Random Forest
│   └── models/
│       └── classifier.joblib       # Model bundle (Scaler, Random Forest, Feature Weights)
├── frontend/
│   ├── assets/                     # Logo SVG dan sampel citra pengujian
│   ├── css/
│   │   └── style.css               # Styling antarmuka berbasis Stitch Archival System
│   ├── js/
│   │   └── app.js                  # Frontend controller, SVG overlay & archive ledger
│   └── index.html                  # Halaman aplikasi web tunggal (SPA)
├── tests/
│   ├── screenshots/                # Tangkapan layar hasil verifikasi visual E2E
│   ├── test_full_app_e2e.py        # Suite pengujian Playwright end-to-end browser
│   └── test_model_accuracy.py      # Pengujian unit akurasi dataset 100% (unittest)
├── requirements.txt                # Dependensi Python
└── README.md                       # Dokumentasi resmi proyek
```

---

## 🚀 Panduan Memulai Cepat

### 1. Prasyarat Sistem
- Python 3.11 atau 3.12
- Chromium / Google Chrome (untuk eksekusi pengujian otomatis Playwright)

### 2. Instalasi Dependensi
```bash
# Clone repositori
git clone https://github.com/DarulQutni-Q/AsliTulis.git
cd AsliTulis

# Siapkan virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Pasang dependensi
pip install -r requirements.txt

# (Opsional) Pasang browser Playwright untuk keperluan automated testing
playwright install chromium
```

### 3. Menjalankan Server Aplikasi
Jalankan server aplikasi berbasis FastAPI dan Uvicorn:
```bash
./.venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```
Buka peramban dan akses: **`http://localhost:8000`**

---

## 🧪 Menjalankan Pengujian Otomatis

### Pengujian Akurasi Model (350 Fake & 181 Real)
Verifikasi bahwa seluruh data sintetis terdeteksi sebagai fake dan seluruh data manusia terdeteksi sebagai otentik (100% akurasi):
```bash
./.venv/bin/python tests/test_model_accuracy.py
```

### Pengujian End-to-End Browser (Playwright)
Menjalankan simulasi antarmuka peramban headless, pengunggahan berkas nyata, interaktivitas toolbar, filter arsip, dan audit cetak PDF:
```bash
./.venv/bin/python tests/test_full_app_e2e.py
```

---

## 📄 Lisensi & Hak Cipta

Proyek ini didistribusikan di bawah lisensi [MIT License](LICENSE). Font tulisan tangan yang digunakan untuk dataset sintetis bersumber dari Google Fonts di bawah lisensi SIL Open Font License (OFL 1.1) dan Apache License 2.0. Dataset tulisan tangan asli diadaptasi dari IAM Handwriting Database untuk keperluan riset integritas akademik.
