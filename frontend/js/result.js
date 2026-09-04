/**
 * VoiceShield - Forensic Telemetry Result Controller
 * Renders Mel-Spectrogram canvas, audio playback timeline, artifact logs, and metrics.
 * Relies on: js/config.js, js/utils.js, js/api.js, js/auth.js
 */

const Result = {
  scanId: null,
  payload: null,
  audio: null,
  isPlaying: false,

  // DOM Elements cache
  elements: {
    reportIdBadge: null,
    verdictCard: null,
    verdictTitle: null,
    verdictSummary: null,
    verdictPulse: null,
    aiProbabilityValue: null,
    speakerMatchValue: null,
    confidenceValue: null,
    metaFileName: null,
    metaSampling: null,
    metaDuration: null,
    metaSpeakerName: null,
    btnPlayAudio: null,
    playIcon: null,
    audioCurrentTime: null,
    audioTotalDuration: null,
    audioTimelineSlider: null,
    playbackElement: null,
    spectrogramCanvas: null,
    temporalTableBody: null,
    vecVocoder: null,
    barVocoder: null,
    vecPhase: null,
    barPhase: null,
    vecSpeaker: null,
    barSpeaker: null,
    auditorNote: null,
    btnExportJson: null,
    btnPrintPdf: null,
    logoutBtn: null
  },

  /**
   * Initializes the Result viewer.
   */
  async init() {
    this.cacheElements();
    this.bindEvents();

    const urlParams = new URLSearchParams(window.location.search);
    this.scanId = urlParams.get('id') || 'sim_01';

    if (this.elements.reportIdBadge) {
      this.elements.reportIdBadge.textContent = `SCAN_ID: ${this.scanId}`;
    }

    await this.fetchAndRenderData();
  },

  /**
   * Cache DOM nodes.
   */
  cacheElements() {
    this.elements.reportIdBadge = document.getElementById('reportIdBadge');
    this.elements.verdictCard = document.getElementById('verdictCard');
    this.elements.verdictTitle = document.getElementById('verdictTitle');
    this.elements.verdictSummary = document.getElementById('verdictSummary');
    this.elements.verdictPulse = document.getElementById('verdictPulse');
    this.elements.aiProbabilityValue = document.getElementById('aiProbabilityValue');
    this.elements.speakerMatchValue = document.getElementById('speakerMatchValue');
    this.elements.confidenceValue = document.getElementById('confidenceValue');
    this.elements.metaFileName = document.getElementById('metaFileName');
    this.elements.metaSampling = document.getElementById('metaSampling');
    this.elements.metaDuration = document.getElementById('metaDuration');
    this.elements.metaSpeakerName = document.getElementById('metaSpeakerName');
    this.elements.btnPlayAudio = document.getElementById('btnPlayAudio');
    this.elements.playIcon = document.getElementById('playIcon');
    this.elements.audioCurrentTime = document.getElementById('audioCurrentTime');
    this.elements.audioTotalDuration = document.getElementById('audioTotalDuration');
    this.elements.audioTimelineSlider = document.getElementById('audioTimelineSlider');
    this.elements.playbackElement = document.getElementById('playbackElement');
    this.elements.spectrogramCanvas = document.getElementById('spectrogramCanvas');
    this.elements.temporalTableBody = document.getElementById('temporalTableBody');
    this.elements.vecVocoder = document.getElementById('vecVocoder');
    this.elements.barVocoder = document.getElementById('barVocoder');
    this.elements.vecPhase = document.getElementById('vecPhase');
    this.elements.barPhase = document.getElementById('barPhase');
    this.elements.vecSpeaker = document.getElementById('vecSpeaker');
    this.elements.barSpeaker = document.getElementById('barSpeaker');
    this.elements.auditorNote = document.getElementById('auditorNote');
    this.elements.btnExportJson = document.getElementById('btnExportJson');
    this.elements.btnPrintPdf = document.getElementById('btnPrintPdf');
    this.elements.logoutBtn = document.getElementById('logoutBtn');
  },

  /**
   * Bind event listeners.
   */
  bindEvents() {
    const { logoutBtn, btnPlayAudio, audioTimelineSlider, btnExportJson, btnPrintPdf } = this.elements;

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (typeof Auth !== 'undefined' && typeof Auth.logout === 'function') {
          Auth.logout();
        }
      });
    }

    if (btnPlayAudio) {
      btnPlayAudio.addEventListener('click', () => this.toggleAudioPlayback());
    }

    if (audioTimelineSlider) {
      audioTimelineSlider.addEventListener('input', (e) => {
        const audio = this.elements.playbackElement;
        if (audio && audio.duration) {
          audio.currentTime = (e.target.value / 100) * audio.duration;
        }
      });
    }

    if (btnExportJson) {
      btnExportJson.addEventListener('click', () => this.exportJson());
    }

    if (btnPrintPdf) {
      btnPrintPdf.addEventListener('click', () => window.print());
    }

    window.addEventListener('resize', () => {
      if (this.payload) {
        this.renderSpectrogram(this.payload.temporal_slices);
      }
    });
  },

  /**
   * Retrieves data from backend or yields simulation payload.
   */
  async fetchAndRenderData() {
    try {
      if (typeof API !== 'undefined' && typeof API.getAnalysisResult === 'function') {
        const res = await API.getAnalysisResult(this.scanId);
        this.payload = res.data;
      } else {
        this.payload = this.getMockTelemetryData(this.scanId);
      }
    } catch (err) {
      console.warn('[VoiceShield Result] Backend response failed. Loading mock dossier.', err);
      this.payload = this.getMockTelemetryData(this.scanId);
    }

    this.renderVerdict(this.payload);
    this.renderMeta(this.payload);
    this.renderVectors(this.payload);
    this.renderTemporalTable(this.payload.temporal_slices);
    this.renderSpectrogram(this.payload.temporal_slices);
    this.setupAudioPlayer(this.payload.audio_url);
  },

  /**
   * Render Verdict Card and Main Scores.
   * @param {Object} data
   */
  renderVerdict(data) {
    const { verdictTitle, verdictSummary, verdictPulse, aiProbabilityValue, speakerMatchValue, confidenceValue } = this.elements;
    const isCritical = data.deepfake_prob > 0.7;
    const isMedium = data.deepfake_prob >= 0.4 && data.deepfake_prob <= 0.7;

    if (isCritical) {
      verdictTitle.textContent = 'CRITICAL SYNTHETIC CLONE';
      verdictTitle.className = 'verdict-display-title text-danger mb-2';
      verdictSummary.textContent = 'High-frequency acoustic vocoder signatures detected. Pronounced phase anomalies identify synthetic speech reconstruction.';
      verdictPulse.className = 'pulse-indicator';
    } else if (isMedium) {
      verdictTitle.textContent = 'SUSPICIOUS PHASE ANOMALY';
      verdictTitle.className = 'verdict-display-title text-warning mb-2';
      verdictSummary.textContent = 'Inconclusive spectral continuity. Algorithmic artifacting isolated in isolated temporal slices.';
      verdictPulse.className = 'pulse-indicator warning';
    } else {
      verdictTitle.textContent = 'AUTHENTIC HUMAN SPEECH';
      verdictTitle.className = 'verdict-display-title text-success mb-2';
      verdictSummary.textContent = 'Harmonic distribution, breath transient jitter, and formants align strictly with organic physiological speech patterns.';
      verdictPulse.className = 'pulse-indicator authentic';
    }

    aiProbabilityValue.textContent = `${(data.deepfake_prob * 100).toFixed(1)}%`;
    speakerMatchValue.textContent = data.speaker_match !== null ? `${(data.speaker_match * 100).toFixed(1)}%` : 'N/A';
    confidenceValue.textContent = `${(data.model_confidence * 100).toFixed(1)}%`;
  },

  /**
   * Render audio properties.
   * @param {Object} data
   */
  renderMeta(data) {
    const { metaFileName, metaSampling, metaDuration, metaSpeakerName } = this.elements;
    if (metaFileName) metaFileName.textContent = data.filename || 'intercept.wav';
    if (metaSampling) metaSampling.textContent = data.sample_rate || '16.0 kHz Mono';
    if (metaDuration) metaDuration.textContent = `${data.duration_seconds || 10.4}s`;
    if (metaSpeakerName) metaSpeakerName.textContent = data.speaker_profile_name || 'None (General Scan)';
  },

  /**
   * Render vector classification bars and notes.
   * @param {Object} data
   */
  renderVectors(data) {
    const { vecVocoder, barVocoder, vecPhase, barPhase, vecSpeaker, barSpeaker, auditorNote } = this.elements;

    const vocoderPct = `${(data.vectors.vocoder_score * 100).toFixed(1)}%`;
    const phasePct = `${(data.vectors.phase_score * 100).toFixed(1)}%`;
    const speakerPct = data.speaker_match !== null ? `${(data.speaker_match * 100).toFixed(1)}%` : 'N/A';

    if (vecVocoder) vecVocoder.textContent = vocoderPct;
    if (barVocoder) barVocoder.style.width = vocoderPct;

    if (vecPhase) vecPhase.textContent = phasePct;
    if (barPhase) barPhase.style.width = phasePct;

    if (vecSpeaker) vecSpeaker.textContent = speakerPct;
    if (barSpeaker) barSpeaker.style.width = data.speaker_match !== null ? speakerPct : '0%';

    if (auditorNote && data.auditor_notes) {
      auditorNote.textContent = data.auditor_notes;
    }
  },

  /**
   * Render temporal anomaly table.
   * @param {Array} slices
   */
  renderTemporalTable(slices) {
    const tbody = this.elements.temporalTableBody;
    if (!tbody || !slices) return;

    tbody.innerHTML = slices.map(slice => {
      const isDanger = slice.prob > 0.7;
      const isWarn = slice.prob >= 0.4 && slice.prob <= 0.7;
      const badgeClass = isDanger ? 'bg-danger text-white' : isWarn ? 'bg-warning text-dark' : 'bg-success text-white';

      return `
        <tr>
          <td class="text-white">${slice.start_sec}s — ${slice.end_sec}s</td>
          <td class="text-secondary">${slice.signature}</td>
          <td class="${isDanger ? 'text-danger fw-bold' : isWarn ? 'text-warning fw-bold' : 'text-success'}">
            ${(slice.prob * 100).toFixed(1)}%
          </td>
          <td><span class="badge ${badgeClass} font-mono">${slice.severity}</span></td>
        </tr>
      `;
    }).join('');
  },

  /**
   * Render dynamic STFT Mel-Spectrogram simulation to HTML5 Canvas.
   * @param {Array} slices
   */
  renderSpectrogram(slices) {
    const canvas = this.elements.spectrogramCanvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth - 32;
    canvas.height = 240;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#05070D';
    ctx.fillRect(0, 0, w, h);

    const cols = 75;
    const rows = 36;
    const colWidth = w / cols;
    const rowHeight = h / rows;

    for (let i = 0; i < cols; i++) {
      const colNorm = i / cols;
      let hasAnomaly = false;

      if (slices) {
        hasAnomaly = slices.some(s => {
          const totalDur = 10.0;
          return (colNorm >= (s.start_sec / totalDur)) && (colNorm <= (s.end_sec / totalDur)) && s.prob > 0.65;
        });
      }

      for (let j = 0; j < rows; j++) {
        const rowNorm = 1 - (j / rows);
        const energy = Math.sin(colNorm * 8 + j * 0.4) * 0.5 + Math.cos(colNorm * 3) * 0.3 + 0.3;

        if (hasAnomaly && rowNorm > 0.6) {
          // Synthetic artifact glow in high frequencies (Red)
          const redVal = Math.floor(180 + Math.random() * 75);
          ctx.fillStyle = `rgba(${redVal}, 40, 60, ${Math.min(1, energy + 0.3)})`;
        } else {
          // Organic speech frequency bins (Obsidian cyan / deep blue)
          const cyanIntensity = Math.floor(energy * 220);
          ctx.fillStyle = `rgba(30, ${cyanIntensity}, ${Math.min(255, cyanIntensity + 35)}, ${energy * 0.85})`;
        }

        ctx.fillRect(i * colWidth, j * rowHeight, colWidth - 1, rowHeight - 1);
      }
    }
  },

  /**
   * Set up audio playback and scrub bar.
   * @param {string} audioUrl
   */
  setupAudioPlayer(audioUrl) {
    const audio = this.elements.playbackElement;
    if (!audio) return;

    audio.src = audioUrl || '';

    audio.ontimeupdate = () => {
      const current = audio.currentTime || 0;
      const duration = audio.duration || 10.4;
      const pct = (current / duration) * 100;

      if (this.elements.audioTimelineSlider) {
        this.elements.audioTimelineSlider.value = pct;
      }
      if (this.elements.audioCurrentTime) {
        this.elements.audioCurrentTime.textContent = this.formatTimeSec(current);
      }
    };

    audio.onloadedmetadata = () => {
      if (this.elements.audioTotalDuration) {
        this.elements.audioTotalDuration.textContent = this.formatTimeSec(audio.duration);
      }
    };

    audio.onended = () => {
      this.isPlaying = false;
      this.elements.playIcon.classList.replace('fa-pause', 'fa-play');
    };
  },

  /**
   * Toggle audio playback.
   */
  toggleAudioPlayback() {
    const audio = this.elements.playbackElement;
    if (!audio) return;

    if (this.isPlaying) {
      audio.pause();
      this.isPlaying = false;
      this.elements.playIcon.classList.replace('fa-pause', 'fa-play');
    } else {
      audio.play().catch(() => {
        // Fallback simulation when no direct audio stream source is present
        this.simulatePlaybackProgress();
      });
      this.isPlaying = true;
      this.elements.playIcon.classList.replace('fa-play', 'fa-pause');
    }
  },

  /**
   * Simulates playback progression on scrub timeline if media file is empty.
   */
  simulatePlaybackProgress() {
    let current = 0;
    const duration = 10.4;
    const interval = setInterval(() => {
      if (!this.isPlaying || current >= duration) {
        clearInterval(interval);
        this.isPlaying = false;
        if (this.elements.playIcon) this.elements.playIcon.classList.replace('fa-pause', 'fa-play');
        return;
      }
      current += 0.2;
      const pct = (current / duration) * 100;
      if (this.elements.audioTimelineSlider) this.elements.audioTimelineSlider.value = pct;
      if (this.elements.audioCurrentTime) this.elements.audioCurrentTime.textContent = this.formatTimeSec(current);
    }, 200);
  },

  /**
   * Format time in MM:SS.s
   * @param {number} sec
   * @returns {string}
   */
  formatTimeSec(sec) {
    const mins = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1);
    return `${String(mins).padStart(2, '0')}:${s < 10 ? '0' : ''}${s}`;
  },

  /**
   * Download JSON audit report.
   */
  exportJson() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.payload, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `VoiceShield_Audit_${this.scanId}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  /**
   * Default mock payload for standalone browser execution.
   */
  getMockTelemetryData(id) {
    return {
      id: id,
      filename: 'executive_wire_instruction.wav',
      sample_rate: '16.0 kHz Mono',
      duration_seconds: 10.4,
      deepfake_prob: 0.984,
      speaker_match: 0.382,
      model_confidence: 0.991,
      speaker_profile_name: 'Enrolled Speaker #14 (Satya Nadella)',
      audio_url: '',
      vectors: {
        vocoder_score: 0.968,
        phase_score: 0.742
      },
      auditor_notes: 'High-confidence AI clone identified. Algorithmic phase discontinuities detected beyond 7.2kHz, indicating synthetic vocoder generation.',
      temporal_slices: [
        { start_sec: '0.0', end_sec: '2.4', signature: 'Harmonic Baseline Check', prob: 0.12, severity: 'LOW' },
        { start_sec: '2.4', end_sec: '5.8', signature: 'High-Frequency Splicing', prob: 0.98, severity: 'CRITICAL' },
        { start_sec: '5.8', end_sec: '8.2', signature: 'Pitch Inversion Artifact', prob: 0.89, severity: 'HIGH' },
        { start_sec: '8.2', end_sec: '10.4', signature: 'Background Re-synthesis', prob: 0.65, severity: 'MEDIUM' }
      ]
    };
  }
};

// Auto-run when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  Result.init();
});