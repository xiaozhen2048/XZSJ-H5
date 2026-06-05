// js/progress.js — Learning progress tracking (localStorage-based)
const Progress = {
  STORAGE_KEY: 'xzst_progress',

  // Get all completed course IDs as an object { courseId: timestamp }
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || {};
    } catch(e) {
      return {};
    }
  },

  // Check if a course is completed
  isDone(courseId) {
    return !!this.getAll()[courseId];
  },

  // Toggle completion for a course
  toggle(courseId) {
    var data = this.getAll();
    if (data[courseId]) {
      delete data[courseId];
    } else {
      data[courseId] = Date.now();
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    return !!data[courseId];
  },

  // Get progress for a specific category (by its courses list)
  getCategoryProgress(courses) {
    if (!courses || courses.length === 0) return { done: 0, total: 0, percent: 0 };
    var done = 0;
    for (var i = 0; i < courses.length; i++) {
      if (this.isDone(courses[i].id || courses[i]._id)) done++;
    }
    return { done: done, total: courses.length, percent: Math.round(done / courses.length * 100) };
  },

  // Get overall progress across all categories
  getOverallProgress(categories) {
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
        if (this.isDone(courses[c].id || courses[c]._id)) done++;
      }
    }
    return { done: done, total: total, percent: total > 0 ? Math.round(done / total * 100) : 0 };
  }
};
