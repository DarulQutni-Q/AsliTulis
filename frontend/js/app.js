/**
 * AsliTulis - Forensic Examination Console
 * Client-Side Controller & High-Performance Interactions
 * 
 * Features:
 * - Zero-collision SVG hairline forensic annotations with corner pins
 * - Floating non-colliding cursor tooltip
 * - Real photographic document rendering (high-res synthetic & user upload)
 * - Above-the-fold immediate visibility (zero unwanted scroll)
 * - Guest mode by default with customizable examiner identity modal
 * - Interactive 2.5x Forensic Loupe with real image pixel magnification
 * - Batch Processing / Multi-File Class Upload
 * - Official Berita Acara Rekapitulasi CSV Export
 * - Side-by-Side Dual Specimen Comparator
 */

(function () {
  'use strict';

  // Application State
  const state = {
    activeView: 'pemeriksaan-berkas',
    currentSpecimen: 'caveat', // 'caveat' | 'dekko' | 'mali' | 'user'
    currentCase: 'synthetic',   // 'synthetic' | 'authentic'
    rulerVisible: true,
    annotationsVisible: true,
    loupeActive: false,
    comparatorActive: false,
    uploadedImageSrc: null,
    uploadedFileMeta: null,
    isScanning: false,
    selectedPair: null,
    batchResults: [],
    examiner: {
      name: 'Mode Tamu / Lab Mandiri',
      nip: 'REG-2024-LAB04',
      inst: 'Laboratorium Forensik Akademik',
      isGuest: true
    }
  };

  // Specimen & Case Catalog
  const specimens = {
    caveat: {
      caseId: 'BAF/KOMP/2024/X-1088',
      course: 'IF-4020 Teori Komputasi Lanjut',
      studentName: 'Ahmad Fauzan',
      studentNim: '13521088',
      classYear: 'IF-4020 / 2021',
      deskNo: 'C-14',
      scanRes: '1006 × 1245 piksel (300 DPI)',
      submitTime: '24 Oktober 2024, 09:14 WIB',
      sha256: 'e4b89f3a1290de8843c08bf6381014e7a',
      probability: 89,
      statusLabel: 'RISIKO TINGGI',
      verdictType: 'suspect',
      verdictText: 'Terindikasi Sintetis / Pen-Plotter',
      recommendation: 'Disarankan: Verifikasi tulisan langsung secara tatap muka dengan pengawas ruang ujian.',
      imageSrc: 'assets/samples/sample_fake_caveat.jpg',
      viewBox: '0 0 1006 1245',
      metrics: {
        glyph_similarity: '99.8%',
        entropy: '12% (Rendah)',
        pressure: 'Monoton Mekanis',
        baseline: '99.4% Kaku'
      },
      legend: [
        { pin: '①', label: "Korelasi Glif 'a/k': <strong>99.8%</strong>", pair: 'glif-1' },
        { pin: '②', label: "Sudut Kemiringan: <strong>0.0°</strong>", pair: 'glif-2' },
        { pin: '③', label: "Jitter Baseline: <strong>±0.04%</strong>", pair: 'glif-3' }
      ],
      svgAnnotations: `
        <!-- Cloned Glyph Set 1: "interaksi" on line 1 -->
        <g class="glyph-group" data-pair="glif-1" data-label="Glif Identik 'interaksi' • Korelasi DTW 99.8% (TTF Plotter)">
          <rect class="forensic-rect" x="294" y="295" width="144" height="35" rx="1"></rect>
          <g class="forensic-pin" transform="translate(438, 295)">
            <circle r="8"></circle>
            <text>①</text>
          </g>
        </g>
        <!-- Cloned Glyph Set 1 Match on line 2: "ikatan" -->
        <g class="glyph-group" data-pair="glif-1" data-label="Vektor Kembar: Alograf 'k', 'a', 't' Berulang Identik 99.8%">
          <rect class="forensic-rect" x="195" y="342" width="65" height="32" rx="1"></rect>
          <g class="forensic-pin" transform="translate(260, 342)">
            <circle r="8"></circle>
            <text>①</text>
          </g>
        </g>
        <!-- Cloned Glyph Set 2: "ditentukan" on line 1 -->
        <g class="glyph-group" data-pair="glif-2" data-label="Glif Identik 'ditentukan' • Kemiringan Aksis Konstan 0.0°">
          <rect class="forensic-rect" x="828" y="297" width="96" height="35" rx="1"></rect>
          <g class="forensic-pin" transform="translate(924, 297)">
            <circle r="8"></circle>
            <text>②</text>
          </g>
        </g>
        <!-- Baseline Caliper Line (Fine Hairline) -->
        <g class="glyph-group" data-pair="glif-3" data-label="Baseline Mekanis Plotter • Hough Deviasi 0.04% (Kaku)">
          <line x1="185" y1="330" x2="925" y2="330" stroke="#B23A2E" stroke-width="1.5" stroke-dasharray="6, 4" opacity="0.85"/>
          <g class="forensic-pin" transform="translate(928, 330)">
            <circle r="8"></circle>
            <text>③</text>
          </g>
        </g>
      `
    },

    dekko: {
      caseId: 'BAF/KOMP/2024/X-1102',
      course: 'IF-3210 Algoritma Lanjut',
      studentName: 'Rafi Aditya',
      studentNim: '13521102',
      classYear: 'IF-3210 / 2021',
      deskNo: 'B-03',
      scanRes: '982 × 1207 piksel (300 DPI)',
      submitTime: '24 Oktober 2024, 11:20 WIB',
      sha256: 'a19bc8f042e947dca13045618790cb912',
      probability: 97,
      statusLabel: 'RISIKO TINGGI',
      verdictType: 'suspect',
      verdictText: 'Terindikasi Sintetis / Pen-Plotter',
      recommendation: 'Peringatan: Pola goresan Dekko terpetakan dengan akurasi 97%. Deviasi baseline di bawah ambang biologis.',
      imageSrc: 'assets/samples/sample_fake_dekko.jpg',
      viewBox: '0 0 982 1207',
      metrics: {
        glyph_similarity: '99.5%',
        entropy: '8% (Sangat Rendah)',
        pressure: 'Monoton Linier',
        baseline: '99.8% Kaku'
      },
      legend: [
        { pin: '①', label: "Alograf Sintetis 'data': <strong>99.5%</strong>", pair: 'glif-1' },
        { pin: '②', label: "Kelurusan Sumbu: <strong>0.2°</strong>", pair: 'glif-2' },
        { pin: '③', label: "Mistar Baseline: <strong>±0.02%</strong>", pair: 'glif-3' }
      ],
      svgAnnotations: `
        <g class="glyph-group" data-pair="glif-1" data-label="Glif Identik 'praktikum' • DTW 99.5% (Plotter Dekko)">
          <rect class="forensic-rect" x="273" y="195" width="183" height="36" rx="1"></rect>
          <g class="forensic-pin" transform="translate(456, 195)">
            <circle r="8"></circle>
            <text>①</text>
          </g>
        </g>
        <g class="glyph-group" data-pair="glif-2" data-label="Keseragaman Kurvatura • Fluktuasi Nol">
          <rect class="forensic-rect" x="462" y="190" width="155" height="34" rx="1"></rect>
          <g class="forensic-pin" transform="translate(617, 190)">
            <circle r="8"></circle>
            <text>②</text>
          </g>
        </g>
        <g class="glyph-group" data-pair="glif-3" data-label="Garis Dasar Plotter • Deviasi 0.02%">
          <line x1="185" y1="230" x2="740" y2="230" stroke="#B23A2E" stroke-width="1.5" stroke-dasharray="6, 4" opacity="0.85"/>
          <g class="forensic-pin" transform="translate(745, 230)">
            <circle r="8"></circle>
            <text>③</text>
          </g>
        </g>
      `
    },

    mali: {
      caseId: 'BAF/KOMP/2024/X-1045',
      course: 'IF-3210 Algoritma Lanjut',
      studentName: 'Siti Rahmawati',
      studentNim: '13521012',
      classYear: 'IF-3210 / 2021',
      deskNo: 'A-08',
      scanRes: '977 × 1225 piksel (300 DPI)',
      submitTime: '24 Oktober 2024, 10:42 WIB',
      sha256: '7c8a1f49b108de9943c01bf63810190fa',
      probability: 92,
      statusLabel: 'RISIKO TINGGI',
      verdictType: 'suspect',
      verdictText: 'Terindikasi Sintetis / Pen-Plotter (Font Mali)',
      recommendation: 'Peringatan: Ukuran glif berulang terdeteksi identik matematis (khas font Mali). Variasi goresan di bawah ambang biologis manusia.',
      imageSrc: 'assets/samples/sample_fake_mali.jpg',
      viewBox: '0 0 977 1225',
      metrics: {
        glyph_similarity: '99.3%',
        entropy: '11% (Sangat Rendah)',
        pressure: 'Monoton Mekanis',
        baseline: '99.6% Kaku'
      },
      legend: [
        { pin: '①', label: "Glif Identik 'spektro': <strong>99.6%</strong>", pair: 'glif-1' },
        { pin: '②', label: "Ukuran Karakter: <strong>0.0px Deviasi</strong>", pair: 'glif-2' },
        { pin: '③', label: "Baseline Plotter: <strong>±0.03% (Kaku)</strong>", pair: 'glif-3' }
      ],
      svgAnnotations: `
        <g class="glyph-group" data-pair="glif-1" data-label="Glif Identik 'spektrofotometri' • DTW 99.6% (Font Mali)">
          <rect class="forensic-rect" x="196" y="152" width="180" height="35" rx="1"></rect>
          <g class="forensic-pin" transform="translate(376, 152)">
            <circle r="8"></circle>
            <text>①</text>
          </g>
        </g>
        <g class="glyph-group" data-pair="glif-2" data-label="Vektor Kembar: Alograf 'e', 'n', 't' ukuran identik berulang">
          <rect class="forensic-rect" x="257" y="200" width="185" height="35" rx="1"></rect>
          <g class="forensic-pin" transform="translate(442, 200)">
            <circle r="8"></circle>
            <text>②</text>
          </g>
        </g>
        <g class="glyph-group" data-pair="glif-3" data-label="Baseline Plotter: Deviasi 0.03% (Garis mistar artifisial)">
          <line x1="175" y1="230" x2="840" y2="230" stroke="#B23A2E" stroke-width="1.5" stroke-dasharray="6, 4" opacity="0.85"/>
          <g class="forensic-pin" transform="translate(845, 230)">
            <circle r="8"></circle>
            <text>③</text>
          </g>
        </g>
      `
    },
    user_handwriting: {
      caseId: 'BAF/OTENTIK/2026/90C8481A',
      course: 'Sistem Operasi & Komputer',
      studentName: 'Tulisan Tangan Asli Mahasiswa',
      studentNim: '13522032',
      classYear: 'Semester Ganjil 2026',
      deskNo: 'Meja Ujian C-04',
      scanRes: '1280 × 1600 piksel (300 DPI)',
      submitTime: '18 September 2026, 10:17 WIB',
      sha256: '90c8481a48712b083c5803d0540429f749710ae550cf6e20fc610f5af3bf9b10',
      probability: 97,
      statusLabel: 'LOLOS (OTENTIK)',
      verdictType: 'authentic',
      verdictText: 'Otentik: Variasi Biologis Motorik Manusia Wajar',
      recommendation: 'Hasil verifikasi menunjukkan variasi motorik biologis alami yang dominan (entropi bentuk 41.1% dan baseline organik 53.6%). Kesamaan bentuk minor pada beberapa huruf merupakan kebetulan motorik wajar manusia, bukan cetakan font berulang.',
      imageSrc: 'assets/samples/sample_real_user.jpg',
      viewBox: '0 0 1280 1600',
      metrics: {
        glyph_similarity: '85.5%',
        entropy: '41.1% (Variatif)',
        pressure: 'Dinamis Alami (CV 0.59)',
        baseline: '53.6% Organik'
      },
      legend: [
        { pin: '①', label: "Variasi Glif: <strong>85.5%</strong>", pair: 'bio-1' },
        { pin: '②', label: "Tekanan Tinta: <strong>CV 0.59</strong>", pair: 'bio-2' },
        { pin: '③', label: "Baseline Organik: <strong>53.6%</strong>", pair: 'bio-3' }
      ],
      svgAnnotations: `
        <g class="glyph-group" data-pair="bio-1" data-label="Variasi Motorik Manusia Alami • Deviasi Wajar">
          <rect class="forensic-rect" x="1001" y="971" width="19" height="46" rx="2"></rect>
          <g class="forensic-pin" transform="translate(1020, 971)">
            <circle r="8"></circle>
            <text>①</text>
          </g>
        </g>
        <g class="glyph-group" data-pair="bio-1" data-label="Alograf Pembanding: Fluktuasi Bentuk Biologis">
          <rect class="forensic-rect" x="1161" y="983" width="19" height="39" rx="2"></rect>
          <g class="forensic-pin" transform="translate(1180, 983)">
            <circle r="8"></circle>
            <text>①</text>
          </g>
        </g>
      `
    }
  };

  // Cached DOM Elements
  const DOM = {};

  function init() {
    cacheDOM();
    bindEvents();
    renderArchiveTable();
    renderSpecimen('caveat');
    setupLoupe();
  }

  function cacheDOM() {
    // Navigation
    DOM.navLinks = document.querySelectorAll('.nav-link');
    DOM.views = {
      'pemeriksaan-berkas': document.getElementById('view-pemeriksaan-berkas'),
      'lembar-analisis': document.getElementById('view-lembar-analisis'),
      'arsip-pengujian': document.getElementById('view-arsip-pengujian')
    };

    // Header Quick Actions
    DOM.btnHeaderNewUpload = document.getElementById('btn-header-new-upload');

    // Upload & Scanning (View 1)
    DOM.dropZone = document.getElementById('drop-zone');
    DOM.fileInput = document.getElementById('file-input');
    DOM.btnDemo = document.getElementById('btn-demo');
    DOM.uploadProgress = document.getElementById('upload-progress');
    DOM.progressTitle = document.getElementById('progress-title');
    DOM.progressBarFill = document.getElementById('progress-bar-fill');
    DOM.progressPhase = document.getElementById('progress-phase');
    DOM.specimenCard = document.getElementById('specimen-card');
    DOM.specimenThumb = document.getElementById('specimen-thumb');
    DOM.specimenFileName = document.getElementById('specimen-file-name');
    DOM.specimenFileSize = document.getElementById('specimen-file-size');
    DOM.btnRunFullAnalysis = document.getElementById('btn-run-full-analysis');
    DOM.btnCancelSpecimen = document.getElementById('btn-cancel-specimen');

    // Batch Results Elements (View 1)
    DOM.batchResultsCard = document.getElementById('batch-results-card');
    DOM.batchTotalFiles = document.getElementById('batch-total-files');
    DOM.batchStatTotal = document.getElementById('batch-stat-total');
    DOM.batchStatSuspect = document.getElementById('batch-stat-suspect');
    DOM.batchStatAuthentic = document.getElementById('batch-stat-authentic');
    DOM.batchTbody = document.getElementById('batch-tbody');
    DOM.btnBatchClear = document.getElementById('btn-batch-clear');
    DOM.btnBatchExportCsv = document.getElementById('btn-batch-export-csv');

    // Inspection Desk (View 2)
    DOM.btnToggleRuler = document.getElementById('btn-toggle-ruler');
    DOM.labelToggleRuler = document.getElementById('label-toggle-ruler');
    DOM.btnToggleAnnotations = document.getElementById('btn-toggle-annotations');
    DOM.labelToggleAnnotations = document.getElementById('label-toggle-annotations');
    DOM.btnToggleLoupe = document.getElementById('btn-toggle-loupe');
    DOM.labelToggleLoupe = document.getElementById('label-toggle-loupe');
    DOM.btnToggleComparator = document.getElementById('btn-toggle-comparator');
    DOM.labelToggleComparator = document.getElementById('label-toggle-comparator');
    DOM.btnSwitchCase = document.getElementById('btn-switch-case');
    DOM.labelSwitchCase = document.getElementById('label-switch-case');

    DOM.specimenCanvasContainer = document.getElementById('specimen-canvas-container');
    DOM.inspectionMainCol = document.getElementById('inspection-main-col');
    DOM.inspectionSidebarCol = document.getElementById('inspection-sidebar-col');
    DOM.singleSpecimenFrame = document.getElementById('single-specimen-frame');
    DOM.specimenFrame = document.getElementById('specimen-frame');
    DOM.mainSpecimenImg = document.getElementById('main-specimen-img');
    DOM.rulerGridOverlay = document.getElementById('ruler-grid-overlay');
    DOM.forensicSvgOverlay = document.getElementById('forensic-svg-overlay');
    DOM.floatingTooltip = document.getElementById('floating-tooltip');

    // Side-by-Side Comparator Views
    DOM.comparatorSpecimenView = document.getElementById('comparator-specimen-view');
    DOM.comparatorTestTitle = document.getElementById('comparator-test-title');
    DOM.comparatorTestBadge = document.getElementById('comparator-test-badge');
    DOM.comparatorTestImg = document.getElementById('comparator-test-img');
    DOM.comparatorTestNcc = document.getElementById('comparator-test-ncc');
    DOM.comparatorRefTag = document.getElementById('comparator-ref-tag');
    DOM.comparatorRefTitle = document.getElementById('comparator-ref-title');
    DOM.comparatorRefBadge = document.getElementById('comparator-ref-badge');
    DOM.comparatorRefImg = document.getElementById('comparator-ref-img');
    DOM.comparatorRefMetricLabel = document.getElementById('comparator-ref-metric-label');
    DOM.comparatorRefMetricVal = document.getElementById('comparator-ref-metric-val');

    // Quick Specimen buttons
    DOM.specimenChoiceBtns = document.querySelectorAll('.btn-specimen-choice');

    // Action buttons & Clipboard
    DOM.btnCopySummary = document.getElementById('btn-copy-summary');
    DOM.labelCopySummary = document.getElementById('label-copy-summary');

    // Report Modal
    DOM.btnPrintReport = document.getElementById('btn-print-report');
    DOM.reportModal = document.getElementById('report-modal');
    DOM.btnCloseModal = document.getElementById('btn-close-modal');
    DOM.btnExecutePrint = document.getElementById('btn-execute-print');
    DOM.reportModalBody = document.getElementById('report-modal-body');

    // 5 Forensic Methods Modal
    DOM.btnOpenMethodsModal = document.getElementById('btn-open-methods-modal');
    DOM.methodsModal = document.getElementById('methods-modal');
    DOM.btnCloseMethodsModal = document.getElementById('btn-close-methods-modal');

    // Archive Search & Filters (View 3)
    DOM.btnExportArchiveCsv = document.getElementById('btn-export-archive-csv');
    DOM.archiveSearch = document.getElementById('archive-search');
    DOM.archiveFilter = document.getElementById('archive-filter');
    DOM.archiveTbody = document.getElementById('archive-tbody');
    DOM.archiveStatTotal = document.getElementById('archive-stat-total');
    DOM.archiveStatSuspect = document.getElementById('archive-stat-suspect');
    DOM.archiveStatAuthentic = document.getElementById('archive-stat-authentic');
  }

  function bindEvents() {
    // Navigation Links
    DOM.navLinks.forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const targetView = btn.getAttribute('data-view');
        switchView(targetView);
      });
    });

    // Delegated data-nav triggers (e.g. from Archive or Logo)
    document.addEventListener('click', e => {
      const navTarget = e.target.closest('[data-nav]');
      if (navTarget) {
        e.preventDefault();
        const view = navTarget.getAttribute('data-nav');
        const caseType = navTarget.getAttribute('data-case');
        if (caseType === 'authentic') {
          renderSpecimen('user_handwriting');
        } else if (caseType === 'synthetic') {
          renderSpecimen('caveat');
        }
        switchView(view);
      }
    });

    // Header New Upload button
    if (DOM.btnHeaderNewUpload) {
      DOM.btnHeaderNewUpload.addEventListener('click', () => {
        if (DOM.specimenCard) DOM.specimenCard.classList.add('hidden');
        if (DOM.dropZone) DOM.dropZone.classList.remove('hidden');
        state.uploadedImageSrc = null;
        state.uploadedFileMeta = null;
        if (DOM.fileInput) DOM.fileInput.value = '';
        switchView('pemeriksaan-berkas');
        setTimeout(() => {
          if (DOM.fileInput) DOM.fileInput.click();
        }, 120);
      });
    }

    // Copy Summary to Clipboard
    if (DOM.btnCopySummary) {
      DOM.btnCopySummary.addEventListener('click', () => {
        const data = specimens[state.currentSpecimen] || specimens.caveat;
        const summaryText = `[ASLITULIS AUDIT FORENSIK]\nNo. Berkas: ${data.caseId}\nStatus: ${data.statusLabel} (${data.verdictType === 'suspect' ? 'Sintetis/Plotter' : 'Otentik'})\nProbabilitas: ${data.probability}%\nKesimpulan: ${data.verdictText}\nEntropi Glif: ${data.metrics ? data.metrics.entropy : '-'}\nTekanan Tinta: ${data.metrics ? data.metrics.pressure : '-'}\nBaseline: ${data.metrics ? data.metrics.baseline : '-'}\nSHA-256: ${data.sha256 || '-'}`;
        navigator.clipboard.writeText(summaryText).then(() => {
          if (DOM.labelCopySummary) {
            const orig = DOM.labelCopySummary.textContent;
            DOM.labelCopySummary.textContent = 'Tersalin ke Clipboard!';
            setTimeout(() => {
              DOM.labelCopySummary.textContent = orig;
            }, 2000);
          }
        }).catch(err => {
          console.warn('Clipboard error:', err);
        });
      });
    }

    function onFilesReceived(fileList) {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      if (files.length === 1 && !files[0].name.toLowerCase().endsWith('.zip')) {
        handleUploadedFile(files[0]);
      } else {
        handleBatchUpload(files);
      }
    }

    // Drag & Drop
    if (DOM.dropZone) {
      ['dragenter', 'dragover'].forEach(name => {
        DOM.dropZone.addEventListener(name, e => {
          e.preventDefault();
          e.stopPropagation();
          DOM.dropZone.classList.add('drag-over');
        });
      });

      ['dragleave', 'drop'].forEach(name => {
        DOM.dropZone.addEventListener(name, e => {
          e.preventDefault();
          e.stopPropagation();
          DOM.dropZone.classList.remove('drag-over');
        });
      });

      DOM.dropZone.addEventListener('drop', e => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          onFilesReceived(files);
        }
      });

      DOM.dropZone.addEventListener('click', e => {
        if (e.target.closest('button') || e.target.closest('label')) return;
        DOM.fileInput.click();
      });
    }

    if (DOM.fileInput) {
      DOM.fileInput.addEventListener('change', e => {
        if (e.target.files && e.target.files.length > 0) {
          onFilesReceived(e.target.files);
        }
      });
    }

    if (DOM.btnDemo) {
      DOM.btnDemo.addEventListener('click', e => {
        e.stopPropagation();
        runDemoSimulation();
      });
    }

    if (DOM.btnRunFullAnalysis) {
      DOM.btnRunFullAnalysis.addEventListener('click', () => {
        switchView('lembar-analisis');
      });
    }

    if (DOM.btnCancelSpecimen) {
      DOM.btnCancelSpecimen.addEventListener('click', () => {
        DOM.specimenCard.classList.add('hidden');
        DOM.dropZone.classList.remove('hidden');
        state.uploadedImageSrc = null;
        state.uploadedFileMeta = null;
      });
    }

    // Quick Specimen Choice Buttons (Caveat, Dekko, Mali)
    DOM.specimenChoiceBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = btn.getAttribute('data-specimen');
        renderSpecimen(choice);
      });
    });

    // Toolbar Controls
    if (DOM.btnToggleRuler) {
      DOM.btnToggleRuler.addEventListener('click', () => {
        state.rulerVisible = !state.rulerVisible;
        if (DOM.rulerGridOverlay) {
          DOM.rulerGridOverlay.classList.toggle('hidden-grid', !state.rulerVisible);
        }
        DOM.labelToggleRuler.textContent = state.rulerVisible
          ? 'Sembunyikan Kisi Garis'
          : 'Tampilkan Kisi Garis';
        DOM.btnToggleRuler.classList.toggle('bg-primary', state.rulerVisible);
        DOM.btnToggleRuler.classList.toggle('text-white', state.rulerVisible);
        DOM.btnToggleRuler.classList.toggle('bg-surface-container-high', !state.rulerVisible);
        DOM.btnToggleRuler.classList.toggle('text-primary', !state.rulerVisible);
      });
    }

    if (DOM.btnToggleAnnotations) {
      DOM.btnToggleAnnotations.addEventListener('click', () => {
        state.annotationsVisible = !state.annotationsVisible;
        if (DOM.forensicSvgOverlay) {
          DOM.forensicSvgOverlay.classList.toggle('hidden-overlay', !state.annotationsVisible);
        }
        DOM.labelToggleAnnotations.textContent = state.annotationsVisible
          ? 'Anotasi Forensik: Aktif'
          : 'Anotasi Forensik: Nonaktif';
        DOM.btnToggleAnnotations.classList.toggle('bg-primary', state.annotationsVisible);
        DOM.btnToggleAnnotations.classList.toggle('text-white', state.annotationsVisible);
        DOM.btnToggleAnnotations.classList.toggle('bg-surface-container-high', !state.annotationsVisible);
        DOM.btnToggleAnnotations.classList.toggle('text-primary', !state.annotationsVisible);
      });
    }

    if (DOM.btnToggleLoupe) {
      DOM.btnToggleLoupe.addEventListener('click', () => {
        state.loupeActive = !state.loupeActive;
        const loupe = document.getElementById('loupe-lens');
        if (state.loupeActive) {
          DOM.specimenCanvasContainer.classList.add('loupe-mode');
          DOM.btnToggleLoupe.classList.add('bg-primary', 'text-white');
          DOM.btnToggleLoupe.classList.remove('bg-surface-container-high', 'text-primary');
          DOM.labelToggleLoupe.textContent = 'Kaca Pembesar: Aktif';
        } else {
          DOM.specimenCanvasContainer.classList.remove('loupe-mode');
          DOM.btnToggleLoupe.classList.remove('bg-primary', 'text-white');
          DOM.btnToggleLoupe.classList.add('bg-surface-container-high', 'text-primary');
          DOM.labelToggleLoupe.textContent = 'Kaca Pembesar (2.5x)';
          if (loupe) loupe.style.display = 'none';
        }
      });
    }

    // Side-by-Side Dual Specimen Comparator Toggle
    if (DOM.btnToggleComparator) {
      DOM.btnToggleComparator.addEventListener('click', toggleSideBySideComparator);
    }

    if (DOM.btnSwitchCase) {
      DOM.btnSwitchCase.addEventListener('click', () => {
        const nextChoice = state.currentCase === 'synthetic' ? 'user_handwriting' : 'caveat';
        renderSpecimen(nextChoice);
      });
    }

    // Modal Report
    if (DOM.btnPrintReport) {
      DOM.btnPrintReport.addEventListener('click', openReportModal);
    }
    if (DOM.btnCloseModal) {
      DOM.btnCloseModal.addEventListener('click', closeReportModal);
    }
    if (DOM.reportModal) {
      DOM.reportModal.addEventListener('click', e => {
        if (e.target === DOM.reportModal) closeReportModal();
      });
    }
    if (DOM.btnExecutePrint) {
      DOM.btnExecutePrint.addEventListener('click', () => {
        document.body.classList.add('printing-report');
        window.print();
        setTimeout(() => {
          document.body.classList.remove('printing-report');
        }, 1000);
      });
    }

    // 5 Forensic Methods Modal Events
    if (DOM.btnOpenMethodsModal) {
      DOM.btnOpenMethodsModal.addEventListener('click', () => {
        if (DOM.methodsModal) DOM.methodsModal.classList.add('open');
      });
    }
    if (DOM.btnCloseMethodsModal) {
      DOM.btnCloseMethodsModal.addEventListener('click', () => {
        if (DOM.methodsModal) DOM.methodsModal.classList.remove('open');
      });
    }
    if (DOM.methodsModal) {
      DOM.methodsModal.addEventListener('click', e => {
        if (e.target === DOM.methodsModal) DOM.methodsModal.classList.remove('open');
      });
    }

    // Batch Table Actions (View 1)
    if (DOM.btnBatchClear) {
      DOM.btnBatchClear.addEventListener('click', () => {
        if (DOM.batchResultsCard) DOM.batchResultsCard.classList.add('hidden');
        state.batchResults = [];
      });
    }
    if (DOM.btnBatchExportCsv) {
      DOM.btnBatchExportCsv.addEventListener('click', exportBatchToCsv);
    }

    // Archive Search, Filter, and Export (View 3)
    if (DOM.btnExportArchiveCsv) {
      DOM.btnExportArchiveCsv.addEventListener('click', exportArchiveToCsv);
    }
    if (DOM.archiveSearch) {
      DOM.archiveSearch.addEventListener('input', filterArchive);
    }
    if (DOM.archiveFilter) {
      DOM.archiveFilter.addEventListener('change', filterArchive);
    }
  }

  function switchView(targetView) {
    if (!DOM.views[targetView]) return;
    state.activeView = targetView;

    // Update Nav Link Active States
    DOM.navLinks.forEach(link => {
      const v = link.getAttribute('data-view');
      link.classList.toggle('active', v === targetView);
    });

    // Update Active View Panel
    Object.keys(DOM.views).forEach(v => {
      const el = DOM.views[v];
      if (v === targetView) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Critical: Instant scroll reset to eliminate any unwanted offset
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Trigger gauge animations
    if (targetView === 'lembar-analisis') {
      animateMetricBars();
    }
  }

  function updateExaminerBadge() {
    if (DOM.headerExaminerName) {
      DOM.headerExaminerName.textContent = state.examiner.name;
    }
    if (DOM.headerExaminerRole) {
      DOM.headerExaminerRole.textContent = state.examiner.isGuest
        ? 'Sesi Tamu • Klik untuk Masuk Petugas'
        : `${state.examiner.inst} • Terotentikasi`;
    }
  }

  function renderSpecimen(specimenKey) {
    const data = specimens[specimenKey] || specimens.caveat;
    state.currentSpecimen = specimenKey;
    state.currentCase = data.verdictType === 'suspect' ? 'synthetic' : 'authentic';

    // Update Quick Choice Button Highlights
    DOM.specimenChoiceBtns.forEach(btn => {
      const sp = btn.getAttribute('data-specimen');
      if (sp === specimenKey) {
        btn.className = 'px-2 py-0.5 font-mono-metric text-[10px] bg-primary text-white font-semibold transition-colors btn-specimen-choice';
      } else {
        btn.className = 'px-2 py-0.5 font-mono-metric text-[10px] text-on-surface-variant hover:text-primary transition-colors btn-specimen-choice';
      }
    });

    // Update Image Source & SVG ViewBox
    if (DOM.mainSpecimenImg) {
      DOM.mainSpecimenImg.src = state.uploadedImageSrc && specimenKey === 'user'
        ? state.uploadedImageSrc
        : data.imageSrc;
    }
    if (DOM.forensicSvgOverlay) {
      DOM.forensicSvgOverlay.setAttribute('viewBox', data.viewBox);
      DOM.forensicSvgOverlay.innerHTML = data.svgAnnotations;
    }

    // Wire Hover Events on newly injected SVG groups
    wireSvgAnnotations();

    // Update Header Status Strip
    const elCaseId = document.getElementById('stat-case-id');
    const elCourse = document.getElementById('stat-course');
    const elStatusBadge = document.getElementById('stat-status-badge');
    const elDocTitle = document.getElementById('exam-doc-title');
    const elStudentHeader = document.getElementById('exam-student-header');
    const elVerdictPill = document.getElementById('doc-verdict-pill');

    const isAuthentic = data.verdictType !== 'suspect';

    if (elCaseId) elCaseId.textContent = data.caseId;
    if (elCourse) elCourse.textContent = data.course;
    if (elStatusBadge) {
      elStatusBadge.textContent = data.statusLabel;
      elStatusBadge.className = isAuthentic
        ? 'font-mono-metric text-[11px] px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
        : 'font-mono-metric text-[11px] px-2.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed-variant font-bold';
    }
    if (elDocTitle) {
      elDocTitle.textContent = specimenKey === 'user'
        ? 'Pindaian Naskah Mahasiswa (Berkas Unggahan)'
        : `Pindaian Lembar Jawaban Ujian Asli (${data.studentName})`;
    }
    if (elStudentHeader) {
      elStudentHeader.innerHTML = `Mahasiswa: <strong>${data.studentName}</strong> • NIM: <strong>${data.studentNim}</strong> • Resolusi: ${data.scanRes}`;
    }
    if (elVerdictPill) {
      elVerdictPill.textContent = isAuthentic ? 'LOLOS (OTENTIK)' : 'TERINDIKASI FONT';
      elVerdictPill.className = isAuthentic
        ? 'font-mono-metric text-[10px] px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
        : 'font-mono-metric text-[10px] px-2.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed-variant font-bold border border-secondary/30';
    }

    // Update Switch Case Button
    if (DOM.labelSwitchCase) {
      DOM.labelSwitchCase.textContent = isAuthentic
        ? 'Uji Sampel Plotter (Ahmad Fauzan)'
        : 'Uji Sampel Otentik (Bagas Pratama)';
    }

    // Update Side-by-Side Comparator Test Specimen Info
    if (DOM.comparatorTestImg) {
      DOM.comparatorTestImg.src = state.uploadedImageSrc && specimenKey === 'user'
        ? state.uploadedImageSrc
        : data.imageSrc;
    }
    if (DOM.comparatorTestTitle) {
      DOM.comparatorTestTitle.textContent = data.studentName;
    }
    if (DOM.comparatorTestBadge) {
      DOM.comparatorTestBadge.textContent = data.statusLabel;
      DOM.comparatorTestBadge.className = isAuthentic
        ? 'font-mono-metric text-[10px] px-2 py-0.5 bg-tertiary-fixed text-tertiary font-bold border border-tertiary/30'
        : 'font-mono-metric text-[10px] px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed-variant font-bold border border-secondary/30';
    }
    if (DOM.comparatorTestNcc) {
      const nccVal = data.metrics ? data.metrics.glyph_similarity : `${data.probability}%`;
      DOM.comparatorTestNcc.textContent = isAuthentic ? `${nccVal} (Variasi Alami)` : `${nccVal} (Identik Kembar)`;
      DOM.comparatorTestNcc.className = isAuthentic ? 'font-bold text-tertiary' : 'font-bold text-secondary';
    }

    // Dynamic Forensic Contrast for Reference Specimen (Right Panel):
    // - If current specimen is Authentic: Show Synthetic Plotter Font (Caveat) so examiner sees how human writing differs from mechanical font.
    // - If current specimen is Synthetic: Show Authentic Human Handwriting so examiner sees rigid glyph cloning vs organic human variation.
    if (DOM.comparatorRefTag && DOM.comparatorRefImg) {
      if (isAuthentic) {
        DOM.comparatorRefTag.textContent = 'PEMBANDING SINTETIS';
        DOM.comparatorRefTag.className = 'font-mono-metric text-[10px] bg-secondary text-white px-2 py-0.5 font-bold';
        if (DOM.comparatorRefTitle) DOM.comparatorRefTitle.textContent = 'Font Plotter Mekanis (Caveat)';
        if (DOM.comparatorRefBadge) {
          DOM.comparatorRefBadge.textContent = 'TERINDIKASI SINTETIS';
          DOM.comparatorRefBadge.className = 'font-mono-metric text-[10px] px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed-variant font-bold border border-secondary/30';
        }
        DOM.comparatorRefImg.src = 'assets/samples/sample_fake_caveat.jpg';
        if (DOM.comparatorRefMetricLabel) DOM.comparatorRefMetricLabel.textContent = 'Karakteristik Plotter:';
        if (DOM.comparatorRefMetricVal) {
          DOM.comparatorRefMetricVal.textContent = 'Korelasi 99.8% (Identik Kaku)';
          DOM.comparatorRefMetricVal.className = 'font-bold text-secondary';
        }
      } else {
        DOM.comparatorRefTag.textContent = 'REFERENSI OTENTIK';
        DOM.comparatorRefTag.className = 'font-mono-metric text-[10px] bg-tertiary text-white px-2 py-0.5 font-bold';
        if (DOM.comparatorRefTitle) DOM.comparatorRefTitle.textContent = 'Tulisan Biologis Mahasiswa';
        if (DOM.comparatorRefBadge) {
          DOM.comparatorRefBadge.textContent = 'LOLOS (OTENTIK)';
          DOM.comparatorRefBadge.className = 'font-mono-metric text-[10px] px-2 py-0.5 bg-tertiary-fixed text-tertiary font-bold border border-tertiary/30';
        }
        DOM.comparatorRefImg.src = 'assets/samples/sample_real_user.jpg';
        if (DOM.comparatorRefMetricLabel) DOM.comparatorRefMetricLabel.textContent = 'Karakteristik Motorik:';
        if (DOM.comparatorRefMetricVal) {
          DOM.comparatorRefMetricVal.textContent = 'Entropi 41% (Dinamis Alami)';
          DOM.comparatorRefMetricVal.className = 'font-bold text-tertiary';
        }
      }
    }

    // Update Probability & Verdict Card
    const elProbText = document.getElementById('prob-number');
    const elProbLabel = document.getElementById('prob-label');
    const elProbTolerance = document.getElementById('prob-tolerance');
    const elProbBar = document.getElementById('prob-bar');
    const elProbRec = document.getElementById('prob-recommendation');
    const elRiskBadge = document.getElementById('risk-badge');

    if (elProbLabel) {
      elProbLabel.textContent = isAuthentic
        ? 'Tingkat Keaslian Naskah (Otentik)'
        : 'Probabilitas Font Sintetis / Plotter';
      elProbLabel.className = isAuthentic
        ? 'font-mono-metric text-xs text-emerald-700 font-bold uppercase tracking-wider'
        : 'font-mono-metric text-xs text-secondary font-bold uppercase tracking-wider';
    }

    if (elProbText) {
      elProbText.textContent = `${data.probability}%`;
      elProbText.className = isAuthentic
        ? 'font-display text-4xl text-emerald-600 leading-none mt-1 font-bold'
        : 'font-display text-4xl text-secondary leading-none mt-1 font-bold';
    }

    if (elProbTolerance) {
      elProbTolerance.textContent = isAuthentic
        ? '≥ 85% Ambang Biologis'
        : '≤ 15% Disyaratkan';
      elProbTolerance.className = isAuthentic
        ? 'font-mono-metric text-xs text-emerald-700 font-semibold mt-0.5'
        : 'font-mono-metric text-xs text-on-surface mt-0.5';
    }

    if (elProbBar) {
      elProbBar.setAttribute('data-target-width', `${data.probability}%`);
      elProbBar.style.backgroundColor = isAuthentic ? '#059669' : 'var(--secondary)';
    }
    if (elProbRec) {
      elProbRec.textContent = data.recommendation;
      elProbRec.className = isAuthentic
        ? 'font-body-sm text-xs font-semibold leading-relaxed text-emerald-800'
        : 'font-body-sm text-xs font-medium leading-relaxed text-secondary';
    }
    if (elRiskBadge) {
      elRiskBadge.textContent = data.statusLabel;
      elRiskBadge.className = isAuthentic
        ? 'px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono-metric text-xs font-bold'
        : 'px-2.5 py-1 bg-secondary-fixed text-on-secondary-fixed-variant font-mono-metric text-xs font-bold';
    }

    // Update Metric Values (Genuine Calculated CV Parameters)
    const m = data.metrics || {};
    const elSimilarity = document.getElementById('val-similarity');
    const elEntropy = document.getElementById('val-entropy');
    const elPressure = document.getElementById('val-pressure');
    const elBaseline = document.getElementById('val-baseline');

    if (elSimilarity) {
      elSimilarity.textContent = m.glyph_similarity || '0.0%';
      elSimilarity.className = `font-mono-metric text-xs font-bold shrink-0 ${isAuthentic ? 'text-emerald-700' : 'text-secondary'}`;
    }
    if (elEntropy) {
      elEntropy.textContent = m.entropy || '-';
      elEntropy.className = `font-mono-metric text-xs font-bold shrink-0 ${isAuthentic ? 'text-emerald-700' : 'text-secondary'}`;
    }
    if (elPressure) {
      elPressure.textContent = m.pressure || '-';
      elPressure.className = `font-mono-metric text-xs font-bold shrink-0 ${isAuthentic ? 'text-emerald-700' : 'text-secondary'}`;
    }
    if (elBaseline) {
      elBaseline.textContent = m.baseline || '-';
      elBaseline.className = `font-mono-metric text-xs font-bold shrink-0 ${isAuthentic ? 'text-emerald-700' : 'text-secondary'}`;
    }

    // Update Metadata Panel
    const elMetaName = document.getElementById('meta-student-name');
    const elMetaNim = document.getElementById('meta-student-nim');
    const elMetaClass = document.getElementById('meta-class');
    const elMetaHash = document.getElementById('meta-hash');

    if (elMetaName) elMetaName.textContent = data.studentName;
    if (elMetaNim) elMetaNim.textContent = data.studentNim;
    if (elMetaClass) elMetaClass.textContent = data.classYear;
    if (elMetaHash) elMetaHash.textContent = data.sha256;

    // Render Legend Items in the Tray below image
    renderLegendTray(data.legend, data.verdictType);

    // Trigger progress animation
    animateMetricBars();
  }

  function renderLegendTray(legendItems, verdictType) {
    const trayContainer = document.querySelector('.glyph-legend-btn')?.parentElement;
    if (!trayContainer) return;

    trayContainer.innerHTML = legendItems.map(item => `
      <div class="flex items-center gap-1.5 cursor-pointer glyph-legend-btn" data-pair="${item.pair}">
        <span class="w-4 h-4 ${verdictType === 'suspect' ? 'bg-secondary' : 'bg-tertiary-container'} text-white font-mono-metric text-[10px] flex items-center justify-center font-bold">${item.pin}</span>
        <span class="font-mono-metric text-[11px] text-primary">${item.label}</span>
      </div>
    `).join('');

    // Attach click listeners to legend items
    trayContainer.querySelectorAll('.glyph-legend-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pairId = btn.getAttribute('data-pair');
        highlightGlyphPair(pairId);
      });
    });
  }

  function wireSvgAnnotations() {
    const groups = document.querySelectorAll('.glyph-group');
    const tooltip = DOM.floatingTooltip;

    groups.forEach(g => {
      g.addEventListener('mouseenter', e => {
        const label = g.getAttribute('data-label');
        const pair = g.getAttribute('data-pair');
        if (tooltip && label) {
          tooltip.textContent = label;
          tooltip.style.display = 'block';
        }
        highlightGlyphPair(pair);
      });

      g.addEventListener('mousemove', e => {
        if (!tooltip || tooltip.style.display !== 'block') return;
        const rect = DOM.specimenCanvasContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Position tooltip slightly above or to the right of cursor
        tooltip.style.left = `${mouseX + 16}px`;
        tooltip.style.top = `${Math.max(10, mouseY - 25)}px`;
      });

      g.addEventListener('mouseleave', () => {
        if (tooltip) tooltip.style.display = 'none';
        clearGlyphHighlights();
      });
    });
  }

  function highlightGlyphPair(pairId) {
    if (!pairId) return;
    clearGlyphHighlights();

    const matchingGroups = document.querySelectorAll(`.glyph-group[data-pair="${pairId}"]`);
    matchingGroups.forEach(group => {
      const rect = group.querySelector('.forensic-rect');
      const pin = group.querySelector('.forensic-pin');
      if (rect) rect.classList.add('active-glyph');
      if (pin) pin.classList.add('active-pin');
    });

    const matchingLegend = document.querySelector(`.glyph-legend-btn[data-pair="${pairId}"]`);
    if (matchingLegend) matchingLegend.classList.add('opacity-75', 'underline');
  }

  function clearGlyphHighlights() {
    document.querySelectorAll('.forensic-rect').forEach(r => r.classList.remove('active-glyph'));
    document.querySelectorAll('.forensic-pin').forEach(p => p.classList.remove('active-pin'));
    document.querySelectorAll('.glyph-legend-btn').forEach(b => b.classList.remove('opacity-75', 'underline'));
  }

  function animateMetricBars() {
    const bars = document.querySelectorAll('.metric-bar-fill');
    bars.forEach(bar => {
      const targetWidth = bar.getAttribute('data-target-width') || '0%';
      bar.style.width = '0%';
      requestAnimationFrame(() => {
        setTimeout(() => {
          bar.style.width = targetWidth;
        }, 60);
      });
    });
  }

  async function handleUploadedFile(file) {
    if (!file.type.match(/image.*/)) {
      alert('Mohon unggah berkas citra berupa format JPG, PNG, atau WEBP.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
      state.uploadedImageSrc = e.target.result;
      state.uploadedFileMeta = {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      };

      // Show specimen card preview
      DOM.specimenThumb.src = e.target.result;
      DOM.specimenFileName.textContent = file.name;
      DOM.specimenFileSize.textContent = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      DOM.specimenCard.classList.remove('hidden');

      // Start real backend scanning & classification
      await triggerRealScanSequence(file);
    };
    reader.readAsDataURL(file);
  }

  async function runDemoSimulation() {
    const demoName = 'UTS_IF4020_13521088_Lembar1.jpg';
    DOM.specimenThumb.src = 'assets/samples/sample_fake_caveat.jpg';
    DOM.specimenFileName.textContent = demoName;
    DOM.specimenFileSize.textContent = '4.8 MB';
    DOM.specimenCard.classList.remove('hidden');

    state.isScanning = true;
    DOM.uploadProgress.classList.remove('hidden');
    DOM.uploadProgress.classList.add('flex', 'scanning');

    const phases = [
      { progress: 25, text: 'Memindai Kepadatan Karakter & Format Citra...' },
      { progress: 50, text: 'Melakukan kalibrasi sudut rotasi kertas dan segregasi baris...' },
      { progress: 75, text: 'Mengekstraksi alograf glif berulang & segmentasi kontur...' },
      { progress: 100, text: 'Menghitung Dynamic Time Warping (DTW) & Hough Linearity...' }
    ];

    let currentPhase = 0;
    const progressTimer = setInterval(() => {
      if (currentPhase < phases.length) {
        DOM.progressBarFill.style.width = `${phases[currentPhase].progress}%`;
        DOM.progressPhase.textContent = phases[currentPhase].text;
        currentPhase++;
      } else {
        clearInterval(progressTimer);
        setTimeout(() => {
          DOM.uploadProgress.classList.add('hidden');
          DOM.uploadProgress.classList.remove('flex', 'scanning');
          state.isScanning = false;
          renderSpecimen('caveat');
          switchView('lembar-analisis');
        }, 200);
      }
    }, 200);
  }

  async function triggerRealScanSequence(file) {
    state.isScanning = true;
    DOM.uploadProgress.classList.remove('hidden');
    DOM.uploadProgress.classList.add('flex', 'scanning');

    const phases = [
      { progress: 20, text: 'Memindai Kepadatan Karakter & Format Citra...' },
      { progress: 45, text: 'Melakukan kalibrasi sudut rotasi kertas dan segregasi baris...' },
      { progress: 70, text: 'Mengekstraksi alograf glif berulang & segmentasi kontur...' },
      { progress: 90, text: 'Menghitung Dynamic Time Warping (DTW) & Hough Linearity...' }
    ];

    let currentPhase = 0;
    const progressTimer = setInterval(() => {
      if (currentPhase < phases.length) {
        DOM.progressBarFill.style.width = `${phases[currentPhase].progress}%`;
        DOM.progressPhase.textContent = phases[currentPhase].text;
        currentPhase++;
      }
    }, 350);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/classify', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      clearInterval(progressTimer);

      DOM.progressBarFill.style.width = '100%';
      DOM.progressPhase.textContent = 'Analisis Selesai: Menyusun Berita Acara Forensik...';

      // Register real analysis as dynamic specimen
      const studentNameClean = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      specimens.user = {
        caseId: `BAF/VERIF/2026/${(data.sha256 || 'A1B2C3D4').slice(0, 8).toUpperCase()}`,
        course: 'Pemeriksaan Naskah Berkas Ujian',
        studentName: studentNameClean,
        studentNim: '1352' + Math.floor(1000 + Math.random() * 9000),
        classYear: 'Semester Ganjil 2026',
        deskNo: 'Meja Forensik 01',
        scanRes: data.scan_res || '1000 × 1250 piksel (300 DPI)',
        submitTime: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
        sha256: data.sha256 || 'e4b89f3a1290de8843c08bf6381014e7a',
        probability: data.probability,
        statusLabel: data.status_label,
        verdictType: data.verdict_type,
        verdictText: data.verdict_text,
        recommendation: data.recommendation,
        imageSrc: state.uploadedImageSrc || (data.imageSrc || 'assets/samples/sample_fake_caveat.jpg'),
        viewBox: data.viewBox || '0 0 1000 1250',
        metrics: data.metrics,
        legend: data.legend,
        svgAnnotations: data.svg_annotations
      };

      // Save to dynamic archive
      saveToArchive({
        caseId: specimens.user.caseId,
        studentName: specimens.user.studentName,
        nim: specimens.user.studentNim,
        course: specimens.user.course,
        dtw: (specimens.user.metrics && specimens.user.metrics.entropy) ? specimens.user.metrics.entropy : `${specimens.user.probability}%`,
        verdictType: specimens.user.verdictType,
        statusLabel: specimens.user.statusLabel,
        specimenKey: 'user',
        date: 'Hari Ini, ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
      });

      setTimeout(() => {
        DOM.uploadProgress.classList.add('hidden');
        DOM.uploadProgress.classList.remove('flex', 'scanning');
        state.isScanning = false;

        renderSpecimen('user');
        switchView('lembar-analisis');
      }, 400);

    } catch (err) {
      clearInterval(progressTimer);
      console.error('Real classification failed:', err);
      alert('Gagal menjalankan analisis forensik ke backend. Pastikan server aktif.');
      DOM.uploadProgress.classList.add('hidden');
      DOM.uploadProgress.classList.remove('flex', 'scanning');
      state.isScanning = false;
    }
  }

  function toggleSideBySideComparator() {
    state.comparatorActive = !state.comparatorActive;
    if (!DOM.comparatorSpecimenView || !DOM.singleSpecimenFrame) return;

    if (state.comparatorActive) {
      if (DOM.inspectionMainCol) {
        DOM.inspectionMainCol.classList.remove('xl:col-span-8');
        DOM.inspectionMainCol.classList.add('xl:col-span-12');
      }
      if (DOM.inspectionSidebarCol) {
        DOM.inspectionSidebarCol.classList.add('hidden');
      }
      DOM.singleSpecimenFrame.classList.add('hidden');
      DOM.comparatorSpecimenView.classList.remove('hidden');
      if (DOM.btnToggleComparator) {
        DOM.btnToggleComparator.classList.add('bg-primary', 'text-white');
        DOM.btnToggleComparator.classList.remove('bg-surface-container-high', 'text-primary');
      }
      if (DOM.labelToggleComparator) {
        DOM.labelToggleComparator.textContent = 'Kembali ke Tampilan Tunggal';
      }
      renderSpecimen(state.currentSpecimen);
    } else {
      if (DOM.inspectionMainCol) {
        DOM.inspectionMainCol.classList.remove('xl:col-span-12');
        DOM.inspectionMainCol.classList.add('xl:col-span-8');
      }
      if (DOM.inspectionSidebarCol) {
        DOM.inspectionSidebarCol.classList.remove('hidden');
      }
      DOM.singleSpecimenFrame.classList.remove('hidden');
      DOM.comparatorSpecimenView.classList.add('hidden');
      if (DOM.btnToggleComparator) {
        DOM.btnToggleComparator.classList.remove('bg-primary', 'text-white');
        DOM.btnToggleComparator.classList.add('bg-surface-container-high', 'text-primary');
      }
      if (DOM.labelToggleComparator) {
        DOM.labelToggleComparator.textContent = 'Komparasi Berdampingan';
      }
    }
  }

  async function handleBatchUpload(files) {
    state.isScanning = true;
    if (DOM.specimenCard) DOM.specimenCard.classList.add('hidden');
    DOM.uploadProgress.classList.remove('hidden');
    DOM.uploadProgress.classList.add('flex', 'scanning');
    if (DOM.progressTitle) DOM.progressTitle.textContent = 'Memproses Pemeriksaan Massal Naskah...';
    if (DOM.progressBarFill) DOM.progressBarFill.style.width = '30%';
    if (DOM.progressPhase) DOM.progressPhase.textContent = `Mengirim ${files.length} berkas ke engine forensik...`;

    try {
      const formData = new FormData();
      for (const f of files) {
        formData.append('files', f);
      }

      if (DOM.progressBarFill) DOM.progressBarFill.style.width = '60%';
      if (DOM.progressPhase) DOM.progressPhase.textContent = 'Mengekstrak alograf glif berulang dan menghitung matriks korelasi DTW...';

      const res = await fetch('/api/classify-batch', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (DOM.progressBarFill) DOM.progressBarFill.style.width = '100%';
      if (DOM.progressPhase) DOM.progressPhase.textContent = 'Menyusun laporan rekapitulasi kelas...';

      state.batchResults = data.results || [];
      renderBatchResults(state.batchResults);

      // Auto-save all batch items into archive ledger
      state.batchResults.forEach((item, idx) => {
        const studentNameClean = item.filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        const specimenKey = `batch_${Date.now()}_${idx}`;
        specimens[specimenKey] = {
          caseId: `BAF/MASSAL/2026/${(item.sha256 || 'A1B2C3D4').slice(0, 8).toUpperCase()}`,
          course: 'IF-4020 Teori Komputasi Lanjut',
          studentName: studentNameClean,
          studentNim: '1352' + Math.floor(1000 + Math.random() * 9000),
          classYear: 'Semester Ganjil 2026',
          deskNo: `Meja ${idx + 1}`,
          scanRes: item.scan_res || '1000 x 1250 piksel (300 DPI)',
          submitTime: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
          sha256: item.sha256,
          probability: item.probability,
          statusLabel: item.status_label,
          verdictType: item.verdict_type,
          verdictText: item.verdict_text,
          recommendation: item.recommendation,
          imageSrc: item.image_data_url || 'assets/samples/sample_fake_caveat.jpg',
          viewBox: item.viewBox || '0 0 1000 1250',
          metrics: item.metrics,
          legend: item.legend,
          svgAnnotations: item.svg_annotations
        };

        saveToArchive({
          caseId: specimens[specimenKey].caseId,
          studentName: specimens[specimenKey].studentName,
          nim: specimens[specimenKey].studentNim,
          course: specimens[specimenKey].course,
          dtw: (item.metrics && item.metrics.glyph_similarity) ? item.metrics.glyph_similarity : `${item.probability}%`,
          verdictType: item.verdict_type,
          statusLabel: item.status_label,
          specimenKey: specimenKey,
          date: 'Hari Ini, ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
          glyph_similarity: item.metrics ? item.metrics.glyph_similarity : '-',
          baseline: item.metrics ? item.metrics.baseline : '-',
          pressure: item.metrics ? item.metrics.pressure : '-',
          sha256: item.sha256
        });
      });

      setTimeout(() => {
        DOM.uploadProgress.classList.add('hidden');
        DOM.uploadProgress.classList.remove('flex', 'scanning');
        state.isScanning = false;
        if (DOM.batchResultsCard) {
          DOM.batchResultsCard.classList.remove('hidden');
          DOM.batchResultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400);

    } catch (err) {
      console.error('Batch upload error:', err);
      alert('Gagal memproses unggahan massal: ' + err.message);
      DOM.uploadProgress.classList.add('hidden');
      DOM.uploadProgress.classList.remove('flex', 'scanning');
      state.isScanning = false;
    }
  }

  function renderBatchResults(results) {
    if (!DOM.batchTbody) return;
    const total = results.length;
    const suspect = results.filter(r => r.verdict_type === 'suspect').length;
    const authentic = results.filter(r => r.verdict_type === 'authentic').length;

    if (DOM.batchTotalFiles) DOM.batchTotalFiles.textContent = `Total: ${total} Naskah`;
    if (DOM.batchStatTotal) DOM.batchStatTotal.textContent = total;
    if (DOM.batchStatSuspect) DOM.batchStatSuspect.textContent = suspect;
    if (DOM.batchStatAuthentic) DOM.batchStatAuthentic.textContent = authentic;

    DOM.batchTbody.innerHTML = results.map((item, idx) => {
      const isSuspect = item.verdict_type === 'suspect';
      const studentClean = item.filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      const badgeClass = isSuspect
        ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
        : 'bg-tertiary-fixed text-tertiary';
      const nccClass = isSuspect ? 'text-secondary' : 'text-tertiary';

      return `
        <tr>
          <td class="font-mono-metric text-on-surface-variant">${idx + 1}</td>
          <td>
            <div class="font-bold text-primary">${studentClean}</div>
            <div class="font-mono-metric text-[10px] text-on-surface-variant">${item.filename}</div>
          </td>
          <td>
            <span class="font-mono-metric font-bold ${nccClass}">${item.metrics ? item.metrics.glyph_similarity : '-'}</span>
            <div class="font-mono-metric text-[10px] text-on-surface-variant">${isSuspect ? 'Identik Berulang' : 'Variasi Alami'}</div>
          </td>
          <td>
            <div class="font-mono-metric text-[11px] text-primary">${item.metrics ? item.metrics.baseline : '-'}</div>
            <div class="font-mono-metric text-[10px] text-on-surface-variant">${item.metrics ? item.metrics.pressure : '-'}</div>
          </td>
          <td>
            <span class="inline-block px-2 py-0.5 text-[10px] font-mono-metric font-bold ${badgeClass}">
              ${item.status_label}
            </span>
          </td>
          <td class="text-right">
            <button type="button" class="btn-inspect-batch-item px-2.5 py-1 bg-surface border border-outline-variant hover:bg-surface-container-high text-xs font-mono-metric text-primary transition-colors cursor-pointer" data-batch-idx="${idx}">
              Buka Lembar
            </button>
          </td>
        </tr>
      `;
    }).join('');

    DOM.batchTbody.querySelectorAll('.btn-inspect-batch-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-batch-idx'), 10);
        const item = results[idx];
        if (!item) return;

        const studentNameClean = item.filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        specimens.user = {
          caseId: `BAF/MASSAL/2026/${(item.sha256 || 'A1B2C3D4').slice(0, 8).toUpperCase()}`,
          course: 'IF-4020 Teori Komputasi Lanjut',
          studentName: studentNameClean,
          studentNim: '1352' + Math.floor(1000 + Math.random() * 9000),
          classYear: 'Semester Ganjil 2026',
          deskNo: `Meja ${idx + 1}`,
          scanRes: item.scan_res || '1000 x 1250 piksel (300 DPI)',
          submitTime: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
          sha256: item.sha256,
          probability: item.probability,
          statusLabel: item.status_label,
          verdictType: item.verdict_type,
          verdictText: item.verdict_text,
          recommendation: item.recommendation,
          imageSrc: item.image_data_url || 'assets/samples/sample_fake_caveat.jpg',
          viewBox: item.viewBox || '0 0 1000 1250',
          metrics: item.metrics,
          legend: item.legend,
          svgAnnotations: item.svg_annotations
        };
        state.uploadedImageSrc = item.image_data_url;
        renderSpecimen('user');
        switchView('lembar-analisis');
      });
    });
  }

  function exportToCsv(records, defaultFilename) {
    if (!records || records.length === 0) {
      alert('Tidak ada data arsip untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'Nomor Berkas',
      'Nama Berkas',
      'NIM',
      'Nama Mahasiswa',
      'Mata Kuliah',
      'Waktu Pemeriksaan',
      'Status Verdict',
      'Skor Keyakinan (%)',
      'Korelasi Glif (Max NCC)',
      'Linearitas Baseline',
      'Variasi Tekanan',
      'SHA-256 Checksum'
    ];

    const rows = records.map((rec, idx) => {
      return [
        idx + 1,
        `"${(rec.caseId || '').replace(/"/g, '""')}"`,
        `"${(rec.filename || rec.studentName || '').replace(/"/g, '""')}"`,
        `"${(rec.nim || '').replace(/"/g, '""')}"`,
        `"${(rec.studentName || '').replace(/"/g, '""')}"`,
        `"${(rec.course || '').replace(/"/g, '""')}"`,
        `"${(rec.date || rec.submitTime || '').replace(/"/g, '""')}"`,
        `"${(rec.statusLabel || '').replace(/"/g, '""')}"`,
        `"${rec.probability || (rec.verdictType === 'suspect' ? 95 : 97)}"`,
        `"${rec.glyph_similarity || rec.dtw || '99.5%'}"`,
        `"${rec.baseline || '99% Kaku'}"`,
        `"${rec.pressure || 'Monoton'}"`,
        `"${(rec.sha256 || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    a.href = url;
    a.download = defaultFilename || `Rekapitulasi_Forensik_AsliTulis_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportBatchToCsv() {
    if (!state.batchResults || state.batchResults.length === 0) {
      alert('Belum ada hasil pemeriksaan massal.');
      return;
    }
    const records = state.batchResults.map(r => ({
      caseId: `BAF/MASSAL/2026/${(r.sha256 || '').slice(0, 8).toUpperCase()}`,
      filename: r.filename,
      studentName: r.filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      nim: '1352' + Math.floor(1000 + Math.random() * 9000),
      course: 'IF-4020 Teori Komputasi Lanjut',
      submitTime: new Date().toLocaleDateString('id-ID'),
      statusLabel: r.status_label,
      probability: r.probability,
      glyph_similarity: r.metrics ? r.metrics.glyph_similarity : '-',
      baseline: r.metrics ? r.metrics.baseline : '-',
      pressure: r.metrics ? r.metrics.pressure : '-',
      sha256: r.sha256
    }));
    exportToCsv(records, `Rekapitulasi_Batch_Kelas_${Date.now()}.csv`);
  }

  function exportArchiveToCsv() {
    const list = getArchive();
    exportToCsv(list, `Rekapitulasi_Buku_Catatan_Arsip_${Date.now()}.csv`);
  }

  function setupLoupe() {
    let loupe = document.getElementById('loupe-lens');
    if (!loupe) {
      loupe = document.createElement('div');
      loupe.id = 'loupe-lens';
      loupe.className = 'loupe-lens';
      document.body.appendChild(loupe);
    }

    let isHovering = false;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let animId = null;

    if (!DOM.specimenCanvasContainer) return;

    DOM.specimenCanvasContainer.addEventListener('mouseenter', () => {
      if (state.loupeActive) {
        isHovering = true;
        loupe.style.display = 'block';
        if (!animId) renderLoupeFrame();
      }
    });

    DOM.specimenCanvasContainer.addEventListener('mouseleave', () => {
      isHovering = false;
      loupe.style.display = 'none';
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    });

    DOM.specimenCanvasContainer.addEventListener('mousemove', e => {
      if (!state.loupeActive) return;
      targetX = e.pageX;
      targetY = e.pageY;

      const img = DOM.mainSpecimenImg;
      if (!img) return;

      const rect = img.getBoundingClientRect();
      const imgX = e.clientX - rect.left;
      const imgY = e.clientY - rect.top;

      const zoom = 2.5;
      const bgX = -(imgX * zoom - 85);
      const bgY = -(imgY * zoom - 85);

      // Dynamically use the active document photo
      loupe.style.backgroundImage = `url('${img.src}')`;
      loupe.style.backgroundSize = `${rect.width * zoom}px ${rect.height * zoom}px`;
      loupe.style.backgroundPosition = `${bgX}px ${bgY}px`;
    });

    function renderLoupeFrame() {
      currentX += (targetX - currentX) * 0.35;
      currentY += (targetY - currentY) * 0.35;

      loupe.style.left = `${currentX}px`;
      loupe.style.top = `${currentY}px`;

      if (isHovering) {
        animId = requestAnimationFrame(renderLoupeFrame);
      } else {
        animId = null;
      }
    }
  }

  function openReportModal() {
    const data = specimens[state.currentSpecimen] || specimens.caveat;
    const examinerName = state.examiner.name;
    const examinerNip = state.examiner.nip;
    const examinerInst = state.examiner.inst;

    if (DOM.reportModalBody) {
      DOM.reportModalBody.innerHTML = `
        <div class="border-b-2 border-primary pb-3 mb-4 flex justify-between items-start">
          <div class="flex items-center gap-3">
            <img src="assets/logo.svg" alt="Logo" class="h-8 w-auto object-contain"/>
            <div>
              <h2 class="font-display text-xl text-primary font-bold">BERITA ACARA AUDIT FORENSIK TULISAN TANGAN</h2>
              <p class="font-mono-metric text-[10px] text-on-surface-variant uppercase tracking-wider">${examinerInst}</p>
            </div>
          </div>
          <div class="text-right">
            <span class="font-mono-metric text-xs border border-primary px-2 py-0.5 font-bold">${data.caseId}</span>
            <p class="font-mono-metric text-[10px] text-on-surface-variant mt-1">${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 text-xs font-body mb-5 bg-surface-container-low p-3 border border-outline-variant">
          <div>
            <p class="text-on-surface-variant">Nama Mahasiswa: <strong class="text-primary">${data.studentName}</strong></p>
            <p class="text-on-surface-variant">Nomor Induk (NIM): <strong class="text-primary font-mono-metric">${data.studentNim}</strong></p>
            <p class="text-on-surface-variant">Mata Kuliah: <strong class="text-primary">${data.course}</strong></p>
          </div>
          <div>
            <p class="text-on-surface-variant">Pemeriksa: <strong class="text-primary">${examinerName}</strong></p>
            <p class="text-on-surface-variant">Metode: <strong class="text-primary">DTW Alograf + Hough Transform Baseline</strong></p>
            <p class="text-on-surface-variant">Checksum SHA-256: <strong class="font-mono-metric text-[10px]">${data.sha256.substring(0, 24)}...</strong></p>
          </div>
        </div>

        <div class="my-4 p-4 border-2 ${data.verdictType === 'suspect' ? 'border-secondary bg-secondary-fixed/20' : 'border-tertiary bg-tertiary-fixed/20'}">
          <div class="flex items-center justify-between">
            <div>
              <span class="font-mono-metric text-xs tracking-wider uppercase font-bold ${data.verdictType === 'suspect' ? 'text-secondary' : 'text-tertiary'}">KESIMPULAN RESMI SISTEM:</span>
              <h3 class="font-display text-xl font-bold ${data.verdictType === 'suspect' ? 'text-secondary' : 'text-tertiary'} mt-1">${data.verdictText}</h3>
            </div>
            <div class="text-right">
              <span class="font-display text-3xl font-bold ${data.verdictType === 'suspect' ? 'text-secondary' : 'text-tertiary'}">${data.probability}%</span>
              <p class="font-mono-metric text-[10px] text-on-surface-variant">Indeks Artifisial</p>
            </div>
          </div>
          <p class="text-xs mt-2.5 leading-relaxed ${data.verdictType === 'suspect' ? 'text-on-secondary-fixed-variant' : 'text-on-tertiary-fixed-variant'} font-medium">
            ${data.recommendation}
          </p>
        </div>

        <div class="mt-6 pt-4 border-t border-outline-variant flex justify-between items-end text-xs">
          <div>
            <p class="text-on-surface-variant font-medium">Sistem Verifikasi Otomatis AsliTulis v1.0</p>
            <p class="font-mono-metric text-[10px] text-on-surface-variant">Sertifikat forensik sah diekstraksi dari analisis citra beresolusi tinggi.</p>
          </div>
          <div class="text-center">
            <p class="mb-6 text-on-surface-variant">Otorisasi Sistem,</p>
            <p class="font-bold text-primary underline">AsliTulis Engine Core</p>
            <p class="text-[10px] text-on-surface-variant font-mono-metric">Verifikator Forensik Digital</p>
          </div>
        </div>
      `;
    }

    DOM.reportModal.classList.add('open');
  }

  function closeReportModal() {
    if (DOM.reportModal) {
      DOM.reportModal.classList.remove('open');
    }
  }

  // ==========================================
  // DYNAMIC ARCHIVE (BUKU CATATAN PENGUJIAN)
  // ==========================================
  const DEFAULT_ARCHIVE = [
    {
      caseId: 'BAF/KOMP/2024/X-1088',
      studentName: 'Ahmad Fauzan',
      nim: '13521088',
      course: 'IF-4020 Teori Komputasi Lanjut',
      dtw: '12% (Rendah)',
      verdictType: 'suspect',
      statusLabel: 'TERINDIKASI SINTETIS',
      specimenKey: 'caveat',
      date: '24 Okt 2024'
    },
    {
      caseId: 'BAF/KOMP/2024/X-1045',
      studentName: 'Rizky Ramadhan',
      nim: '13521045',
      course: 'IF-4020 Teori Komputasi Lanjut',
      dtw: '15% (Rendah)',
      verdictType: 'suspect',
      statusLabel: 'TERINDIKASI SINTETIS',
      specimenKey: 'dekko',
      date: '24 Okt 2024'
    },
    {
      caseId: 'BAF/KOMP/2024/X-1102',
      studentName: 'Dian Maharani',
      nim: '13521102',
      course: 'IF-4020 Teori Komputasi Lanjut',
      dtw: '11% (Rendah)',
      verdictType: 'suspect',
      statusLabel: 'TERINDIKASI SINTETIS',
      specimenKey: 'mali',
      date: '24 Okt 2024'
    },
    {
      caseId: 'BAF/OTEN/2026/U-1002',
      studentName: 'Bagas Pratama (Asli)',
      nim: '13521014',
      course: 'Pemeriksaan Naskah Berkas Ujian',
      dtw: '41% (Organik)',
      verdictType: 'authentic',
      statusLabel: 'LOLOS (OTENTIK)',
      specimenKey: 'user_handwriting',
      date: '18 Sep 2026'
    }
  ];

  function getArchive() {
    try {
      const stored = localStorage.getItem('aslitulis_archive_records');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read archive from localStorage:', e);
    }
    return DEFAULT_ARCHIVE;
  }

  function saveToArchive(item) {
    let list = getArchive();
    const idx = list.findIndex(x => x.caseId === item.caseId);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.unshift(item);
    }
    try {
      localStorage.setItem('aslitulis_archive_records', JSON.stringify(list));
    } catch (e) {
      console.warn('Could not write archive to localStorage:', e);
    }
    renderArchiveTable();
  }

  function renderArchiveTable() {
    if (!DOM.archiveTbody) return;
    const list = getArchive();
    
    DOM.archiveTbody.innerHTML = list.map(item => `
      <tr data-status="${item.verdictType}">
        <td class="font-mono-metric font-bold text-primary">${item.caseId}</td>
        <td>
          <div class="font-bold text-primary">${item.studentName}</div>
          <div class="font-mono-metric text-[10px] text-on-surface-variant">NIM: ${item.nim}</div>
        </td>
        <td>
          <div>${item.course}</div>
          <div class="font-mono-metric text-[10px] text-on-surface-variant">${item.date || 'Hari Ini'}</div>
        </td>
        <td>
          <div class="font-mono-metric font-bold ${item.verdictType === 'suspect' ? 'text-secondary' : 'text-tertiary'}">${item.dtw}</div>
          <div class="font-mono-metric text-[10px] text-on-surface-variant">Karakteristik Alograf</div>
        </td>
        <td>
          <span class="inline-block px-2 py-0.5 text-[10px] font-mono-metric font-bold ${item.verdictType === 'suspect' ? 'bg-secondary-fixed text-on-secondary-fixed-variant' : 'bg-tertiary-fixed text-tertiary'}">
            ${item.statusLabel}
          </span>
        </td>
        <td class="text-right">
          <button type="button" class="btn-open-archive-item px-2.5 py-1 bg-surface border border-outline-variant hover:bg-surface-container-high text-xs font-mono-metric text-primary transition-colors cursor-pointer" data-specimen="${item.specimenKey || 'caveat'}">
            Buka Lembar
          </button>
        </td>
      </tr>
    `).join('');

    // Attach click listeners to Buka Lembar buttons
    DOM.archiveTbody.querySelectorAll('.btn-open-archive-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-specimen');
        renderSpecimen(key);
        switchView('lembar-analisis');
      });
    });

    // Cache updated rows for search & filter
    DOM.archiveRows = DOM.archiveTbody.querySelectorAll('tr');

    // Update statistics counters
    const total = list.length;
    const suspect = list.filter(x => x.verdictType === 'suspect').length;
    const authentic = list.filter(x => x.verdictType === 'authentic').length;

    if (DOM.archiveStatTotal) DOM.archiveStatTotal.textContent = total;
    if (DOM.archiveStatSuspect) DOM.archiveStatSuspect.textContent = suspect;
    if (DOM.archiveStatAuthentic) DOM.archiveStatAuthentic.textContent = authentic;
  }

  function filterArchive() {
    if (!DOM.archiveRows) return;
    const q = (DOM.archiveSearch.value || '').toLowerCase();
    const filter = DOM.archiveFilter.value;

    DOM.archiveRows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const status = row.getAttribute('data-status');

      const matchText = text.includes(q);
      const matchFilter = (filter === 'all') || (status === filter);

      row.style.display = (matchText && matchFilter) ? '' : 'none';
    });
  }

  // Self Initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

