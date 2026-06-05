// js/theme.js — Theme system (Morandi only)
const Theme = {
  THEMES: ['default'],

  init() {
    this.apply('default');
  },

  apply(name) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.THEME, 'default');
  },

  effective() {
    return 'default';
  },

  current() {
    return 'default';
  }
};
