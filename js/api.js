// js/api.js — API request wrapper with all endpoints
const API = {
  async request(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);

    // Check activation token (localStorage) and admin token (sessionStorage)
    const token = Auth.getToken() || sessionStorage.getItem('xzst_admin_token');
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;

    const res = await fetch(window.APP_CONFIG.API_BASE + path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '请求失败');
    return data;
  },

  // Public: activate with code
  activate(code) {
    return this.request('POST', '/api/activate', { code });
  },

  // Get courses: static file for preview (no passwords), API for activated (with passwords)
  async getCourses() {
    // Activated users: use API to get full data with passwords
    if (Auth.isActivated()) {
      return this.request('GET', '/api/courses');
    }
    // Preview / public: use static file (passwords already stripped)
    try {
      const res = await fetch('/data/courses.json');
      if (res.ok) return res.json();
    } catch(e) { /* fallback to API which will strip passwords */ }
    return this.request('GET', '/api/courses');
  },

  // Admin: login with password
  adminLogin(password) {
    return this.request('POST', '/api/admin/login', { password });
  },

  // Admin: get courses
  adminGetCourses() {
    return this.request('GET', '/api/admin/courses');
  },

  // Admin: save (create or update) a course
  adminSaveCourse(course, groupName) {
    return this.request('POST', '/api/admin/courses/save', { course, groupName: groupName || course.groupName || '' });
  },

  // Admin: delete a course by id
  adminDeleteCourse(id) {
    return this.request('POST', '/api/admin/courses/delete', { id });
  },

  // Admin: generate N activation codes
  adminGenerateCodes(count) {
    return this.request('POST', '/api/admin/codes/generate', { count });
  },

  // Admin: list all activation codes
  adminListCodes() {
    return this.request('GET', '/api/admin/codes');
  },

  // Admin: ban/unban a code
  adminBanCode(code) {
    return this.request('POST', '/api/admin/codes/ban', { code });
  },

  // Admin: reorder courses
  adminReorderCourses(orders) {
    return this.request('POST', '/api/admin/courses/reorder', { orders });
  },

  // User: submit feedback
  submitFeedback(text) {
    return this.request('POST', '/api/feedback', { text });
  },

  // Admin: list feedback
  adminListFeedback() {
    return this.request('GET', '/api/admin/feedback');
  }
};
