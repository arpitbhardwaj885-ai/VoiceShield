/**
 * VoiceShield - Unified API Client Layer
 * Handles authenticated HTTP requests to FastAPI and Supabase endpoints.
 * Automatically injects JWT Bearer tokens, manages FormData payloads,
 * standardizes error responses, and provides resilient offline mocks.
 * Relies on: js/config.js, js/auth.js, js/utils.js
 */

const API = {
  /**
   * Retrieves the base API URL from configuration.
   * @returns {string}
   */
  getBaseUrl() {
    if (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) {
      return CONFIG.API_BASE_URL.replace(/\/+$/, '');
    }
    return 'http://localhost:8000/api';
  },

  /**
   * Core request dispatcher with authentication and error interception.
   * @param {string} endpoint - API route (e.g. '/analysis')
   * @param {Object} [options={}] - Fetch configuration options
   * @returns {Promise<Object>} Parsed JSON response
   */
  async request(endpoint, options = {}) {
    const url = `${this.getBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    // Default headers
    const headers = options.headers ? { ...options.headers } : {};

    // Attach JWT Bearer Token if present
    const token = typeof Auth !== 'undefined' ? Auth.getToken() : null;
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Set JSON content-type unless transmitting FormData (browser handles boundaries)
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);

      // Handle HTTP 401 Unauthorized globally
      if (response.status === 401) {
        console.warn('[VoiceShield API] Unauthorized access (401). Session expired.');
        if (typeof Auth !== 'undefined' && typeof Auth.logout === 'function') {
          Auth.logout();
        }
        throw new Error('Session credentials expired. Please re-authenticate.');
      }

      // Parse JSON response body
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (!response.ok) {
        const errorMsg = data?.detail || data?.message || `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.error(`[VoiceShield API] Request failure [${options.method || 'GET'} ${endpoint}]:`, err.message);
      throw err;
    }
  },

  /* ==========================================================================
     1. Authentication Endpoints
     ========================================================================== */

  /**
   * Submits credentials to FastAPI token issuance endpoint.
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{ access_token: string, token_type: string, user: Object }>}
   */
  async login(email, password) {
    try {
      return await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    } catch (err) {
      // Mock fallback for UI preview
      if (this.isMockFallbackAllowed(err)) {
        console.info('[VoiceShield API] Mock fallback active for login.');
        return {
          access_token: `mock_jwt_${Date.now()}`,
          token_type: 'bearer',
          user: {
            id: 'usr_01',
            email: email,
            name: email.split('@')[0],
            role: 'lead_analyst'
          }
        };
      }
      throw err;
    }
  },

  /**
   * Registers a new analyst workstation account.
   * @param {Object} userData - { fullName, email, password }
   */
  async register(userData) {
    try {
      return await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    } catch (err) {
      if (this.isMockFallbackAllowed(err)) {
        console.info('[VoiceShield API] Mock fallback active for registration.');
        return {
          status: 'success',
          message: 'Station profile registered successfully.',
          user: {
            id: `usr_${Date.now()}`,
            email: userData.email,
            name: userData.fullName
          }
        };
      }
      throw err;
    }
  },

  /* ==========================================================================
     2. Forensic Audio Analysis Endpoints
     ========================================================================== */

  /**
   * Uploads an audio payload with inspection flags for model inference.
   * @param {File|Blob} file - Lossless or standard audio file
   * @param {Object} params - { speaker_id, spectrogram, temporal_slicing, phase_inversion }
   * @returns {Promise<Object>}
   */
  async createAnalysis(file, params = {}) {
    const formData = new FormData();
    formData.append('file', file);

    if (params.speaker_id) formData.append('speaker_id', params.speaker_id);
    if (params.spectrogram !== undefined) formData.append('spectrogram', params.spectrogram);
    if (params.temporal_slicing !== undefined) formData.append('temporal_slicing', params.temporal_slicing);
    if (params.phase_inversion !== undefined) formData.append('phase_inversion', params.phase_inversion);

    try {
      return await this.request('/analysis', {
        method: 'POST',
        body: formData
      });
    } catch (err) {
      if (this.isMockFallbackAllowed(err)) {
        console.info('[VoiceShield API] Mock fallback active for createAnalysis.');
        return {
          status: 'success',
          data: {
            id: `SCN-${Math.floor(1000 + Math.random() * 9000)}`,
            filename: file.name || 'live_intercept.wav',
            created_at: new Date().toISOString()
          }
        };
      }
      throw err;
    }
  },

  /**
   * Retrieves full telemetry result and STFT spectrogram slices by scan ID.
   * @param {string} scanId 
   * @returns {Promise<Object>}
   */
  async getAnalysisResult(scanId) {
    try {
      return await this.request(`/analysis/${scanId}`);
    } catch (err) {
      if (this.isMockFallbackAllowed(err)) {
        console.info('[VoiceShield API] Mock fallback active for getAnalysisResult.');
        return {
          status: 'success',
          data: {
            id: scanId,
            filename: 'executive_wire_instruction.wav',
            sample_rate: '16.0 kHz Mono',
            duration_seconds: 10.4,
            deepfake_prob: 0.984,
            speaker_match: 0.382,
            model_confidence: 0.991,
            speaker_profile_name: 'Satya Nadella',
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
          }
        };
      }
      throw err;
    }
  },

  /* ==========================================================================
     3. Historical Audit Ledger Endpoints
     ========================================================================== */

  /**
   * Fetches historical forensic scan records.
   * @param {Object} [query={}] - { limit, offset, risk_level }
   * @returns {Promise<Object>}
   */
  async getHistory(query = {}) {
    const params = new URLSearchParams(query).toString();
    const endpoint = `/history${params ? `?${params}` : ''}`;
    return await this.request(endpoint);
  },

  /* ==========================================================================
     4. Speaker Biometric Registry Endpoints
     ========================================================================== */

  /**
   * Fetches list of registered target voiceprints.
   * @returns {Promise<Object>}
   */
  async getSpeakers() {
    return await this.request('/speakers');
  },

  /**
   * Enrolls a new target voiceprint with reference audio.
   * @param {string} name - Speaker identity
   * @param {File|Blob} audioFile - Clean mono reference sample
   * @returns {Promise<Object>}
   */
  async enrollSpeaker(name, audioFile) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('reference_audio', audioFile);

    return await this.request('/speakers/enroll', {
      method: 'POST',
      body: formData
    });
  },

  /**
   * Purges an enrolled voiceprint from the registry.
   * @param {string} speakerId 
   * @returns {Promise<Object>}
   */
  async deleteSpeaker(speakerId) {
    return await this.request(`/speakers/${speakerId}`, {
      method: 'DELETE'
    });
  },

  /* ==========================================================================
     5. System & Dashboard Telemetry
     ========================================================================== */

  /**
   * Retrieves dashboard statistics and aggregate telemetry.
   * @returns {Promise<Object>}
   */
  async getDashboardMetrics() {
    return await this.request('/dashboard/metrics');
  },

  /**
   * Determines whether to allow simulated mock data if FastAPI server is unreachable.
   * @param {Error} error 
   * @returns {boolean}
   */
  isMockFallbackAllowed(error) {
    // Falls back if network is unreachable or explicitly running in demo mode
    return (
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      (typeof CONFIG !== 'undefined' && CONFIG.ENABLE_MOCKS === true)
    );
  }
};

// Freeze API to guard against runtime prototype mutation
Object.freeze(API);