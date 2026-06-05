// js/progress.js — Per-user learning progress (localStorage, keyed by activation code)
const Progress = {
  // Get storage key for current user (empty if not activated)
  _getKey() {
    var code = Auth.getCode();
    if (!code) return '';
    return 'xzst_progress_' + code;
  },

  // Get all completed course IDs as an object { courseId: timestamp }
  getAll() {
    var key = this._getKey();
    if (!key) return {};
    try {
      return JSON.parse(localStorage.getItem(key)) || {};
    } catch(e) {
      return {};
    }
  },

  // Check if a course is completed
  isDone(courseId) {
    if (!courseId) return false;
    return !!this.getAll()[courseId];
  },

  // Toggle completion for a course
  toggle(courseId) {
    var key = this._getKey();
    if (!key || !courseId) return false;
    var data = this.getAll();
    if (data[courseId]) {
      delete data[courseId];
    } else {
      data[courseId] = Date.now();
    }
    localStorage.setItem(key, JSON.stringify(data));
    return !!data[courseId];
  },

  // Get progress for a specific category
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

  // Get overall progress across all categories
  getOverallProgress(categories) {
    var all = this.getAll();
    var done = 0, total = 0;
    for (var i = 0; i < categories.length; i++) {
      var cat = categories[i];
      var courses = [];
      if (cat.groups) {
        for (var g = 0; g < cat.groups.length; g++) {
          courses = courses.concat(cat.groups[g].courses || []);
        }
      } else {
        courses = cat.courses || [];
      }
      for (var c = 0; c < courses.length; c++) {
        total++;
        var id = courses[c].id || courses[c]._id;
        if (id && all[id]) done++;
      }
    }
    return { done: done, total: total, percent: total > 0 ? Math.round(done / total * 100) : 0 };
  },

  // Clear progress for current user
  clear() {
    var key = this._getKey();
    if (key) localStorage.removeItem(key);
  }
};
