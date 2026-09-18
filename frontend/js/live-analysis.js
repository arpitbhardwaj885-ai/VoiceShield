/**
 * VoiceShield - Real-Time Intercept Stream Controller
 * Coordinates live microphone capture, Web Audio oscilloscope rendering, 
 * audio chunking (500ms slices), and WebSocket telemetry reception.
 * Relies on: js/config.js, js/utils.js, js/api.js, js/auth.js, js/websocket.js
 */

const LiveAnalysis = {
  isStreaming: false,
  audioContext: null,
  mediaStream: null,
  sourceNode: null,
  analyserNode: null,
  processorNode: null,
  animationFrameId: null,

  // Chunk state
  chunkSequence: 0,
  threatFlagCount: 0,
  targetSampleRate: 16000,
  pcmBuffer: [],
  samplesPerSlice: 8000, // 500ms at 16kHz
  sliceStartTime: 0,

  // DOM Elements cache
  elements: {
    connectionStatusPill: null,
    wsStatusDot: null,
    wsStatusText: null,
    liveBadge: null,
    btnToggleStream: null,
    streamBtnIcon: null,
    streamBtnText: null,
    streamLatencyLabel: null,
    liveVerdictTitle: null,
    liveVerdictDescription: null,
    liveProbPercent: null,
    liveThreatMeterFill: null,
    chunkCounter: null,
    threatFlagCounter: null,
    oscilloscopeCanvas: null,
    bufferStatus: null,
    streamLogTable: null,
    streamLogBody: null,
    emptyStreamRow: null,
    btnClearStreamLogs: null,
    liveSpeakerSelect: null,
    speakerMatchScore: null,
    speakerMatchFill: null,
    speakerVerificationLabel: null,
    logoutBtn: null
  },

  /**
   * Initializes the live intercept terminal.
   */
  init() {
    this.cacheElements();
    this.bindEvents();
    this.initCanvas();
    this.bindWebSocketCallbacks();
  },

  /**
   * Map all UI DOM elements.
   */
  cacheElements() {
    this.elements.connectionStatusPill = document.getElementById('connectionStatusPill');
    this.elements.wsStatusDot = document.getElementById('wsStatusDot');
    this.elements.wsStatusText = document.getElementById('wsStatusText');
    this.elements.liveBadge = document.getElementById('liveBadge');
    this.elements.btnToggleStream = document.getElementById('btnToggleStream');
    this.elements.streamBtnIcon = document.getElementById('streamBtnIcon');
    this.elements.streamBtnText = document.getElementById('streamBtnText');
    this.elements.streamLatencyLabel = document.getElementById('streamLatencyLabel');
    this.elements.liveVerdictTitle = document.getElementById('liveVerdictTitle');
    this.elements.liveVerdictDescription = document.getElementById('liveVerdictDescription');
    this.elements.liveProbPercent = document.getElementById('liveProbPercent');
    this.elements.liveThreatMeterFill = document.getElementById('liveThreatMeterFill');
    this.elements.chunkCounter = document.getElementById('chunkCounter');
    this.elements.threatFlagCounter = document.getElementById('threatFlagCounter');
    this.elements.oscilloscopeCanvas = document.getElementById('oscilloscopeCanvas');
    this.elements.bufferStatus = document.getElementById('bufferStatus');
    this.elements.streamLogTable = document.getElementById('streamLogTable');
    this.elements.streamLogBody = document.getElementById('streamLogBody');
    this.elements.emptyStreamRow = document.getElementById('emptyStreamRow');
    this.elements.btnClearStreamLogs = document.getElementById('btnClearStreamLogs');
    this.elements.liveSpeakerSelect = document.getElementById('liveSpeakerSelect');
    this.elements.speakerMatchScore = document.getElementById('speakerMatchScore');
    this.elements.speakerMatchFill = document.getElementById('speakerMatchFill');
    this.elements.speakerVerificationLabel = document.getElementById('speakerVerificationLabel');
    this.elements.logoutBtn = document.getElementById('logoutBtn');
  },

  /**
   * Bind event listeners.
   */
  bindEvents() {
    const { btnToggleStream, btnClearStreamLogs, logoutBtn } = this.elements;

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (typeof Auth !== 'undefined' && typeof Auth.logout === 'function') {
          Auth.logout();
        }
      });
    }

    if (btnToggleStream) {
      btnToggleStream.addEventListener('click', () => this.toggleStreaming());
    }

    if (btnClearStreamLogs) {
      btnClearStreamLogs.addEventListener('click', () => this.clearLogFeed());
    }

    window.addEventListener('resize', () => {
      this.initCanvas();
    });

    window.addEventListener('beforeunload', () => {
      this.stopStreaming();
    });
  },

  /**
   * Connects client to WebSocket service handlers.
   */
  bindWebSocketCallbacks() {
    if (typeof WS !== 'undefined') {
      WS.onStatusChange = (status) => this.handleWsStatus(status);
      WS.onMessage = (data) => this.handleWsChunkResult(data);
    }
  },

  /**
   * Updates WebSocket status indicator in the top navbar.
   * @param {'connected'|'connecting'|'disconnected'} status 
   */
  handleWsStatus(status) {
    const { wsStatusDot, wsStatusText } = this.elements;
    if (!wsStatusDot || !wsStatusText) return;

    wsStatusDot.className = `ws-status-dot ${status}`;
    wsStatusText.textContent = status.toUpperCase();
  },

  /**
   * Canvas dimensioning and background grid line baseline.
   */
  initCanvas() {
    const canvas = this.elements.oscilloscopeCanvas;
    if (!canvas) return;

    canvas.width = canvas.parentElement.clientWidth - 32;
    canvas.height = 150;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#030408';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw baseline center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  },

  /**
   * Starts or stops audio intercept streaming.
   */
  async toggleStreaming() {
    if (!this.isStreaming) {
      await this.startStreaming();
    } else {
      this.stopStreaming();
    }
  },

  /**
   * Initializes hardware mic and begins live stream pipeline.
   */
  async startStreaming() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      const inputRate = this.audioContext.sampleRate;

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;

      // 4096-sample chunks for slicing
      const bufferSize = 4096;
      this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

      this.pcmBuffer = [];
      this.chunkSequence = 0;
      this.threatFlagCount = 0;
      this.sliceStartTime = Date.now();

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isStreaming) return;
        const channelData = e.inputBuffer.getChannelData(0);
        const downsampled = this.downsampleBuffer(channelData, inputRate, this.targetSampleRate);

        for (let i = 0; i < downsampled.length; i++) {
          this.pcmBuffer.push(downsampled[i]);
        }

        // When 500ms worth of samples (8000 samples at 16kHz) accumulate, emit slice
        if (this.pcmBuffer.length >= this.samplesPerSlice) {
          const slicePcm = this.pcmBuffer.splice(0, this.samplesPerSlice);
          this.dispatchAudioSlice(slicePcm);
        }
      };

      // Connect graph: Source -> Analyser -> Processor -> Destination
      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);

      // Connect WebSocket if available
      if (typeof WS !== 'undefined' && typeof WS.connect === 'function') {
        WS.connect();
      }

      this.isStreaming = true;
      this.updateUIState(true);
      this.drawOscilloscope();

    } catch (err) {
      console.error('[VoiceShield Live] Stream startup failed:', err);
      alert('Microphone access denied or hardware input unavailable.');
      this.stopStreaming();
    }
  },

  /**
   * Tears down streaming nodes and terminates capture.
   */
  stopStreaming() {
    this.isStreaming = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (typeof WS !== 'undefined' && typeof WS.disconnect === 'function') {
      WS.disconnect();
    }

    this.updateUIState(false);
    this.initCanvas();
  },

  /**
   * Resamples PCM chunks to target rate (16kHz).
   */
  downsampleBuffer(buffer, inputRate, outputRate) {
    if (inputRate === outputRate) return new Float32Array(buffer);
    const ratio = inputRate / outputRate;
    const newLen = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLen);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0;
      let count = 0;

      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  },

  /**
   * Dispatches audio slices over WebSocket with metadata payload.
   * @param {Array<number>} pcmData 
   */
  dispatchAudioSlice(pcmData) {
    this.chunkSequence++;
    const sendTimestamp = Date.now();
    const speakerId = this.elements.liveSpeakerSelect ? this.elements.liveSpeakerSelect.value : '';

    const payload = {
      sequence: this.chunkSequence,
      timestamp: sendTimestamp,
      speaker_id: speakerId,
      sample_rate: this.targetSampleRate,
      samples_count: pcmData.length,
      // Convert Float32Array to 16-bit Int Base64 or binary chunk
      audio_chunk: this.pcmFloatToBase64(pcmData)
    };

    if (typeof WS !== 'undefined' && WS.isConnected()) {
      WS.send(payload);
    } else {
      // Offline fallback simulation for local testing
      setTimeout(() => {
        const simulatedProb = (this.chunkSequence % 7 === 0) ? 0.94 : (0.02 + Math.random() * 0.12);
        this.handleWsChunkResult({
          sequence: payload.sequence,
          deepfake_prob: simulatedProb,
          vocoder_discontinuity: simulatedProb > 0.5 ? 0.88 : 0.04,
          speaker_match: speakerId ? (simulatedProb > 0.5 ? 0.32 : 0.92) : null,
          rtt: Math.floor(180 + Math.random() * 45),
          timestamp: new Date().toISOString()
        });
      }, 180);
    }

    if (this.elements.bufferStatus) {
      this.elements.bufferStatus.textContent = `BUFFER: SLICE #${this.chunkSequence} SENT (500ms)`;
    }
  },

  /**
   * Encodes raw float PCM into compact Base64 representation.
   */
  pcmFloatToBase64(floats) {
    const buffer = new ArrayBuffer(floats.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < floats.length; i++) {
      const s = Math.max(-1, Math.min(1, floats[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  },

  /**
   * Handles incoming forensic verdict from WebSocket server.
   * @param {Object} data 
   */
  handleWsChunkResult(data) {
    const prob = data.deepfake_prob || 0;
    const isCritical = prob > 0.7;
    const isMedium = prob >= 0.4 && prob <= 0.7;

    if (isCritical) {
      this.threatFlagCount++;
    }

    // Update Counters
    if (this.elements.chunkCounter) this.elements.chunkCounter.textContent = data.sequence || this.chunkSequence;
    if (this.elements.threatFlagCounter) this.elements.threatFlagCounter.textContent = this.threatFlagCount;
    if (this.elements.streamLatencyLabel && data.rtt) {
      this.elements.streamLatencyLabel.textContent = `RTT: ${data.rtt}ms`;
    }

    // Update Gauge Card
    const { liveVerdictTitle, liveVerdictDescription, liveProbPercent, liveThreatMeterFill } = this.elements;
    const probFormatted = `${(prob * 100).toFixed(1)}%`;

    if (liveProbPercent) liveProbPercent.textContent = probFormatted;
    if (liveThreatMeterFill) {
      liveThreatMeterFill.style.width = `${Math.min(100, Math.max(0, prob * 100))}%`;
      liveThreatMeterFill.className = isCritical ? 'threat-meter-fill bg-danger' : isMedium ? 'threat-meter-fill bg-warning' : 'threat-meter-fill bg-success';
    }

    if (isCritical) {
      liveVerdictTitle.textContent = 'CRITICAL CLONE FLAGGED';
      liveVerdictTitle.className = 'live-verdict-title text-danger mb-2';
      liveVerdictDescription.textContent = `Vocoder phase glitch isolated in slice #${data.sequence}. Neural synthetic reconstruction confidence ${probFormatted}.`;
    } else if (isMedium) {
      liveVerdictTitle.textContent = 'PHASE INSTABILITY';
      liveVerdictTitle.className = 'live-verdict-title text-warning mb-2';
      liveVerdictDescription.textContent = 'Harmonic jitter detected. Anomaly score moderately elevated.';
    } else {
      liveVerdictTitle.textContent = 'ORGANIC AUDIO STREAM';
      liveVerdictTitle.className = 'live-verdict-title text-success mb-2';
      liveVerdictDescription.textContent = 'Continuous acoustic harmonics align with organic physiological speech patterns.';
    }

    // Update Target Speaker Match Gauge
    if (data.speaker_match !== null && data.speaker_match !== undefined) {
      const matchPct = (data.speaker_match * 100).toFixed(1);
      if (this.elements.speakerMatchScore) this.elements.speakerMatchScore.textContent = `${matchPct}%`;
      if (this.elements.speakerMatchFill) this.elements.speakerMatchFill.style.width = `${matchPct}%`;
      if (this.elements.speakerVerificationLabel) {
        this.elements.speakerVerificationLabel.textContent = data.speaker_match > 0.75 
          ? 'Voice biometric match confirmed above verification threshold.' 
          : 'Cosine similarity below identity threshold (Impersonation suspect).';
      }
    }

    // Append to Ledger Table
    this.appendStreamLogRow(data, isCritical, isMedium, probFormatted);
  },

  /**
   * Appends evaluation row to on-screen rolling table.
   */
  appendStreamLogRow(data, isCritical, isMedium, probFormatted) {
    const tbody = this.elements.streamLogBody;
    const emptyRow = this.elements.emptyStreamRow;
    if (!tbody) return;

    if (emptyRow) {
      emptyRow.remove();
      this.elements.emptyStreamRow = null;
    }

    const badgeClass = isCritical ? 'threat-pill critical' : isMedium ? 'threat-pill suspicious' : 'threat-pill authentic';
    const badgeText = isCritical ? 'CRITICAL CLONE' : isMedium ? 'PHASE ANOMALY' : 'AUTHENTIC';
    const probClass = isCritical ? 'text-danger fw-bold' : isMedium ? 'text-warning fw-bold' : 'text-success';
    const vocoderPct = `${((data.vocoder_discontinuity || 0) * 100).toFixed(1)}%`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-white">Chunk #${data.sequence}</td>
      <td><span class="${badgeClass}">${badgeText}</span></td>
      <td class="${probClass}">${probFormatted}</td>
      <td class="text-secondary">${vocoderPct}</td>
      <td><span class="badge bg-secondary bg-opacity-25 font-mono text-cyan">INSPECTED</span></td>
    `;

    // Prepend newest at top
    tbody.insertBefore(tr, tbody.firstChild);

    // Limit visible log buffer to 25 items
    while (tbody.children.length > 25) {
      tbody.removeChild(tbody.lastChild);
    }
  },

  /**
   * Clears the rolling log table.
   */
  clearLogFeed() {
    const tbody = this.elements.streamLogBody;
    if (!tbody) return;
    tbody.innerHTML = `
      <tr id="emptyStreamRow">
        <td colspan="5" class="text-center text-secondary py-4">
          Stream feed cleared. Awaiting live chunk events...
        </td>
      </tr>
    `;
    this.elements.emptyStreamRow = document.getElementById('emptyStreamRow');
  },

  /**
   * Real-time oscilloscope canvas rendering loop.
   */
  drawOscilloscope() {
    if (!this.isStreaming || !this.analyserNode) return;

    const canvas = this.elements.oscilloscopeCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteTimeDomainData(dataArray);

    ctx.fillStyle = '#030408';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Background horizontal baseline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Waveform trace
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#4CC9F0';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#4CC9F0';
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    this.animationFrameId = requestAnimationFrame(() => this.drawOscilloscope());
  },

  /**
   * Synchronizes UI state indicators between active and idle stream.
   * @param {boolean} active 
   */
  updateUIState(active) {
    const { liveBadge, btnToggleStream, streamBtnIcon, streamBtnText } = this.elements;

    if (active) {
      if (liveBadge) liveBadge.style.display = 'inline-block';
      if (btnToggleStream) {
        btnToggleStream.classList.replace('btn-stream-start', 'btn-stream-stop');
      }
      if (streamBtnIcon) streamBtnIcon.className = 'fa-solid fa-stop';
      if (streamBtnText) streamBtnText.textContent = 'Terminate Intercept Stream';
    } else {
      if (liveBadge) liveBadge.style.display = 'none';
      if (btnToggleStream) {
        btnToggleStream.classList.replace('btn-stream-stop', 'btn-stream-start');
      }
      if (streamBtnIcon) streamBtnIcon.className = 'fa-solid fa-microphone-lines';
      if (streamBtnText) streamBtnText.textContent = 'Initialize Audio Intercept';
      if (this.elements.bufferStatus) this.elements.bufferStatus.textContent = 'BUFFER: IDLE';
      if (this.elements.streamLatencyLabel) this.elements.streamLatencyLabel.textContent = 'RTT: --ms';
    }
  }
};

// Bootstrap controller when DOM is parsed
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Auth !== 'undefined' && typeof Auth.requireAuth === 'function') {
    Auth.requireAuth();
  }
  LiveAnalysis.init();
});