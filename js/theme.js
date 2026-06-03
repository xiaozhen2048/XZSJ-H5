// js/theme.js — Theme/skin switching (3 themes: default, light, dark)
const Theme = {
  // Available theme names
  THEMES: ['default', 'light', 'dark'],

  // Initialize: load saved theme or default
  init() {
    const saved = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.THEME) || 'default';
    this.apply(saved);
  },

  // Apply a theme by name. 'default' removes data-theme attribute.
  apply(name) {
    if (name === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', name);
    }
    localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.THEME, name);
  },

  // Get current theme name
  current() {
    return localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.THEME) || 'default';
  }
};
