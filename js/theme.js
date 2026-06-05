// js/theme.js — Theme/skin switching (4 modes: default, light, dark, auto)
const Theme = {
  // Available theme names
  THEMES: ['default', 'light', 'dark', 'auto'],

  // System dark mode media query
  _mediaQuery: null,

  // Initialize: load saved theme or default
  init() {
    var saved = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.THEME) || 'default';
    this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    var self = this;
    this._mediaQuery.addEventListener('change', function() {
      if (self.current() === 'auto') self.apply('auto');
    });
    this.apply(saved);
  },

  // Apply a theme by name
  apply(name) {
    if (name === 'auto') {
      // Follow system preference
      var isDark = this._mediaQuery && this._mediaQuery.matches;
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else if (name === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', name);
    }
    localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.THEME, name);
  },

  // Get effective theme (resolves 'auto' to actual value)
  effective() {
    var name = this.current();
    if (name === 'auto') {
      return this._mediaQuery && this._mediaQuery.matches ? 'dark' : 'light';
    }
    return name;
  },

  // Get current theme name (stored value, not resolved)
  current() {
    return localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.THEME) || 'default';
  }
};
