# 行测刷题班 H5 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建移动优先的行测课程 H5 页面，含激活码访问控制、莫兰迪温柔风 UI、三皮肤切换、后台管理。

**Architecture:** 纯前端 H5 (Cloudflare Pages) + 简易 Node.js/Express 后端 (Railway)。前端多页面架构，共享 CSS/JS；后端 JSON 文件存储，提供激活验证、课程数据、管理接口。

**Tech Stack:** HTML5 + CSS3 (custom properties) + vanilla JS (ES6) / Node.js + Express / JSON file DB

**Design System:** (from ui-ux-pro-max)
- Style: Nature Distilled × Soft UI Evolution — muted earthy, warm tones
- Palette: Morandi — 灰粉 #B8A9B4 / 灰紫 #C5BAB0 / 暖米 #F5F0EB
- Cards: Bento-style, rounded 14px, soft shadow
- Typography: system Chinese fonts (PingFang SC / Microsoft YaHei), 16px body min
- Icons: SVG only (Lucide-style), no emojis
- Touch: 44px min targets, 8px spacing, 150-300ms transitions

---

## File Structure

```
/Users/wb/Downloads/HTML/
├── index.html              # Lock/activation page
├── home.html               # Home (subject cards)
├── course.html             # Course list + video capsules
├── downloads.html          # PDF downloads
├── method.html             # Learning method (static)
├── profile.html            # My page (theme, logout)
├── admin.html              # Admin management
├── css/
│   └── style.css           # All styles
├── js/
│   ├── config.js
│   ├── api.js
│   ├── auth.js
│   ├── theme.js
│   └── app.js
├── assets/
│   └── icons.svg
├── backend/
│   ├── package.json
│   ├── server.js
│   └── data/
│       ├── courses.json
│       └── activations.json
└── .gitignore
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `backend/package.json`, `backend/server.js` (skeleton)
- Create: `backend/data/courses.json`, `backend/data/activations.json`
- Create: `.gitignore`

- [ ] **Step 1: Initialize backend**

```bash
mkdir -p /Users/wb/Downloads/HTML/backend/data
mkdir -p /Users/wb/Downloads/HTML/css
mkdir -p /Users/wb/Downloads/HTML/js
mkdir -p /Users/wb/Downloads/HTML/assets
cd /Users/wb/Downloads/HTML/backend && npm init -y && npm install express cors
```

- [ ] **Step 2: Write backend/package.json**

Confirm it contains:
```json
{
  "name": "xingce-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.21.0"
  }
}
```

Run: `cd /Users/wb/Downloads/HTML/backend && npm install`

- [ ] **Step 3: Write backend/server.js skeleton**

```javascript
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
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// === Routes (to be added in Task 10) ===

app.get('/api/courses', (req, res) => {
  const data = readJSON(COURSES_FILE);
  res.json(data || { categories: [] });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

Run: `cd /Users/wb/Downloads/HTML/backend && node server.js`
Expected: `Server running on port 3000` — then Ctrl+C.

- [ ] **Step 4: Write initial data files**

`backend/data/courses.json`:
```json
{ "categories": [] }
```

`backend/data/activations.json`:
```json
{ "codes": {}, "adminPassword": "admin123" }
```

- [ ] **Step 5: Write .gitignore**

```
node_modules/
backend/node_modules/
.DS_Store
.superpowers/
```

- [ ] **Step 6: Commit**

```bash
cd /Users/wb/Downloads/HTML && git init && git add -A && git commit -m "chore: project scaffolding"
```

---

### Task 2: CSS Design System — Variables, Themes, Base & Components

**Files:**
- Create: `css/style.css`

Write the complete CSS file at `css/style.css`. This is a single large file organized into four sections:

**(A) CSS Custom Properties (3 themes: default Morandi, light, dark)**

```css
/* ========================================
   CSS Custom Properties — 莫兰迪默认
   ======================================== */
:root {
  --color-primary: #B8A9B4;
  --color-primary-light: #D4C5C7;
  --color-primary-dark: #9B8E97;
  --color-accent: #C5BAB0;
  --color-accent-light: #D9CFC6;
  --color-bg: #F5F0EB;
  --color-surface: #FFFFFF;
  --color-text: #3D3535;
  --color-text-secondary: #8C7E7E;
  --color-text-muted: #B0A5A5;
  --color-border: #E5DCD5;
  --color-shadow: rgba(160, 140, 130, 0.08);
  --color-success: #8FA88F;
  --color-danger: #C4908A;
  --color-tag-bg: #F0EAE4;
  --color-tag-text: #8C7E7E;
  --gradient-header: linear-gradient(135deg, #B8A9B4 0%, #C5BAB0 100%);
  --font-heading: "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif;
  --font-body: "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.8125rem;
  --font-size-base: 1rem;
  --font-size-md: 1.0625rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --line-height-body: 1.6;
  --line-height-heading: 1.3;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 20px;
  --space-2xl: 24px;
  --space-3xl: 32px;
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-full: 9999px;
  --touch-target: 44px;
  --max-width: 480px;
  --shadow-card: 0 2px 12px var(--color-shadow);
  --shadow-card-hover: 0 4px 20px rgba(160, 140, 130, 0.14);
  --shadow-button: 0 2px 8px rgba(184, 169, 180, 0.25);
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 350ms ease;
}

[data-theme="light"] {
  --color-bg: #FAFAFA; --color-surface: #FFFFFF;
  --color-text: #2C2C2C; --color-text-secondary: #6B6B6B;
  --color-text-muted: #999; --color-border: #E8E8E8;
  --color-shadow: rgba(0,0,0,0.05);
  --color-primary: #8899AA; --color-primary-light: #BBC8D4;
  --color-primary-dark: #667788; --color-accent: #A0B0BB;
  --color-accent-light: #C8D4DB; --color-tag-bg: #F0F2F5;
  --color-tag-text: #6B7B88;
  --gradient-header: linear-gradient(135deg, #8899AA 0%, #A0B0BB 100%);
  --shadow-card: 0 1px 8px rgba(0,0,0,0.04);
  --shadow-card-hover: 0 3px 16px rgba(0,0,0,0.08);
  --shadow-button: 0 2px 8px rgba(136,153,170,0.2);
}

[data-theme="dark"] {
  --color-bg: #1E1B1F; --color-surface: #2A262B;
  --color-text: #E0DCE0; --color-text-secondary: #A8A0A8;
  --color-text-muted: #6E666E; --color-border: #3A343B;
  --color-shadow: rgba(0,0,0,0.2);
  --color-primary: #9B8E97; --color-primary-light: #6E626B;
  --color-primary-dark: #B8A9B4; --color-accent: #8C827A;
  --color-accent-light: #5E5650; --color-tag-bg: #332E33;
  --color-tag-text: #A8A0A8;
  --gradient-header: linear-gradient(135deg, #3A343B 0%, #2E2A2E 100%);
  --shadow-card: 0 2px 12px rgba(0,0,0,0.3);
  --shadow-card-hover: 0 4px 24px rgba(0,0,0,0.4);
  --shadow-button: 0 2px 8px rgba(155,142,151,0.2);
}
```

**(B) Reset & Base**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; -webkit-text-size-adjust: 100%; -webkit-tap-highlight-color: transparent; overscroll-behavior: contain; }
body {
  font-family: var(--font-body); font-size: var(--font-size-base);
  color: var(--color-text); background: var(--color-bg);
  -webkit-font-smoothing: antialiased; line-height: var(--line-height-body);
  max-width: var(--max-width); margin: 0 auto; min-height: 100dvh;
}
a { color: inherit; text-decoration: none; }
button, input, textarea, select { font: inherit; color: inherit; border: none; outline: none; background: none; }
button { cursor: pointer; -webkit-appearance: none; }
img, svg { display: block; max-width: 100%; }
ul, ol { list-style: none; }
:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; border-radius: 4px; }
::selection { background: var(--color-primary-light); color: var(--color-text); }
```

**(C) Components** (header-bar, page-header, subject-card, quick-actions, course-card, tag, video-capsule, form-input, btn, toast, lock-screen, skeleton, modal-overlay, admin-table — all matching the design spec)

**(D) Responsive** (640px tablet: 2-col grid, 1024px desktop: 4-col grid, centered max-width 960px)

Full CSS content available in `css/style.css`. Commit after writing.

- [ ] **Commit:**

```bash
git add css/style.css && git commit -m "feat: add CSS design system with 3 themes and components"
```

---

### Task 3: SVG Icon Sprite

**Files:**
- Create: `assets/icons.svg`

Write `assets/icons.svg` with `<symbol>` definitions for: `icon-arrow-left`, `icon-chevron-right`, `icon-chevron-down`, `icon-play`, `icon-copy`, `icon-lock`, `icon-eye`, `icon-math`, `icon-chart`, `icon-brain`, `icon-mic`, `icon-file`, `icon-book`, `icon-user`, `icon-edit`, `icon-trash`, `icon-plus`, `icon-settings`, `icon-download`, `icon-external`, `icon-check`, `icon-x`, `icon-sun`, `icon-moon`.

All icons use `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.

Full SVG in `assets/icons.svg`. Commit after writing.

- [ ] **Commit:**

```bash
git add assets/icons.svg && git commit -m "feat: add SVG icon sprite (24 icons)"
```

---

### Task 4: JavaScript Utilities

**Files:**
- Create: `js/config.js`, `js/api.js`, `js/auth.js`, `js/theme.js`, `js/app.js`

**js/config.js** — Global config:
```javascript
window.APP_CONFIG = {
  API_BASE: 'http://localhost:3000',
  CODE_PREFIX: 'XZST',
  STORAGE_KEYS: {
    TOKEN: 'xzst_token',
    ACTIVATION: 'xzst_activation',
    THEME: 'xzst_theme',
  }
};
```

**js/api.js** — Fetch wrapper with all endpoints:
```javascript
const API = {
  async request(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const token = Auth.getToken();
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(APP_CONFIG.API_BASE + path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '请求失败');
    return data;
  },
  activate(code) { return API.request('POST', '/api/activate', { code }); },
  getCourses() { return API.request('GET', '/api/courses'); },
  adminLogin(password) { return API.request('POST', '/api/admin/login', { password }); },
  adminGetCourses() { return API.request('GET', '/api/admin/courses'); },
  adminSaveCourse(course) { return API.request('POST', '/api/admin/courses/save', { course }); },
  adminDeleteCourse(id) { return API.request('POST', '/api/admin/courses/delete', { id }); },
  adminGenerateCodes(count) { return API.request('POST', '/api/admin/codes/generate', { count }); },
  adminListCodes() { return API.request('GET', '/api/admin/codes'); },
  adminBanCode(code) { return API.request('POST', '/api/admin/codes/ban', { code }); }
};
```

**js/auth.js** — Auth state:
```javascript
const Auth = {
  isActivated() {
    const d = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.ACTIVATION);
    try { return d && JSON.parse(d).token; } catch(e) { return false; }
  },
  isPreview() { return sessionStorage.getItem('xzst_preview') === '1'; },
  enterPreview() { sessionStorage.setItem('xzst_preview', '1'); },
  getToken() {
    try { return JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.ACTIVATION) || '{}').token || null; } catch(e) { return null; }
  },
  saveActivation(d) { localStorage.setItem(APP_CONFIG.STORAGE_KEYS.ACTIVATION, JSON.stringify(d)); },
  logout() { localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.ACTIVATION); sessionStorage.removeItem('xzst_preview'); window.location.href = 'index.html'; },
  requireAuth() { if (!Auth.isActivated() && !Auth.isPreview()) { window.location.href = 'index.html'; return false; } return true; }
};
```

**js/theme.js** — Theme switching:
```javascript
const Theme = {
  THEMES: ['default', 'light', 'dark'],
  init() { this.apply(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.THEME) || 'default'); },
  apply(name) {
    if (name === 'default') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', name);
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.THEME, name);
  },
  current() { return localStorage.getItem(APP_CONFIG.STORAGE_KEYS.THEME) || 'default'; }
};
```

**js/app.js** — Shared helpers:
```javascript
const App = {
  toast(msg, dur = 2000) {
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('show');
    clearTimeout(el._timer); el._timer = setTimeout(() => el.classList.remove('show'), dur);
  },
  async copy(text) {
    try { await navigator.clipboard.writeText(text); App.toast('已复制到剪贴板'); }
    catch(e) {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      App.toast('已复制到剪贴板');
    }
  },
  openVideo(url, password) {
    window.open(url, '_blank');
    if (password) { setTimeout(() => App.copy(password), 500); App.toast('密码已自动复制，去粘贴吧'); }
  },
  getParam(name) { return new URLSearchParams(window.location.search).get(name); },
  init() {
    Theme.init();
    const page = window.location.pathname.split('/').pop();
    if (page !== 'index.html' && page !== '' && page !== 'admin.html') Auth.requireAuth();
  }
};
document.addEventListener('DOMContentLoaded', () => App.init());
```

**Full versions** of each file are written to their respective paths.

- [ ] **Commit:**

```bash
git add js/config.js js/api.js js/auth.js js/theme.js js/app.js
git commit -m "feat: add JS utility layer"
```

---

### Task 5: Lock/Activation Page (index.html)

**Files:**
- Create: `index.html`

Full HTML page containing:
- Header with lock SVG icon, brand name "小镇刷题家", tagline
- Activation code input (auto-formatting to `XZST-XXXX-XXXX`, uppercase)
- "激活进入" primary button — calls `API.activate()`, saves token, redirects to `home.html`
- Divider ("或")
- "先看看" outline button with eye SVG — calls `Auth.enterPreview()`, redirects to `home.html`
- Auto-redirect if already activated
- Enter key support on input

Complete code written to `index.html`.

- [ ] **Commit:**

```bash
git add index.html && git commit -m "feat: add lock/activation page"
```

---

### Task 6: Home Page (home.html)

**Files:**
- Create: `home.html`

Full HTML page containing:
- Header bar with brand + tagline
- Skeleton loading state (4 skeleton cards)
- Subject grid — dynamically populated from `/api/courses`
  - Each card: icon (mapped from subject name), title, course count, chevron-right
  - Click navigates to `course.html?cat=<id>`
  - Border color from category config
- Quick actions row: 讲义下载, 学习方法, 我的
- Preview mode banner (shown when `Auth.isPreview()`)
- Auth guard via `Auth.requireAuth()`

Complete code written to `home.html`.

- [ ] **Commit:**

```bash
git add home.html && git commit -m "feat: add home page with subject cards"
```

---

### Task 7: Course List Page (course.html)

**Files:**
- Create: `course.html`

Full HTML page containing:
- Sticky page header with back button + dynamic title
- Course cards loaded from API filtered by `?cat=<id>`
- Each card: expandable with video capsules
- Video capsules: play icon + label + password badge
  - Click capsule → `App.openVideo(url, password)` (opens new tab + auto-copies password)
  - Password badge click → `App.copy(password)` (copy only)
  - Preview mode: click shows toast "预览模式，激活后可观看"
- Tag badges ("必学" / "选修")
- Empty state message
- Error state message

Complete code written to `course.html`.

- [ ] **Commit:**

```bash
git add course.html && git commit -m "feat: add course list page with video capsules"
```

---

### Task 8: Downloads, Method, Profile Pages

**Files:**
- Create: `downloads.html`, `method.html`, `profile.html`

**downloads.html** — Loads download data from API, shows:
- Baidu Wangpan card (link + code + copy button + open button)
- Cloud storage section (reserved, hidden when empty)
- Empty state

**method.html** — Loads `learningMethod` text from API, renders as formatted paragraphs.

**profile.html** — Shows:
- Activation code + activation date
- 3 theme option cards (莫兰迪默认 / 白天模式 / 夜间模式) with visual indicators
- Selected theme highlighted with border
- Logout button

All three pages include auth guard.

- [ ] **Commit:**

```bash
git add downloads.html method.html profile.html
git commit -m "feat: add downloads, method, and profile pages"
```

---

### Task 9: Admin Page (admin.html)

**Files:**
- Create: `admin.html`

Full admin SPA with:
- **Login gate**: password input → `API.adminLogin()` → stores `adminToken` in sessionStorage
- **Course management**:
  - Lists all categories and courses
  - Edit/delete buttons per course
  - "+ 添加课程" button → modal sheet
  - Modal: category select, title input, tag select, videos textarea (label|url|password per line)
  - Save → `API.adminSaveCourse()`
  - Delete with confirmation → `API.adminDeleteCourse()`
- **Activation code management**:
  - "生成激活码" with count input → `API.adminGenerateCodes()`
  - Table: code, status (activated/banned), action buttons
  - Ban/unban toggle per code
  - Copy generated codes button
- **Logout button** clears sessionStorage

Complete code written to `admin.html`.

- [ ] **Commit:**

```bash
git add admin.html && git commit -m "feat: add admin management page"
```

---

### Task 10: Backend API — Full Implementation

**Files:**
- Modify: `backend/server.js`

Replace the skeleton with the full server including all routes:

**Public:**
- `GET /api/courses` — returns courses.json
- `POST /api/activate` — validates code, checks banned, records fingerprint/IP, returns token

**Admin (all behind `adminAuth` middleware):**
- `POST /api/admin/login` — validates admin password, returns token
- `GET /api/admin/courses` — returns courses (admin view)
- `POST /api/admin/courses/save` — upserts a course
- `POST /api/admin/courses/delete` — deletes by id
- `POST /api/admin/codes/generate` — generates N codes (XZST-XXXX-XXXX format)
- `GET /api/admin/codes` — lists all codes with status
- `POST /api/admin/codes/ban` — toggles banned status

All routes operate on JSON files. Admin auth via Bearer token comparison.

Complete code written to `backend/server.js`.

- [ ] **Test:** `cd backend && node server.js` then:
```bash
curl http://localhost:3000/api/courses
curl -X POST http://localhost:3000/api/admin/login -H "Content-Type: application/json" -d '{"password":"admin123"}'
```

- [ ] **Commit:**

```bash
git add backend/server.js && git commit -m "feat: implement all backend API routes"
```

---

### Task 11: Import Course Data

**Files:**
- Modify: `backend/data/courses.json`

Write the complete course data extracted from the user's Feishu document, organized into 4 categories:

1. **数量关系** (color: #C5B9CD) — 6 courses: 数推, 和差倍, 工程问题, 几何问题, 行程问题, 最后冲刺25题
2. **资料分析** (color: #D4C5C7) — 4 courses: 资料考点理论, 资料考点实操, 资料速算, 套题1
3. **判断推理** (color: #B8B0C8) — 6 courses: 平面拼合, 加强削弱, 图形推理, 空间折叠, 类比推理, 定义判断
4. **答疑回放** (color: #C9B8A8) — 5 courses: 第一次~第八次答疑

Also includes `downloads.baidu` (url + code), `downloads.cloud` (null), and `learningMethod` text.

Each course has `id`, `title`, `tag` ("必学"/"选修"/""), `videos[]` with `label`, `url`, `password`.

- [ ] **Test:** Start backend, `curl http://localhost:3000/api/courses | python3 -m json.tool`

- [ ] **Commit:**

```bash
git add backend/data/courses.json
git commit -m "data: import course data from Feishu doc"
```

---

### Task 12: End-to-End Verification

- [ ] **Step 1: Start backend**
```bash
cd /Users/wb/Downloads/HTML/backend && node server.js
```

- [ ] **Step 2: Test activation flow**
  1. Open `index.html` in browser
  2. Click "先看看" → verify preview mode (no passwords/links visible)
  3. Return to index.html → enter fake code → verify error message
  4. Generate real code via admin API → activate → verify redirect to home

- [ ] **Step 3: Test course browsing**
  1. Home page shows 4 subject cards
  2. Click 数量关系 → course list loads
  3. Expand "数推-理论+实操" → 2 video capsules visible
  4. Click capsule → new tab opens + password copied toast

- [ ] **Step 4: Test responsive design**
  Chrome DevTools device mode: iPhone SE (375px), iPad (768px), Desktop (1440px)

- [ ] **Step 5: Test theme switching**
  Profile page → cycle through 3 themes → verify visual change

- [ ] **Step 6: Test admin**
  Open `admin.html` → login with admin123 → add/edit/delete course → verify changes appear on frontend

- [ ] **Step 7: Commit fixes**
```bash
git add -A && git commit -m "chore: final adjustments from testing"
```

---

### Task 13: Deploy

- [ ] **Step 1: Deploy frontend to Cloudflare Pages**
  - Push to GitHub
  - Cloudflare Dashboard → Pages → Connect repo
  - Build command: *leave empty* (static site)
  - Output directory: `./`
  - Deploy → get `*.pages.dev` URL

- [ ] **Step 2: Deploy backend to Railway**
  - Railway → New → Deploy from GitHub
  - Root directory: `/backend`
  - Start command: `npm start`
  - Deploy → get `*.railway.app` URL

- [ ] **Step 3: Update API URL in production**
  - Edit `js/config.js`: `API_BASE: 'https://YOUR-APP.railway.app'`
  - Commit + push → Cloudflare auto-redeploys

- [ ] **Step 4: Final test on production**
  - Open Cloudflare Pages URL on mobile
  - Test activation → course browsing → theme switching

- [ ] **Commit:**
```bash
git add js/config.js && git commit -m "chore: update API base URL for production"
```
