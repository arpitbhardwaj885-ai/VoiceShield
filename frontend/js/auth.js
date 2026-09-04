/**
 * VoiceShield - Authentication Controller
 * Manages JWT tokens, local persistence, route protection, and auth API requests.
 * Relies on: js/config.js
 */

const Auth = {
  /**
   * Retrieves the stored JWT access token.
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Saves authentication session data to localStorage.
   * @param {string} token
   * @param {Object} user
   */
  setSession(token, user) {
    if (token) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, token);
    }
    if (user) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    }
  },

  /**
   * Returns current authenticated user profile object.
   * @returns {Object|null}
   */
  getUser() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Evaluates if active token exists in storage.
   * @returns {boolean}
   */
  isAuthenticated() {
    return Boolean(this.getToken());
  },

  /**
   * Authenticates user against FastAPI /api/auth/login.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>}
   */
  async login(email, password) {
    const endpoint = `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.LOGIN}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Invalid credentials or login failure.');
      }

      // Store JWT token and user profile
      this.setSession(result.data.access_token, result.data.user);
      return result.data;
    } catch (err) {
      // Fallback for demonstration when backend server is offline
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        console.warn('[VoiceShield Auth] Backend not responding. Simulating credential handshake.');
        const mockUser = { id: 'usr_mock_01', name: email.split('@')[0], email };
        this.setSession('mock_jwt_token_analyst', mockUser);
        return { access_token: 'mock_jwt_token_analyst', user: mockUser };
      }
      throw err;
    }
  },

  /**
   * Registers a new tenant or analyst account via FastAPI /api/auth/register.
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>}
   */
  async register(name, email, password) {
    const endpoint = `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.REGISTER}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Registration failed.');
      }

      return result;
    } catch (err) {
      // Fallback for demonstration when backend server is offline
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        console.warn('[VoiceShield Auth] Backend not responding. Simulating registration completion.');
        return { success: true, message: 'Simulated user registered successfully.' };
      }
      throw err;
    }
  },

  /**
   * Clears token session and redirects to login portal.
   */
  logout() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
    window.location.href = CONFIG.ROUTES.LOGIN;
  },

  /**
   * Guard for protected internal pages (dashboard, analyze, live, history, etc.).
   * Redirects unauthenticated visitors to login.html.
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      const current = encodeURIComponent(window.location.pathname.split('/').pop());
      window.location.href = `${CONFIG.ROUTES.LOGIN}?redirect=${current}`;
    }
  }
};

// Freeze the interface to protect against prototype poisoning
Object.freeze(Auth);