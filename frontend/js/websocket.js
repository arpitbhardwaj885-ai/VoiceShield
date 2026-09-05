/**
 * VoiceShield - WebSocket Communication Client
 * Handles real-time streaming connections to the FastAPI backend (/ws/stream),
 * automatic reconnection with backoff, authentication headers, and chunk transmission.
 * Relies on: js/config.js, js/auth.js
 */

const WS = {
  socket: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectDelayMs: 1500,
  reconnectTimer: null,
  heartbeatInterval: null,
  heartbeatMs: 25000,
  isExplicitlyClosed: false,

  // External event hooks
  onStatusChange: null, // (status: 'connected' | 'connecting' | 'disconnected') => void
  onMessage: null,      // (data: Object) => void
  onError: null,        // (error: Event) => void

  /**
   * Resolves the WebSocket URL based on CONFIG and current protocol.
   * @returns {string}
   */
  getEndpointUrl() {
    if (typeof CONFIG !== 'undefined' && CONFIG.WS_BASE_URL) {
      return `${CONFIG.WS_BASE_URL}/ws/stream`;
    }

    // Dynamic resolution based on host
    const isSecure = window.location.protocol === 'https:';
    const protocol = isSecure ? 'wss:' : 'ws:';
    const host = window.location.host || 'localhost:8000';
    return `${protocol}//${host}/ws/stream`;
  },

  /**
   * Initiates a WebSocket connection with the backend.
   * @param {string} [customToken] - Optional bearer token override
   */
  connect(customToken) {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.warn('[VoiceShield WS] Active or connecting session already exists.');
      return;
    }

    this.isExplicitlyClosed = false;
    this.notifyStatus('connecting');

    try {
      let url = this.getEndpointUrl();

      // Append auth token query parameter if authenticated
      const token = customToken || (typeof Auth !== 'undefined' ? Auth.getToken() : null);
      if (token) {
        const delimiter = url.includes('?') ? '&' : '?';
        url = `${url}${delimiter}token=${encodeURIComponent(token)}`;
      }

      this.socket = new WebSocket(url);
      this.socket.binaryType = 'arraybuffer';

      this.socket.onopen = (event) => {
        console.info('[VoiceShield WS] Tunnel established successfully:', url);
        this.reconnectAttempts = 0;
        this.notifyStatus('connected');
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          // Handle system pong responses
          if (payload.type === 'pong') {
            return;
          }

          // Compute client-side round-trip time if timestamp was echoed
          if (payload.timestamp) {
            payload.rtt = Math.max(1, Date.now() - payload.timestamp);
          }

          if (typeof this.onMessage === 'function') {
            this.onMessage(payload);
          }
        } catch (err) {
          console.warn('[VoiceShield WS] Non-JSON payload received:', event.data);
        }
      };

      this.socket.onerror = (error) => {
        console.error('[VoiceShield WS] Socket communication error:', error);
        if (typeof this.onError === 'function') {
          this.onError(error);
        }
      };

      this.socket.onclose = (event) => {
        this.stopHeartbeat();
        this.notifyStatus('disconnected');

        if (!this.isExplicitlyClosed) {
          console.warn(`[VoiceShield WS] Disconnected (code: ${event.code}). Attempting reconnect...`);
          this.scheduleReconnect();
        } else {
          console.info('[VoiceShield WS] Connection closed cleanly by client.');
        }
      };

    } catch (err) {
      console.error('[VoiceShield WS] Initialization error:', err);
      this.notifyStatus('disconnected');
      this.scheduleReconnect();
    }
  },

  /**
   * Transmits serialized payload or raw ArrayBuffer to backend.
   * @param {Object|ArrayBuffer} data 
   * @returns {boolean} Success status
   */
  send(data) {
    if (!this.isConnected()) {
      console.warn('[VoiceShield WS] Cannot send payload. Socket not in OPEN state.');
      return false;
    }

    try {
      if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
        this.socket.send(data);
      } else {
        this.socket.send(JSON.stringify(data));
      }
      return true;
    } catch (err) {
      console.error('[VoiceShield WS] Send transmission failed:', err);
      return false;
    }
  },

  /**
   * Checks if connection is active.
   * @returns {boolean}
   */
  isConnected() {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  },

  /**
   * Closes active socket connection cleanly.
   */
  disconnect() {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    this.clearReconnectTimer();

    if (this.socket) {
      this.socket.close(1000, 'Client disconnected');
      this.socket = null;
    }

    this.notifyStatus('disconnected');
  },

  /**
   * Schedules an exponential backoff reconnect attempt.
   */
  scheduleReconnect() {
    this.clearReconnectTimer();

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[VoiceShield WS] Maximum reconnect threshold reached. Halting auto-reconnect.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelayMs * Math.pow(1.5, this.reconnectAttempts - 1);
    console.info(`[VoiceShield WS] Reconnecting in ${delay.toFixed(0)}ms (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  },

  /**
   * Clears pending reconnection timer.
   */
  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  },

  /**
   * Starts periodic heartbeat frames to prevent socket timeouts.
   */
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, this.heartbeatMs);
  },

  /**
   * Stops heartbeat interval.
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  },

  /**
   * Broadcasts status changes to external listeners.
   * @param {'connected'|'connecting'|'disconnected'} status 
   */
  notifyStatus(status) {
    if (typeof this.onStatusChange === 'function') {
      this.onStatusChange(status);
    }
  }
};

// Freeze to prevent prototype pollution
Object.freeze(WS);