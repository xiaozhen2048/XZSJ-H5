// js/progress.js — Per-user progress, server-synced with localStorage cache
const Progress = {
  _cache: null,
  _loading: false,
  _dirty: false,

  // Fetch progress from server
  async _fetch() {
    if (!Auth.isActivated()) return {};
    try {
      const res = await fetch(window.APP_CONFIG.API_BASE + '/api/progress', {
        headers: { 'Authorization': 'Bearer ' + Auth.getToken() }
      });
      if (!res.ok) return {};
      const data = await res.json();
      return data || {};
    } catch(e) {
      return {};
    }
  },

  // Save progress to server
  async _save(data) {
    if (!Auth.isActivated()) return;
    try {
      await fetch(window.APP_CONFIG.API_BASE + '/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + Auth.getToken()
        },
        body: JSON.stringify({ courses: data })
      });
    } catch(e) {}
  },

  // Get local cache key
  _cacheKey() {
    var code = Auth.getCode();
    return code ? 'xzst_progress_' + code : '';
  },

  // Load from localStorage cache
  _loadCache() {
    if (this._cache) return this._cache;
    var key = this._cacheKey();
    if (!key) { this._cache = {}; return this._cache; }
    try {
      this._cache = JSON.parse(localStorage.getItem(key)) || {};
    } catch(e) {
      this._cache = {};
    }
    return this._cache;
  },

  // Save to localStorage cache + queue server sync
  _saveCache(data) {
    this._cache = data;
    this._dirty = true;
    var key = this._cacheKey();
    if (key) localStorage.setItem(key, JSON.stringify(data));
    // Debounced server sync
    clearTimeout(this._syncTimer);
    var self = this;
    this._syncTimer = setTimeout(function() {
      self._save(data);
      self._dirty = false;
    }, 500);
  },

  // Init: load from cache, sync from server in background
  init() {
    var self = this;
    this._loadCache();
    if (Auth.isActivated()) {
      this._fetch().then(function(serverData) {
        // Merge server data with local (server wins on conflict)
        var local = self._loadCache();
        var merged = {};
        var localKeys = Object.keys(local);
        var serverKeys = Object.keys(serverData);
        // Server data takes priority, but keep local-only entries
        for (var i = 0; i < localKeys.length; i++) {
          merged[localKeys[i]] = local[localKeys[i]];
        }
        for (var i = 0; i < serverKeys.length; i++) {
          merged[serverKeys[i]] = serverData[serverKeys[i]];
        }
        self._saveCache(merged);
        self._save(merged); // push merged to server
      }).catch(function() {});
    }
  },

  // Get all completed course IDs
  getAll() {
    return this._loadCache();
  },

  // Check if a course is completed
  isDone(courseId) {
    if (!courseId) return false;
    return !!this.getAll()[courseId];
  },

  // Toggle completion
  toggle(courseId) {
    if (!courseId) return false;
    var data = this.getAll();
    if (data[courseId]) {
      delete data[courseId];
    } else {
      data[courseId] = Date.now();
    }
    this._saveCache(data);
    return !!data[courseId];
  },

  // Get category progress
  getCategoryProgress(courses) {
    if (!courses || courses.length === 0) return { done: 0, total: 0, percent: 0 };
    var all = this.getAll();
    var done = 0;
    for (var i = 0; i < courses.length; i++) {
      var id = courses[i].id || courses[i]._id;
      if (id && all[id]) done++;
    }
    return { done: done, total: courses.length, percent: Math.round(done / courses.length * 100) };
  },

  // Clear progress for current user
  clear() {
    var key = this._cacheKey();
    if (key) localStorage.removeItem(key);
    this._cache = {};
    this._dirty = false;
    clearTimeout(this._syncTimer);
  }
};

// Auto-init when script loads
Progress.init();
