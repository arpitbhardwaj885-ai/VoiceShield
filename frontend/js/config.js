/**
 * VoiceShield - Frontend Global Configuration
 * Architecture: FastAPI + Supabase + PyTorch ML Pipeline
 * Authoritative source for routes, endpoints, storage keys, and forensic thresholds.
 */

const CONFIG = {
  // Backend Base URLs
  API_BASE_URL: 'http://localhost:8000/api',
  WS_BASE_URL: 'ws://localhost:8000/api/live-analysis',

  // Frontend Page Routing Map
  ROUTES: {
    HOME: 'index.html',
    LOGIN: 'login.html',
    REGISTER: 'register.html',
    DASHBOARD: 'dashboard.html',
    ANALYZE: 'analyze.html',
    LIVE: 'live-analysis.html',
    HISTORY: 'history.html',
    SPEAKERS: 'speaker-profile.html'
  },

  // Local Storage Persistence Keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'voiceshield_access_token',
    USER_DATA: 'voiceshield_user',
    THEME_PREF: 'voiceshield_theme'
  },

  // Audio Processing Constraints & Accepted Formats
  AUDIO: {
    MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB
    ALLOWED_EXTENSIONS: ['wav', 'mp3', 'flac', 'm4a'],
    ALLOWED_MIME_TYPES: [
      'audio/wav',
      'audio/x-wav',
      'audio/wave',
      'audio/mpeg',
      'audio/mp3',
      'audio/flac',
      'audio/x-flac',
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4'
    ],
    TARGET_SAMPLE_RATE: 16000 // 16 kHz Mono Standard
  },

  // Authoritative Backend API Endpoints (FastAPI)
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/auth/register',
      LOGIN: '/auth/login',
      ME: '/auth/me'
    },
    AUDIO: {
      UPLOAD: '/audio/upload'
    },
    ANALYSIS: {
      CREATE: '/analysis',
      GET_RESULT: (id) => `/analysis/${id}`,
      HISTORY: '/history',
      DELETE: (id) => `/analysis/${id}`
    },
    SPEAKERS: {
      BASE: '/speakers',
      GET_ONE: (id) => `/speakers/${id}`,
      VERIFY: (id) => `/speakers/${id}/verify`
    },
    SYSTEM: {
      HEALTH: '/health'
    }
  },

  // Risk Classification Levels
  RISK_LEVELS: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  },

  // Analysis Processing Lifecycle States
  ANALYSIS_STATUS: {
    QUEUED: 'queued',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
  },

  // Supported Analysis Modes
  ANALYSIS_TYPES: {
    FULL: 'full',
    DEEPFAKE_ONLY: 'deepfake_only',
    SPEAKER_VERIFICATION: 'speaker_verification'
  }
};

// Freeze all objects to prevent runtime tampering in the browser console
Object.freeze(CONFIG);
Object.freeze(CONFIG.ROUTES);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.AUDIO);
Object.freeze(CONFIG.ENDPOINTS);
Object.freeze(CONFIG.ENDPOINTS.AUTH);
Object.freeze(CONFIG.ENDPOINTS.AUDIO);
Object.freeze(CONFIG.ENDPOINTS.ANALYSIS);
Object.freeze(CONFIG.ENDPOINTS.SPEAKERS);
Object.freeze(CONFIG.ENDPOINTS.SYSTEM);
Object.freeze(CONFIG.RISK_LEVELS);
Object.freeze(CONFIG.ANALYSIS_STATUS);
Object.freeze(CONFIG.ANALYSIS_TYPES);