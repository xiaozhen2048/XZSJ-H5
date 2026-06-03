// js/auth.js — Activation & login state management
const Auth = {
  // Check if user has a valid activation token
  isActivated() {
    try {
      const data = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.ACTIVATION);
      return data && JSON.parse(data).token;
    } catch (e) {
      return false;
    }
  },

  // Check if user is in preview mode (session only, overridden by activation)
  isPreview() {
    if (this.isActivated()) return false;
    return sessionStorage.getItem('xzst_preview') === '1';
  },

  // Enter preview mode (no activation needed, no links/passwords shown)
  enterPreview() {
    sessionStorage.setItem('xzst_preview', '1');
  },

  // Get the stored auth token
  getToken() {
    try {
      const data = JSON.parse(
        localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.ACTIVATION) || '{}'
      );
      return data.token || null;
    } catch (e) {
      return null;
    }
  },

  // Get user's activation code
  getCode() {
    try {
      const data = JSON.parse(
        localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.ACTIVATION) || '{}'
      );
      return data.code || '';
    } catch (e) {
      return '';
    }
  },

  // Save activation data after successful verification
  saveActivation(data) {
    localStorage.setItem(
      window.APP_CONFIG.STORAGE_KEYS.ACTIVATION,
      JSON.stringify({
        code: data.code,
        token: data.token,
        activatedAt: data.activatedAt || new Date().toISOString(),
      })
    );
  },

  // Logout: clear stored data and redirect to lock screen
  logout() {
    localStorage.removeItem(window.APP_CONFIG.STORAGE_KEYS.ACTIVATION);
    sessionStorage.removeItem('xzst_preview');
    window.location.href = 'index.html';
  },

  // Guard: redirect to lock screen if not activated or in preview mode
  requireAuth() {
    if (!this.isActivated() && !this.isPreview()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }
};
