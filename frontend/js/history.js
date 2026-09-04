/**
 * VoiceShield - Forensic Audit Ledger Controller
 * Handles historical scan pagination, searching, threat filtering, and batch exports.
 * Relies on: js/config.js, js/utils.js, js/api.js, js/auth.js
 */

const History = {
  rawRecords: [],
  filteredRecords: [],
  currentPage: 1,
  pageSize: 8,

  // DOM Elements cache
  elements: {
    totalRecordsCount: null,
    criticalClonesCount: null,
    authenticCount: null,
    biometricCount: null,
    searchFilterInput: null,
    riskLevelSelect: null,
    timeSortSelect: null,
    btnClearFilters: null,
    historyTableBody: null,
    paginationInfo: null,
    currentPageDisplay: null,
    btnPrevPage: null,
    btnNextPage: null,
    btnExportAllCsv: null,
    btnExportAllJson: null,
    logoutBtn: null
  },

  /**
   * Initializes the audit ledger workspace.
   */
  async init() {
    this.cacheElements();
    this.bindEvents();
    await this.loadRecords();
  },

  /**
   * Cache DOM nodes.
   */
  cacheElements() {
    this.elements.totalRecordsCount = document.getElementById('totalRecordsCount');
    this.elements.criticalClonesCount = document.getElementById('criticalClonesCount');
    this.elements.authenticCount = document.getElementById('authenticCount');
    this.elements.biometricCount = document.getElementById('biometricCount');
    this.elements.searchFilterInput = document.getElementById('searchFilterInput');
    this.elements.riskLevelSelect = document.getElementById('riskLevelSelect');
    this.elements.timeSortSelect = document.getElementById('timeSortSelect');
    this.elements.btnClearFilters = document.getElementById('btnClearFilters');
    this.elements.historyTableBody = document.getElementById('historyTableBody');
    this.elements.paginationInfo = document.getElementById('paginationInfo');
    this.elements.currentPageDisplay = document.getElementById('currentPageDisplay');
    this.elements.btnPrevPage = document.getElementById('btnPrevPage');
    this.elements.btnNextPage = document.getElementById('btnNextPage');
    this.elements.btnExportAllCsv = document.getElementById('btnExportAllCsv');
    this.elements.btnExportAllJson = document.getElementById('btnExportAllJson');
    this.elements.logoutBtn = document.getElementById('logoutBtn');
  },

  /**
   * Bind event listeners.
   */
  bindEvents() {
    const { 
      searchFilterInput, 
      riskLevelSelect, 
      timeSortSelect, 
      btnClearFilters, 
      btnPrevPage, 
      btnNextPage, 
      btnExportAllCsv, 
      btnExportAllJson, 
      logoutBtn 
    } = this.elements;

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (typeof Auth !== 'undefined' && typeof Auth.logout === 'function') {
          Auth.logout();
        }
      });
    }

    if (searchFilterInput) {
      searchFilterInput.addEventListener('input', () => this.applyFilters());
    }

    if (riskLevelSelect) {
      riskLevelSelect.addEventListener('change', () => this.applyFilters());
    }

    if (timeSortSelect) {
      timeSortSelect.addEventListener('change', () => this.applyFilters());
    }

    if (btnClearFilters) {
      btnClearFilters.addEventListener('click', () => this.resetFilters());
    }

    if (btnPrevPage) {
      btnPrevPage.addEventListener('click', () => this.prevPage());
    }

    if (btnNextPage) {
      btnNextPage.addEventListener('click', () => this.nextPage());
    }

    if (btnExportAllCsv) {
      btnExportAllCsv.addEventListener('click', () => this.exportCsv());
    }

    if (btnExportAllJson) {
      btnExportAllJson.addEventListener('click', () => this.exportJson());
    }
  },

  /**
   * Fetches full audit history from backend or falls back to simulated database.
   */
  async loadRecords() {
    try {
      if (typeof API !== 'undefined' && typeof API.getHistory === 'function') {
        const res = await API.getHistory();
        this.rawRecords = res.data || [];
      } else {
        this.rawRecords = this.getMockHistoryDataset();
      }
    } catch (err) {
      console.warn('[VoiceShield History] API unreachable. Falling back to local audit cache.', err);
      this.rawRecords = this.getMockHistoryDataset();
    }

    this.updateHeadlineStats();
    this.applyFilters();
  },

  /**
   * Computes top statistics metrics ribbon.
   */
  updateHeadlineStats() {
    const total = this.rawRecords.length;
    const critical = this.rawRecords.filter(r => (r.deepfake_prob || 0) > 0.7).length;
    const authentic = this.rawRecords.filter(r => (r.deepfake_prob || 0) < 0.4).length;
    const biometrics = this.rawRecords.filter(r => r.speaker_profile_name && r.speaker_match !== null).length;

    if (this.elements.totalRecordsCount) this.elements.totalRecordsCount.textContent = total.toLocaleString();
    if (this.elements.criticalClonesCount) this.elements.criticalClonesCount.textContent = critical.toLocaleString();
    if (this.elements.authenticCount) this.elements.authenticCount.textContent = authentic.toLocaleString();
    if (this.elements.biometricCount) this.elements.biometricCount.textContent = biometrics.toLocaleString();
  },

  /**
   * Applies search, category filter, and sorting.
   */
  applyFilters() {
    const query = (this.elements.searchFilterInput?.value || '').trim().toLowerCase();
    const riskFilter = this.elements.riskLevelSelect?.value || 'ALL';
    const sortMode = this.elements.timeSortSelect?.value || 'NEWEST';

    this.filteredRecords = this.rawRecords.filter(item => {
      // Query filter
      const matchesSearch = !query || 
        (item.id && item.id.toLowerCase().includes(query)) ||
        (item.filename && item.filename.toLowerCase().includes(query)) ||
        (item.speaker_profile_name && item.speaker_profile_name.toLowerCase().includes(query));

      // Risk filter
      let matchesRisk = true;
      const prob = item.deepfake_prob || 0;
      if (riskFilter === 'CRITICAL') matchesRisk = prob > 0.7;
      else if (riskFilter === 'MEDIUM') matchesRisk = prob >= 0.4 && prob <= 0.7;
      else if (riskFilter === 'LOW') matchesRisk = prob < 0.4;

      return matchesSearch && matchesRisk;
    });

    // Sorting
    this.filteredRecords.sort((a, b) => {
      if (sortMode === 'NEWEST') return new Date(b.timestamp) - new Date(a.timestamp);
      if (sortMode === 'OLDEST') return new Date(a.timestamp) - new Date(b.timestamp);
      if (sortMode === 'RISK_HIGH') return (b.deepfake_prob || 0) - (a.deepfake_prob || 0);
      return 0;
    });

    this.currentPage = 1;
    this.renderPage();
  },

  /**
   * Resets all search and filter dropdowns.
   */
  resetFilters() {
    if (this.elements.searchFilterInput) this.elements.searchFilterInput.value = '';
    if (this.elements.riskLevelSelect) this.elements.riskLevelSelect.value = 'ALL';
    if (this.elements.timeSortSelect) this.elements.timeSortSelect.value = 'NEWEST';
    this.applyFilters();
  },

  /**
   * Renders the current slice of records for pagination.
   */
  renderPage() {
    const tbody = this.elements.historyTableBody;
    if (!tbody) return;

    const total = this.filteredRecords.length;
    const totalPages = Math.ceil(total / this.pageSize) || 1;

    if (total === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-secondary py-5 font-mono">
            <i class="fa-solid fa-folder-open mb-2 fs-3 d-block text-muted"></i>
            No forensic records matched your query or filter parameters.
          </td>
        </tr>
      `;
      this.updatePaginationState(0, 0, 0, 1, 1);
      return;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, total);
    const visibleRecords = this.filteredRecords.slice(startIndex, endIndex);

    tbody.innerHTML = visibleRecords.map(record => {
      const isDanger = (record.deepfake_prob || 0) > 0.7;
      const isWarn = (record.deepfake_prob || 0) >= 0.4 && (record.deepfake_prob || 0) <= 0.7;

      const badgeHtml = isDanger
        ? `<span class="threat-pill critical"><i class="fa-solid fa-triangle-exclamation"></i> CRITICAL CLONE</span>`
        : isWarn
          ? `<span class="threat-pill suspicious"><i class="fa-solid fa-triangle-exclamation"></i> PHASE ANOMALY</span>`
          : `<span class="threat-pill authentic"><i class="fa-solid fa-circle-check"></i> AUTHENTIC</span>`;

      const probClass = isDanger ? 'text-danger fw-bold' : isWarn ? 'text-warning fw-bold' : 'text-success';
      const probText = `${((record.deepfake_prob || 0) * 100).toFixed(1)}%`;

      const speakerText = record.speaker_match !== null && record.speaker_match !== undefined
        ? `<span class="text-info">${record.speaker_profile_name || 'Enrolled Profile'} (${(record.speaker_match * 100).toFixed(1)}%)</span>`
        : `<span class="text-muted">Unenrolled Target</span>`;

      const formattedTime = this.formatTimestamp(record.timestamp);

      return `
        <tr>
          <td>
            <span class="badge bg-secondary bg-opacity-25 font-mono text-cyan">${record.id}</span>
          </td>
          <td>
            <div class="d-flex align-items-center">
              <i class="fa-solid fa-file-audio ${isDanger ? 'text-danger' : isWarn ? 'text-warning' : 'text-success'} me-2"></i>
              <span class="text-white text-truncate" style="max-width: 220px;" title="${record.filename}">${record.filename}</span>
            </div>
          </td>
          <td>${badgeHtml}</td>
          <td class="${probClass}">${probText}</td>
          <td>${speakerText}</td>
          <td class="text-secondary">${formattedTime}</td>
          <td class="text-end">
            <div class="d-inline-flex gap-1">
              <a href="result.html?id=${record.id}" class="btn btn-sm btn-outline-secondary py-0 px-2 small font-mono text-cyan" title="Open Forensic Spectrogram">
                <i class="fa-solid fa-chart-simple"></i>
              </a>
              <button class="btn btn-sm btn-outline-secondary py-0 px-2 small font-mono" onclick="History.downloadSingleJson('${record.id}')" title="Export JSON">
                <i class="fa-solid fa-download"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    this.updatePaginationState(startIndex + 1, endIndex, total, this.currentPage, totalPages);
  },

  /**
   * Updates pagination buttons and indicators.
   */
  updatePaginationState(start, end, total, page, totalPages) {
    if (this.elements.paginationInfo) {
      this.elements.paginationInfo.textContent = `Showing records ${start} to ${end} of ${total}`;
    }
    if (this.elements.currentPageDisplay) {
      this.elements.currentPageDisplay.textContent = `Page ${page} of ${totalPages}`;
    }
    if (this.elements.btnPrevPage) {
      this.elements.btnPrevPage.disabled = page <= 1;
    }
    if (this.elements.btnNextPage) {
      this.elements.btnNextPage.disabled = page >= totalPages;
    }
  },

  nextPage() {
    const totalPages = Math.ceil(this.filteredRecords.length / this.pageSize);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.renderPage();
    }
  },

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.renderPage();
    }
  },

  /**
   * Formats ISO strings to concise UTC displays.
   */
  formatTimestamp(iso) {
    if (!iso) return 'Recent';
    try {
      const d = new Date(iso);
      return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    } catch {
      return iso;
    }
  },

  /**
   * Trigger single record JSON download.
   */
  downloadSingleJson(id) {
    const target = this.rawRecords.find(r => r.id === id);
    if (!target) return;
    const blob = new Blob([JSON.stringify(target, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VoiceShield_${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Trigger CSV download of currently filtered dataset.
   */
  exportCsv() {
    if (!this.filteredRecords.length) return alert('No data to export.');

    const headers = ['Scan_ID', 'Filename', 'Risk_Level', 'AI_Probability', 'Speaker_Profile', 'Speaker_Match', 'Timestamp'];
    const rows = this.filteredRecords.map(r => [
      r.id,
      `"${r.filename}"`,
      r.risk_level || (r.deepfake_prob > 0.7 ? 'CRITICAL' : 'LOW'),
      (r.deepfake_prob * 100).toFixed(1) + '%',
      `"${r.speaker_profile_name || 'N/A'}"`,
      r.speaker_match !== null ? (r.speaker_match * 100).toFixed(1) + '%' : 'N/A',
      `"${r.timestamp}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VoiceShield_Audit_Ledger_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Trigger complete JSON dataset download.
   */
  exportJson() {
    if (!this.filteredRecords.length) return alert('No data to export.');
    const blob = new Blob([JSON.stringify(this.filteredRecords, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VoiceShield_Audit_Ledger_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Mock audit dataset for standalone client usage.
   */
  getMockHistoryDataset() {
    return [
      {
        id: 'SCN-9021',
        filename: 'executive_wire_instruction.wav',
        sample_rate: '16.0 kHz Mono',
        risk_level: 'CRITICAL',
        deepfake_prob: 0.984,
        speaker_profile_name: 'Satya Nadella',
        speaker_match: 0.382,
        timestamp: '2026-09-04T10:14:02Z'
      },
      {
        id: 'SCN-9020',
        filename: 'support_desk_auth_call_902.mp3',
        sample_rate: '44.1 kHz Mono',
        risk_level: 'LOW',
        deepfake_prob: 0.021,
        speaker_profile_name: 'Tim Cook',
        speaker_match: 0.954,
        timestamp: '2026-09-04T09:58:30Z'
      },
      {
        id: 'SCN-9019',
        filename: 'telephony_voip_sample_12.wav',
        sample_rate: '16.0 kHz Mono',
        risk_level: 'MEDIUM',
        deepfake_prob: 0.648,
        speaker_profile_name: null,
        speaker_match: null,
        timestamp: '2026-09-04T09:12:15Z'
      },
      {
        id: 'SCN-9018',
        filename: 'press_briefing_audio_fragment.flac',
        sample_rate: '48.0 kHz Stereo',
        risk_level: 'CRITICAL',
        deepfake_prob: 0.941,
        speaker_profile_name: 'Sam Altman',
        speaker_match: 0.412,
        timestamp: '2026-09-04T08:45:00Z'
      },
      {
        id: 'SCN-9017',
        filename: 'quarterly_earnings_qa_clip.m4a',
        sample_rate: '44.1 kHz Mono',
        risk_level: 'LOW',
        deepfake_prob: 0.048,
        speaker_profile_name: null,
        speaker_match: null,
        timestamp: '2026-09-04T07:22:11Z'
      },
      {
        id: 'SCN-9016',
        filename: 'board_call_telecom_intercept.wav',
        sample_rate: '16.0 kHz Mono',
        risk_level: 'CRITICAL',
        deepfake_prob: 0.892,
        speaker_profile_name: 'Satya Nadella',
        speaker_match: 0.294,
        timestamp: '2026-09-03T23:14:40Z'
      },
      {
        id: 'SCN-9015',
        filename: 'callcenter_tier3_dispute.wav',
        sample_rate: '16.0 kHz Mono',
        risk_level: 'LOW',
        deepfake_prob: 0.012,
        speaker_profile_name: null,
        speaker_match: null,
        timestamp: '2026-09-03T21:05:18Z'
      },
      {
        id: 'SCN-9014',
        filename: 'podcasts_ai_generated_snippet.mp3',
        sample_rate: '44.1 kHz Stereo',
        risk_level: 'CRITICAL',
        deepfake_prob: 0.992,
        speaker_profile_name: 'Tim Cook',
        speaker_match: 0.210,
        timestamp: '2026-09-03T18:44:09Z'
      },
      {
        id: 'SCN-9013',
        filename: 'internal_allhands_q1_audio.flac',
        sample_rate: '48.0 kHz Mono',
        risk_level: 'LOW',
        deepfake_prob: 0.035,
        speaker_profile_name: null,
        speaker_match: null,
        timestamp: '2026-09-03T15:30:22Z'
      }
    ];
  }
};

// Bootstrap when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  History.init();
});