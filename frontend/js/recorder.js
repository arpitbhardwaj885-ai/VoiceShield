/**
 * VoiceShield - Client-side Forensic Audio Recorder
 * Records uncompressed client audio and downsamples directly to 16kHz Mono 16-bit PCM WAV.
 * Emits standard WAV Blob compatible with VoiceShield's FastAPI ingest endpoint.
 */

const Recorder = {
  audioContext: null,
  mediaStream: null,
  processorNode: null,
  sourceNode: null,
  pcmBuffers: [],
  recordingLength: 0,
  isRecording: false,
  startTime: 0,
  timerInterval: null,
  targetSampleRate: 16000, // Fixed 16kHz forensic pipeline target

  /**
   * Request microphone permissions and begin capturing audio.
   * @param {Function} [onTick] - Optional callback receiving formatted time string (MM:SS)
   * @returns {Promise<boolean>}
   */
  async start(onTick) {
    if (this.isRecording) {
      console.warn('[VoiceShield Recorder] Recording session already active.');
      return false;
    }

    try {
      // Clean slate
      this.pcmBuffers = [];
      this.recordingLength = 0;

      // Request raw mono audio stream without browser auto-processing distorters
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
      const inputSampleRate = this.audioContext.sampleRate;

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Buffer size: 4096 samples, 1 input channel, 1 output channel
      const bufferSize = 4096;
      if (this.audioContext.createScriptProcessor) {
        this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
      } else {
        // Fallback compatibility
        this.processorNode = this.audioContext.createJavaScriptNode(bufferSize, 1, 1);
      }

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        const channelData = e.inputBuffer.getChannelData(0);

        // Downsample in chunks to target 16kHz Mono
        const downsampled = this.downsampleBuffer(channelData, inputSampleRate, this.targetSampleRate);
        this.pcmBuffers.push(downsampled);
        this.recordingLength += downsampled.length;
      };

      // Connect graph: Source -> Processor -> Destination
      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);

      this.isRecording = true;
      this.startTime = Date.now();

      // Setup UI elapsed timer
      const timerEl = document.getElementById('recordTimer');
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        const elapsedSec = Math.floor((Date.now() - this.startTime) / 1000);
        const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
        const secs = String(elapsedSec % 60).padStart(2, '0');
        const formatted = `00:${mins}:${secs}`;
        if (timerEl) timerEl.textContent = formatted;
        if (typeof onTick === 'function') onTick(formatted);
      }, 500);

      return true;
    } catch (err) {
      console.error('[VoiceShield Recorder] Microphone capture error:', err);
      alert('Microphone permission denied or audio device unavailable.');
      this.cleanup();
      return false;
    }
  },

  /**
   * Stop capturing audio, assemble the 16kHz PCM data, and compile a valid WAV Blob.
   * @param {Function} callback - Receives the resulting WAV Blob
   */
  stop(callback) {
    if (!this.isRecording) {
      console.warn('[VoiceShield Recorder] Stop called with no active capture.');
      return;
    }

    this.isRecording = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Merge individual audio chunks into a contiguous Float32Array
    const mergedPcm = new Float32Array(this.recordingLength);
    let offset = 0;
    for (let i = 0; i < this.pcmBuffers.length; i++) {
      mergedPcm.set(this.pcmBuffers[i], offset);
      offset += this.pcmBuffers[i].length;
    }

    // Encode RIFF/WAVE header with 16-bit linear PCM
    const wavBlob = this.encodeWAV(mergedPcm, this.targetSampleRate);

    // Release audio hardware
    this.cleanup();

    if (typeof callback === 'function') {
      callback(wavBlob);
    }
  },

  /**
   * Resamples raw audio buffer from native browser sample rate to target rate.
   * @param {Float32Array} buffer - Input channel samples
   * @param {number} inputRate - AudioContext native rate (e.g. 48000 or 44100)
   * @param {number} outputRate - Target rate (16000)
   * @returns {Float32Array}
   */
  downsampleBuffer(buffer, inputRate, outputRate) {
    if (inputRate === outputRate) {
      return new Float32Array(buffer);
    }

    const sampleRateRatio = inputRate / outputRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);

    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
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
   * Constructs a standard 16-bit mono RIFF WAV Blob.
   * @param {Float32Array} samples - Normalized floating point samples (-1.0 to 1.0)
   * @param {number} sampleRate - Standard sample rate (16000)
   * @returns {Blob}
   */
  encodeWAV(samples, sampleRate) {
    const numChannels = 1;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    // RIFF chunk size
    view.setUint32(4, 36 + dataSize, true);
    // Format identifier
    this.writeString(view, 8, 'WAVE');

    // "fmt " sub-chunk header
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);          // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true);           // AudioFormat (1 = PCM)
    view.setUint16(22, numChannels, true); // 1 = Mono
    view.setUint32(24, sampleRate, true);  // Sample Rate
    view.setUint32(28, byteRate, true);    // Byte Rate
    view.setUint16(32, blockAlign, true);  // Block Align
    view.setUint16(34, 16, true);          // Bits per sample (16)

    // "data" sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write PCM samples clamped to 16-bit signed integer range [-32768, 32767]
    let index = 44;
    for (let i = 0; i < samples.length; i++, index += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([view], { type: 'audio/wav' });
  },

  /**
   * Helper to write ASCII strings to DataView.
   */
  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  },

  /**
   * Disconnects Web Audio nodes and terminates active mic tracks.
   */
  cleanup() {
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
};

// Freeze API to prevent accidental tampering
Object.freeze(Recorder);