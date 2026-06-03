const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const COURSES_FILE = path.join(DATA_DIR, 'courses.json');
const ACTIVATIONS_FILE = path.join(DATA_DIR, 'activations.json');

function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e.message);
    return null;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error(`Error writing ${filePath}:`, e.message);
    return false;
  }
}

// === Public Routes ===

app.get('/api/courses', (req, res) => {
  const data = readJSON(COURSES_FILE);
  res.json(data || { categories: [] });
});

// POST /api/activate — Validate an activation code
app.post('/api/activate', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: '请输入激活码' });

  const data = readJSON(ACTIVATIONS_FILE) || { codes: {} };
  const normalized = code.trim().toUpperCase();
  const record = data.codes[normalized];

  if (!record) return res.status(404).json({ error: '激活码无效，请联系博主获取' });
  if (record.banned) return res.status(403).json({ error: '该激活码已被封禁，请联系博主' });

  const deviceFingerprint = req.body.fingerprint || req.ip || 'unknown';

  // First activation
  if (!record.activated) {
    record.activated = true;
    record.activatedAt = new Date().toISOString();
    record.fingerprint = deviceFingerprint;
    record.ips = [req.ip];
    const token = crypto.randomBytes(32).toString('hex');
    record.token = token;
    writeJSON(ACTIVATIONS_FILE, data);
    return res.json({ code: normalized, token, activatedAt: record.activatedAt });
  }

  // Already activated — same device
  if (record.fingerprint === deviceFingerprint) {
    if (!record.token) { record.token = crypto.randomBytes(32).toString('hex'); writeJSON(ACTIVATIONS_FILE, data); }
    return res.json({ code: normalized, token: record.token, activatedAt: record.activatedAt });
  }

  // Different device
  res.status(403).json({ error: '该激活码已在其他设备使用，如需换绑请联系博主' });
});

// === Admin Routes ===

// POST /api/admin/login — Admin password check
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const data = readJSON(ACTIVATIONS_FILE) || {};
  const adminPassword = data.adminPassword || 'admin123';
  if (password !== adminPassword) return res.status(401).json({ error: '密码错误' });
  const token = crypto.randomBytes(32).toString('hex');
  data.adminToken = token;
  writeJSON(ACTIVATIONS_FILE, data);
  res.json({ token });
});

// Admin auth middleware
function adminAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const data = readJSON(ACTIVATIONS_FILE) || {};
  if (!token || token !== data.adminToken) return res.status(401).json({ error: '未授权' });
  next();
}

// GET /api/admin/courses — returns courses data
app.get('/api/admin/courses', adminAuth, (req, res) => {
  const data = readJSON(COURSES_FILE) || { categories: [] };
  res.json(data);
});

// POST /api/admin/courses/save — upsert course into correct category
app.post('/api/admin/courses/save', adminAuth, (req, res) => {
  const { course } = req.body;
  if (!course || !course.id || !course.categoryId) {
    return res.status(400).json({ error: '缺少课程信息' });
  }

  const data = readJSON(COURSES_FILE) || { categories: [] };
  let category = data.categories.find(c => c.id === course.categoryId);
  if (!category) {
    category = { id: course.categoryId, name: course.categoryId, courses: [] };
    data.categories.push(category);
  }
  if (!category.courses) category.courses = [];

  const idx = category.courses.findIndex(c => c.id === course.id);
  if (idx !== -1) {
    category.courses[idx] = course;
  } else {
    category.courses.push(course);
  }

  writeJSON(COURSES_FILE, data);
  res.json({ success: true, course });
});

// POST /api/admin/courses/delete — remove course from all categories
app.post('/api/admin/courses/delete', adminAuth, (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: '缺少课程ID' });

  const data = readJSON(COURSES_FILE) || { categories: [] };
  for (const category of data.categories) {
    if (category.courses) {
      category.courses = category.courses.filter(c => c.id !== id);
    }
  }

  writeJSON(COURSES_FILE, data);
  res.json({ success: true });
});

// POST /api/admin/codes/generate — generate N activation codes
app.post('/api/admin/codes/generate', adminAuth, (req, res) => {
  const { count } = req.body;
  if (!count || count < 1) return res.status(400).json({ error: '请输入生成数量' });

  const data = readJSON(ACTIVATIONS_FILE) || { codes: {} };
  if (!data.codes) data.codes = {};

  const generated = [];
  for (let i = 0; i < count; i++) {
    let code;
    do {
      code = 'XZST-' +
        crypto.randomBytes(2).toString('hex').toUpperCase().slice(0, 4) + '-' +
        crypto.randomBytes(2).toString('hex').toUpperCase().slice(0, 4);
    } while (data.codes[code]);

    data.codes[code] = {
      code,
      activated: false,
      banned: false,
      createdAt: new Date().toISOString()
    };
    generated.push(code);
  }

  writeJSON(ACTIVATIONS_FILE, data);
  res.json({ success: true, codes: generated });
});

// GET /api/admin/codes — returns all codes with status
app.get('/api/admin/codes', adminAuth, (req, res) => {
  const data = readJSON(ACTIVATIONS_FILE) || { codes: {} };
  const codes = data.codes || {};
  const list = Object.entries(codes).map(([code, info]) => ({
    code,
    activated: info.activated || false,
    banned: info.banned || false,
    activatedAt: info.activatedAt || null,
    fingerprint: info.fingerprint || null,
    ips: info.ips || [],
    createdAt: info.createdAt || null
  }));
  res.json({ codes: list });
});

// POST /api/admin/codes/ban — toggle banned flag
app.post('/api/admin/codes/ban', adminAuth, (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: '请输入激活码' });

  const data = readJSON(ACTIVATIONS_FILE) || { codes: {} };
  const record = data.codes[code];

  if (!record) return res.status(404).json({ error: '激活码不存在' });

  record.banned = !record.banned;
  writeJSON(ACTIVATIONS_FILE, data);
  res.json({ success: true, code, banned: record.banned });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
