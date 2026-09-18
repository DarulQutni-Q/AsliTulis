/**
 * AsliTulis — Forensic Examination Console
 * Client-Side Controller & High-Performance Interactions
 * 
 * Features:
 * - Zero-collision SVG hairline forensic annotations with corner pins
 * - Floating non-colliding cursor tooltip
 * - Real photographic document rendering (high-res synthetic & user upload)
 * - Above-the-fold immediate visibility (zero unwanted scroll)
 * - Guest mode by default with customizable examiner identity modal
 * - Interactive 2.5x Forensic Loupe with real image pixel magnification
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
    uploadedImageSrc: null,
    uploadedFileMeta: null,
    isScanning: false,
    selectedPair: null,
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
        entropy: '12% (Rendah)',
        pressure: 'Monoton',
        baseline: '99.4% Kaku',
        slant: '± 0.4° Tetap',
        penlifts: 'Absen'
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
        entropy: '8% (Sangat Rendah)',
        pressure: 'Monoton Linier',
        baseline: '99.8% Kaku',
        slant: '± 0.2° Tetap',
        penlifts: 'Absen Sempurna'
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
        entropy: '11% (Sangat Rendah)',
        pressure: 'Monoton Mekanis',
        baseline: '99.6% Kaku',
        slant: '± 0.3° Tetap',
        penlifts: 'Absen (Plotter G-Code)'
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
    }
  };

  // Cached DOM Elements
  const DOM = {};

  function init() {
    cacheDOM();
    bindEvents();
    renderSpecimen('caveat');
    setupLoupe();
    updateExaminerBadge();
  }

  function cacheDOM() {
    // Navigation
    DOM.navLinks = document.querySelectorAll('.nav-link');
    DOM.views = {
      'pemeriksaan-berkas': document.getElementById('view-pemeriksaan-berkas'),
      'lembar-analisis': document.getElementById('view-lembar-analisis'),
      'arsip-pengujian': document.getElementById('view-arsip-pengujian')
    };

    // Examiner Profile
    DOM.btnOpenExaminerModal = document.getElementById('btn-open-examiner-modal');
    DOM.examinerModal = document.getElementById('examiner-modal');
    DOM.btnCloseExaminerModal = document.getElementById('btn-close-examiner-modal');
    DOM.formExaminer = document.getElementById('form-examiner');
    DOM.inputExaminerName = document.getElementById('input-examiner-name');
    DOM.inputExaminerNip = document.getElementById('input-examiner-nip');
    DOM.inputExaminerInst = document.getElementById('input-examiner-inst');
    DOM.btnResetGuest = document.getElementById('btn-reset-guest');
    DOM.headerExaminerName = document.getElementById('header-examiner-name');
    DOM.headerExaminerRole = document.getElementById('header-examiner-role');

    // Upload & Scanning (View 1)
    DOM.dropZone = document.getElementById('drop-zone');
    DOM.fileInput = document.getElementById('file-input');
    DOM.btnDemo = document.getElementById('btn-demo');
    DOM.uploadProgress = document.getElementById('upload-progress');
    DOM.progressBarFill = document.getElementById('progress-bar-fill');
    DOM.progressPhase = document.getElementById('progress-phase');
    DOM.specimenCard = document.getElementById('specimen-card');
    DOM.specimenThumb = document.getElementById('specimen-thumb');
    DOM.specimenFileName = document.getElementById('specimen-file-name');
    DOM.specimenFileSize = document.getElementById('specimen-file-size');
    DOM.btnRunFullAnalysis = document.getElementById('btn-run-full-analysis');
    DOM.btnCancelSpecimen = document.getElementById('btn-cancel-specimen');

    // Inspection Desk (View 2)
    DOM.btnToggleRuler = document.getElementById('btn-toggle-ruler');
    DOM.labelToggleRuler = document.getElementById('label-toggle-ruler');
    DOM.btnToggleAnnotations = document.getElementById('btn-toggle-annotations');
    DOM.labelToggleAnnotations = document.getElementById('label-toggle-annotations');
    DOM.btnToggleLoupe = document.getElementById('btn-toggle-loupe');
    DOM.labelToggleLoupe = document.getElementById('label-toggle-loupe');
    DOM.btnSwitchCase = document.getElementById('btn-switch-case');
    DOM.labelSwitchCase = document.getElementById('label-switch-case');

    DOM.specimenCanvasContainer = document.getElementById('specimen-canvas-container');
    DOM.specimenFrame = document.getElementById('specimen-frame');
    DOM.mainSpecimenImg = document.getElementById('main-specimen-img');
    DOM.rulerGridOverlay = document.getElementById('ruler-grid-overlay');
    DOM.forensicSvgOverlay = document.getElementById('forensic-svg-overlay');
    DOM.floatingTooltip = document.getElementById('floating-tooltip');

    // Quick Specimen buttons
    DOM.specimenChoiceBtns = document.querySelectorAll('.btn-specimen-choice');

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
    DOM.archiveSearch = document.getElementById('archive-search');
    DOM.archiveFilter = document.getElementById('archive-filter');
    DOM.archiveRows = document.querySelectorAll('.archive-row');
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
          renderSpecimen('mali');
        } else if (caseType === 'synthetic') {
          renderSpecimen('caveat');
        }
        switchView(view);
      }
    });

    // Examiner Modal Open / Close / Submit
    if (DOM.btnOpenExaminerModal) {
      DOM.btnOpenExaminerModal.addEventListener('click', () => {
        DOM.examinerModal.classList.add('open');
      });
    }

    if (DOM.btnCloseExaminerModal) {
      DOM.btnCloseExaminerModal.addEventListener('click', () => {
        DOM.examinerModal.classList.remove('open');
      });
    }

    if (DOM.examinerModal) {
      DOM.examinerModal.addEventListener('click', e => {
        if (e.target === DOM.examinerModal) DOM.examinerModal.classList.remove('open');
      });
    }

    if (DOM.formExaminer) {
      DOM.formExaminer.addEventListener('submit', e => {
        e.preventDefault();
        const nameVal = (DOM.inputExaminerName.value || '').trim();
        const nipVal = (DOM.inputExaminerNip.value || '').trim();
        const instVal = (DOM.inputExaminerInst.value || '').trim();

        if (nameVal) {
          state.examiner.name = nameVal;
          state.examiner.nip = nipVal || '-';
          state.examiner.inst = instVal || 'Laboratorium Forensik Akademik';
          state.examiner.isGuest = false;
        }
        updateExaminerBadge();
        DOM.examinerModal.classList.remove('open');
      });
    }

    if (DOM.btnResetGuest) {
      DOM.btnResetGuest.addEventListener('click', () => {
        state.examiner.name = 'Mode Tamu / Lab Mandiri';
        state.examiner.nip = 'REG-2024-LAB04';
        state.examiner.inst = 'Laboratorium Forensik Akademik';
        state.examiner.isGuest = true;
        DOM.inputExaminerName.value = 'Tim Evaluator Mandiri';
        DOM.inputExaminerNip.value = 'REG-2024-LAB04';
        DOM.inputExaminerInst.value = 'Laboratorium Forensik Akademik';
        updateExaminerBadge();
        DOM.examinerModal.classList.remove('open');
      });
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
          handleUploadedFile(files[0]);
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
          handleUploadedFile(e.target.files[0]);
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
      });
    }

    if (DOM.btnToggleLoupe) {
      DOM.btnToggleLoupe.addEventListener('click', () => {
        state.loupeActive = !state.loupeActive;
        const loupe = document.getElementById('loupe-lens');
        if (state.loupeActive) {
          DOM.specimenCanvasContainer.classList.add('loupe-mode');
          DOM.btnToggleLoupe.classList.add('bg-primary-container', 'text-white');
          DOM.labelToggleLoupe.textContent = 'Kaca Pembesar: Aktif';
        } else {
          DOM.specimenCanvasContainer.classList.remove('loupe-mode');
          DOM.btnToggleLoupe.classList.remove('bg-primary-container', 'text-white');
          DOM.labelToggleLoupe.textContent = 'Kaca Pembesar (2.5x)';
          if (loupe) loupe.style.display = 'none';
        }
      });
    }

    if (DOM.btnSwitchCase) {
      DOM.btnSwitchCase.addEventListener('click', () => {
        const nextChoice = state.currentCase === 'synthetic' ? 'mali' : 'caveat';
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
        window.print();
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

    // Archive Search & Filter
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

    if (elCaseId) elCaseId.textContent = data.caseId;
    if (elCourse) elCourse.textContent = data.course;
    if (elStatusBadge) {
      elStatusBadge.textContent = data.statusLabel;
      elStatusBadge.className = data.verdictType === 'suspect'
        ? 'font-mono-metric text-[11px] px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed-variant font-bold'
        : 'font-mono-metric text-[11px] px-2 py-0.5 bg-tertiary-fixed text-tertiary font-bold';
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
      elVerdictPill.textContent = data.verdictType === 'suspect' ? 'TERINDIKASI FONT' : 'LOLOS (OTENTIK)';
      elVerdictPill.className = data.verdictType === 'suspect'
        ? 'font-mono-metric text-[10px] px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed-variant font-bold border border-secondary/30'
        : 'font-mono-metric text-[10px] px-2 py-0.5 bg-tertiary-fixed text-tertiary font-bold border border-tertiary/30';
    }

    // Update Switch Case Button
    if (DOM.labelSwitchCase) {
      DOM.labelSwitchCase.textContent = data.verdictType === 'suspect'
        ? 'Uji Sampel Otentik (Bagas Pratama)'
        : 'Uji Sampel Plotter (Ahmad Fauzan)';
    }

    // Update Probability & Verdict Card
    const elProbText = document.getElementById('prob-number');
    const elProbBar = document.getElementById('prob-bar');
    const elProbRec = document.getElementById('prob-recommendation');
    const elRiskBadge = document.getElementById('risk-badge');

    if (elProbText) elProbText.textContent = `${data.probability}%`;
    if (elProbBar) {
      elProbBar.setAttribute('data-target-width', `${data.probability}%`);
      elProbBar.style.backgroundColor = data.verdictType === 'suspect' ? 'var(--secondary)' : 'var(--tertiary-container)';
    }
    if (elProbRec) {
      elProbRec.textContent = data.recommendation;
      elProbRec.style.color = data.verdictType === 'suspect' ? 'var(--secondary)' : 'var(--tertiary)';
    }
    if (elRiskBadge) {
      elRiskBadge.textContent = data.statusLabel;
      elRiskBadge.className = data.verdictType === 'suspect'
        ? 'px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed-variant font-mono-metric text-xs font-bold'
        : 'px-2 py-0.5 bg-tertiary-fixed text-tertiary font-mono-metric text-xs font-bold';
    }

    // Update Metric Values
    const m = data.metrics;
    const elEntropy = document.getElementById('val-entropy');
    const elPressure = document.getElementById('val-pressure');
    const elBaseline = document.getElementById('val-baseline');
    const elSlant = document.getElementById('val-slant');
    const elPenlifts = document.getElementById('val-penlifts');

    if (elEntropy) {
      elEntropy.textContent = m.entropy;
      elEntropy.className = `font-mono-metric text-xs font-bold shrink-0 ${data.verdictType === 'suspect' ? 'text-secondary' : 'text-tertiary'}`;
    }
    if (elPressure) {
      elPressure.textContent = m.pressure;
      elPressure.className = `font-mono-metric text-xs font-bold shrink-0 ${data.verdictType === 'suspect' ? 'text-secondary' : 'text-tertiary'}`;
    }
    if (elBaseline) {
      elBaseline.textContent = m.baseline;
      elBaseline.className = `font-mono-metric text-xs font-bold shrink-0 ${data.verdictType === 'suspect' ? 'text-secondary' : 'text-tertiary'}`;
    }
    if (elSlant) elSlant.textContent = m.slant;
    if (elPenlifts) {
      elPenlifts.textContent = m.penlifts;
      elPenlifts.className = `font-mono-metric text-xs font-bold shrink-0 ${data.verdictType === 'suspect' ? 'text-secondary' : 'text-tertiary'}`;
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

    try {
      const resp = await fetch('assets/samples/sample_fake_caveat.jpg');
      const blob = await resp.blob();
      const demoFile = new File([blob], demoName, { type: 'image/jpeg' });
      await triggerRealScanSequence(demoFile);
    } catch (err) {
      console.warn('Demo fallback:', err);
      renderSpecimen('caveat');
      switchView('lembar-analisis');
    }
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
            <p class="text-on-surface-variant">Sistem Verifikasi Otomatis AsliTulis v1.0</p>
            <p class="font-mono-metric text-[10px] text-on-surface-variant">Sertifikat forensik sah yang diekstraksi dari citra beresolusi tinggi.</p>
          </div>
          <div class="text-center">
            <p class="mb-7 text-on-surface-variant">Petugas Pemeriksa,</p>
            <p class="font-bold text-primary underline">${examinerName}</p>
            <p class="text-[10px] text-on-surface-variant font-mono-metric">NIP / ID: ${examinerNip}</p>
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

  function filterArchive() {
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
