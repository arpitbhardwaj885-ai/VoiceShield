/**
 * VoiceShield - Authentication Controller
 * Manages JWT tokens, local persistence, route protection, and auth API requests.
 * Also wires up login.html / register.html (no inline <script> exists on
 * those pages, so this file attaches all event listeners by element id).
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
   * Email/password login is not implemented on the backend
   * (app/api/routes/auth.py: only GET /auth/me exists; Google OAuth is the
   * sole login path). Kept as a rejected promise so callers get a clear
   * message instead of hitting a non-existent endpoint.
   * @returns {Promise<Object>}
   */
  async login() {
    throw new Error('Email/password login is not available. Please use Google Sign-In.');
  },

  /**
   * Email/password registration is not implemented on the backend.
   * See login() above.
   * @returns {Promise<Object>}
   */
  async register() {
    throw new Error('Email/password registration is not available on this server.');
  },

  /**
   * Redirects the browser to the backend's Google OAuth consent flow
   * (GET /api/auth/google/login).
   */
  loginWithGoogle() {
    const path = (CONFIG.ENDPOINTS.AUTH && CONFIG.ENDPOINTS.AUTH.GOOGLE_LOGIN) || '/auth/google/login';
    window.location.href = `${CONFIG.API_BASE_URL}${path}`;
  },

  /**
   * Picks up the ?oauth_token=&oauth_user= params that
   * GET /api/auth/google/callback redirects back with, stores the
   * session, and strips them from the URL.
   * @returns {boolean} true if an OAuth session was found and stored.
   */
  completeOAuthLogin() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('oauth_token');
    const userB64 = params.get('oauth_user');
    if (!token || !userB64) return false;

    // params.get() already percent-decodes; userB64 is now the plain base64
    // string the backend produced, ready for atob() directly.
    let user = null;
    try {
      user = JSON.parse(atob(userB64));
    } catch {
      user = null; // don't let a bad/legacy user payload block storing the token
    }
    this.setSession(token, user);

    // Cosmetic URL cleanup — must never affect whether login succeeded above.
    try {
      params.delete('oauth_token');
      params.delete('oauth_user');
      const cleanQuery = params.toString();
      const cleanUrl = window.location.pathname + (cleanQuery ? `?${cleanQuery}` : '');
      window.history.replaceState({}, document.title, cleanUrl);
    } catch {
      /* non-fatal */
    }

    return true;
  },

  /**
   * Fetches the authenticated user's profile from GET /api/auth/me.
   * @returns {Promise<Object>}
   */
  async getMe() {
    const endpoint = `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.ME}`;
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || 'Could not load profile.');
    }
    this.setSession(null, result.data);
    return result.data;
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

// ---------------------------------------------------------------------------
// Page wiring for login.html / register.html.
// Neither page has an inline <script> block or onclick/onsubmit attributes,
// so all element hookup happens here via ids that already exist in the markup.
// Each wireXxxPage() is a no-op if its page's root element isn't present.
// ---------------------------------------------------------------------------

function _authShowAlert(msg) {
  const box = document.getElementById('authAlert');
  const text = document.getElementById('authAlertText');
  if (!box || !text) return;
  text.textContent = msg;
  box.classList.add('show');
}

function _authHideAlert() {
  const box = document.getElementById('authAlert');
  if (box) box.classList.remove('show');
}

function _wirePasswordToggle() {
  const toggleBtn = document.getElementById('togglePasswordBtn');
  const input = document.getElementById('password');
  const icon = document.getElementById('togglePasswordIcon');
  if (!toggleBtn || !input) return;
  toggleBtn.addEventListener('click', () => {
    const nowHidden = input.type === 'password';
    input.type = nowHidden ? 'text' : 'password';
    if (icon) {
      icon.classList.toggle('fa-eye', !nowHidden);
      icon.classList.toggle('fa-eye-slash', nowHidden);
    }
  });
}

function _wireLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  if (Auth.isAuthenticated()) {
    window.location.href = CONFIG.ROUTES.DASHBOARD;
    return;
  }

  _wirePasswordToggle();

  const forgotLink = document.getElementById('forgotPasswordLink');
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Password reset requests route through your administrator.');
    });
  }

  const googleBtn = document.getElementById('btnGoogleSignIn');
  if (googleBtn) {
    googleBtn.addEventListener('click', () => Auth.loginWithGoogle());
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    _authHideAlert();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('submitBtn');
    const spinner = document.getElementById('btnSpinner');
    const btnText = document.getElementById('btnText');

    if (!email || !password) {
      _authShowAlert('Please fill in both email and password.');
      return;
    }

    submitBtn.disabled = true;
    spinner.classList.remove('d-none');
    const originalText = btnText.textContent;
    btnText.textContent = 'Verifying...';

    try {
      await Auth.login(email, password);
      const redirect = new URLSearchParams(window.location.search).get('redirect') || CONFIG.ROUTES.DASHBOARD;
      window.location.href = redirect;
    } catch (err) {
      _authShowAlert(err.message || 'Authentication failed. Check your credentials.');
    } finally {
      submitBtn.disabled = false;
      spinner.classList.add('d-none');
      btnText.textContent = originalText;
    }
  });
}

function _wireRegisterPage() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  if (Auth.isAuthenticated()) {
    window.location.href = CONFIG.ROUTES.DASHBOARD;
    return;
  }

  _wirePasswordToggle();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    _authHideAlert();

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const termsAgreed = document.getElementById('termsAgreement').checked;
    const submitBtn = document.getElementById('submitBtn');
    const spinner = document.getElementById('btnSpinner');
    const btnText = document.getElementById('btnText');

    if (!fullName || !email || !password || !confirmPassword) {
      _authShowAlert('Please fill in all registration fields.');
      return;
    }
    if (password.length < 8) {
      _authShowAlert('Passphrase must contain at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      _authShowAlert('Passphrases do not match.');
      return;
    }
    if (!termsAgreed) {
      _authShowAlert('You must agree to the data governance and telemetry policies to proceed.');
      return;
    }

    submitBtn.disabled = true;
    spinner.classList.remove('d-none');
    const originalText = btnText.textContent;
    btnText.textContent = 'Provisioning...';

    try {
      await Auth.register(fullName, email, password);
      window.location.href = `${CONFIG.ROUTES.LOGIN}?registered=true`;
    } catch (err) {
      _authShowAlert(err.message || 'Registration failed. Try a different email address.');
    } finally {
      submitBtn.disabled = false;
      spinner.classList.add('d-none');
      btnText.textContent = originalText;
    }
  });
}

// Complete Google OAuth immediately if we've just been redirected back with
// ?oauth_token=&oauth_user= — this script runs at the end of <body>, so the
// query string and page elements already exist; no need to wait for
// DOMContentLoaded before acting on it.
if (Auth.completeOAuthLogin()) {
  const redirect = new URLSearchParams(window.location.search).get('redirect') || CONFIG.ROUTES.DASHBOARD;
  window.location.href = redirect;
} else {
  _wireLoginPage();
  _wireRegisterPage();
}