// js/app.js — Shared utility functions for all pages

const App = {
  // Show a toast notification at the top of the screen
  toast(msg, duration) {
    duration = duration || 2000;
    var el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(function () {
      el.classList.remove('show');
    }, duration);
  },

  // Copy text to clipboard, with fallback for older browsers
  copy: function (text) {
    var self = this;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () {
        self.toast('已复制到剪贴板');
        return true;
      }).catch(function () {
        return self._fallbackCopy(text);
      });
    }
    return Promise.resolve(self._fallbackCopy(text));
  },

  // Fallback copy using textarea
  _fallbackCopy: function (text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
    this.toast('已复制到剪贴板');
    return true;
  },

  // Open video link in new tab and auto-copy password
  openVideo: function (url, password) {
    window.open(url, '_blank');
    if (password) {
      var self = this;
      setTimeout(function () { self.copy(password); }, 400);
      this.toast('密码已自动复制，去粘贴吧');
    }
  },

  // Get a URL query parameter by name
  getParam: function (name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  },

  // Generate a simple device fingerprint (no canvas needed)
  fingerprint: function () {
    var parts = [
      navigator.userAgent,
      navigator.language || '',
      screen.width + 'x' + screen.height,
      screen.colorDepth || '',
      new Date().getTimezoneOffset()
    ];
    return this._hash(parts.join('|||'));
  },

  // Simple string hash (djb2)
  _hash: function (str) {
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  },

  // Page initialization: apply theme + guard auth
  init: function () {
    Theme.init();
    var page = window.location.pathname.split('/').pop();

    // Pages that allow preview (show content but limited):
    //   home.html, course.html, trial.html
    // Pages that require FULL activation:
    //   downloads.html, method.html, profile.html, admin

    if (page && page !== 'index.html' && page !== '') {
      // Admin panel (has own auth, hidden path)
      if (window.location.pathname.indexOf('/_houtai') !== -1) return;

      // Fully restricted: require activation (preview not enough)
      var restrictedPages = ['downloads.html', 'downloads', 'method.html', 'method', 'profile.html', 'profile'];
      if (restrictedPages.indexOf(page) !== -1) {
        if (!Auth.isActivated()) {
          if (Auth.isPreview()) {
            App.toast('预览模式下无法访问，请先激活');
            setTimeout(function() { window.location.href = 'trial.html'; }, 1000);
          } else {
            window.location.href = 'index.html';
          }
          return false;
        }
      }

      // Course page: preview OK, but content limited by course.html itself
      // Home page: preview OK (already shows preview banner)
      // Trial page: always OK
    }
  }
};

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', function () {
  App.init();
});
