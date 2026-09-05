/**
 * VoiceShield - Shared Client Utilities & Formatting Helpers
 * Modular helper layer for DOM manipulation, metric conversion,
 * toasts, timing controls, and security hygiene.
 */

const Utils = {
  /**
   * Format byte values to human-readable strings (KB, MB, GB).
   * @param {number} bytes 
   * @param {number} [decimals=2] 
   * @returns {string}
   */
  formatBytes(bytes, decimals = 2) {
    if (!bytes || bytes === 0) return '0.00 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  },

  /**
   * Format seconds to standard MM:SS.ms string.
   * @param {number} seconds 
   * @returns {string}
   */
  formatDuration(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00.0';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${String(mins).padStart(2, '0')}:${parseFloat(secs) < 10 ? '0' : ''}${secs}`;
  },

  /**
   * Format ISO timestamp to concise UTC or locale string.
   * @param {string|Date} iso 
   * @param {boolean} [includeTime=true] 
   * @returns {string}
   */
  formatTimestamp(iso, includeTime = true) {
    if (!iso) return 'N/A';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return String(iso);
      if (!includeTime) {
        return d.toISOString().split('T')[0];
      }
      return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    } catch {
      return String(iso);
    }
  },

  /**
   * Format a decimal probability (0.0 - 1.0) into a clean percentage string.
   * @param {number} val 
   * @param {number} [decimals=1] 
   * @returns {string}
   */
  formatPercentage(val, decimals = 1) {
    if (val === null || val === undefined || isNaN(val)) return 'N/A';
    return `${(val * 100).toFixed(decimals)}%`;
  },

  /**
   * Return corresponding CSS threat badge class and text based on probability score.
   * @param {number} prob - Decimal value between 0.0 and 1.0
   * @returns {{ label: string, badgeClass: string, textClass: string, severity: string }}
   */
  getThreatClassification(prob) {
    const p = parseFloat(prob) || 0;
    if (p >= 0.70) {
      return {
        label: 'CRITICAL CLONE',
        badgeClass: 'threat-pill critical',
        textClass: 'text-danger',
        severity: 'CRITICAL'
      };
    } else if (p >= 0.40) {
      return {
        label: 'PHASE ANOMALY',
        badgeClass: 'threat-pill suspicious',
        textClass: 'text-warning',
        severity: 'MEDIUM'
      };
    }
    return {
      label: 'AUTHENTIC',
      badgeClass: 'threat-pill authentic',
      textClass: 'text-success',
      severity: 'LOW'
    };
  },

  /**
   * Sanitizes user input string against HTML injection (XSS protection).
   * @param {string} str 
   * @returns {string}
   */
  escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Extracts URL query parameter by key.
   * @param {string} key 
   * @returns {string|null}
   */
  getUrlParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  },

  /**
   * Generates a cryptographically randomized alphanumeric ID string.
   * @param {string} [prefix='vs'] 
   * @returns {string}
   */
  generateRandomId(prefix = 'vs') {
    const array = new Uint8Array(8);
    window.crypto.getRandomValues(array);
    const hash = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${prefix}_${hash}`;
  },

  /**
   * Displays an editorial glass-card toast notification.
   * @param {string} message 
   * @param {'info'|'success'|'warning'|'danger'} [type='info'] 
   * @param {number} [duration=3500] 
   */
  showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('vsToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'vsToastContainer';
      container.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const colorMap = {
      info: '#4CC9F0',
      success: '#10B981',
      warning: '#FFB703',
      danger: '#FF4D4D'
    };
    const accentColor = colorMap[type] || colorMap.info;

    toast.style.cssText = `
      background: rgba(13, 17, 27, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-left: 4px solid ${accentColor};
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 10px;
      padding: 12px 18px;
      color: #FFFFFF;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      letter-spacing: 0.04em;
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      transform: translateY(20px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    const iconMap = {
      info: 'fa-circle-info',
      success: 'fa-circle-check',
      warning: 'fa-triangle-exclamation',
      danger: 'fa-skull-crossbones'
    };
    const iconClass = iconMap[type] || 'fa-info';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass}" style="color: ${accentColor}; font-size: 1rem;"></i>
      <span>${this.escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    // Dismissal
    setTimeout(() => {
      toast.style.transform = 'translateY(20px)';
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
        if (container.children.length === 0) {
          container.remove();
        }
      }, 300);
    }, duration);
  },

  /**
   * Debounce execution of expensive routines.
   * @param {Function} func 
   * @param {number} wait 
   * @returns {Function}
   */
  debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle execution to a fixed frequency limit.
   * @param {Function} func 
   * @param {number} limit 
   * @returns {Function}
   */
  throttle(func, limit = 200) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Copy text payload to clipboard with feedback callback.
   * @param {string} text 
   * @returns {Promise<boolean>}
   */
  async copyToClipboard(text) {
    if (!navigator.clipboard) {
      return false;
    }
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('Copied to clipboard', 'success', 2000);
      return true;
    } catch (err) {
      console.error('[VoiceShield Utils] Clipboard write failed:', err);
      return false;
    }
  }
};

// Freeze API to prevent accidental modification
Object.freeze(Utils);