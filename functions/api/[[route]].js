// Cloudflare Pages Functions — API handler
// Handles all /api/* routes

// Helper: generate random hex string
function randomHex(len) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: simple hash for fingerprint
function simpleHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
  }
  return Math.abs(h).toString(36);
}

// Helper: parse JSON body
async function parseBody(req) {
  try { return await req.json(); } catch(e) { return {}; }
}

// Helper: CORS + JSON response
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

// Admin auth check
async function checkAdmin(req, env) {
  const auth = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  if (!auth) return false;
  const data = await env.DATA_KV.get('activations', 'json') || {};
  if (data.adminToken !== auth) return false;
  // Token expiry check (24h) — skip if no expiry set (legacy tokens)
  if (data.adminTokenExpiry && Date.now() > data.adminTokenExpiry) return false;
  return true;
}

// Helper: check if request has a valid activation token
async function isActivated(request, env) {
  try {
    const token = (request.headers.get('Authorization') || '').replace('Bearer ', '');
    if (!token) return false;
    const data = (await env.DATA_KV.get('activations', 'json')) || {};
    const codes = data.codes || {};
    for (var key in codes) {
      if (codes[key] && codes[key].token === token && !codes[key].banned) {
        return true;
      }
    }
    return false;
  } catch(e) {
    return false;
  }
}

// ===== MAIN HANDLER =====
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }

  try {

    // ===== PUBLIC ROUTES =====

    // GET /api/courses — returns course data
    // Without auth: strips video passwords. With auth: includes passwords.
    if (request.method === 'GET' && path === '/courses') {
      let data = await env.DATA_KV.get('courses', 'json');
      // Auto-seed from static file if KV is empty
      if (!data || !data.categories || data.categories.length === 0) {
        try {
          const url = new URL(request.url);
          const seedRes = await fetch(url.origin + '/data/courses.json');
          if (seedRes.ok) {
            data = await seedRes.json();
            await env.DATA_KV.put('courses', JSON.stringify(data));
          }
        } catch(e) {}
      }
      data = data || { categories: [] };
      const isAuth = await isActivated(request, env) || await checkAdmin(request, env);
      if (!isAuth) {
        // Strip passwords for unauthenticated requests
        const stripped = JSON.parse(JSON.stringify(data), function(key, value) {
          if (key === 'password' || key === 'pwd') return '';
          return value;
        });
        return json(stripped);
      }
      return json(data);
    }

    // POST /api/activate — validate activation code
    if (request.method === 'POST' && path === '/activate') {
      const body = await parseBody(request);
      const code = (body.code || '').trim().toUpperCase();
      if (!code) return json({ error: '请输入激活码' }, 400);

      const data = (await env.DATA_KV.get('activations', 'json')) || { codes: {} };
      const record = data.codes[code];

      if (!record)
        return json({ error: '激活码无效，请联系博主获取' }, 404);
      if (record.banned)
        return json({ error: '该激活码已被封禁，请联系博主' }, 403);

      const fp = body.fingerprint || simpleHash(request.headers.get('cf-connecting-ip') || 'unknown');
      const ip = request.headers.get('cf-connecting-ip') || '0.0.0.0';

      // First activation
      if (!record.activated) {
        record.activated = true;
        record.activatedAt = new Date().toISOString();
        record.fingerprint = fp;
        record.ips = [ip];
        record.token = randomHex(32);
        data.codes[code] = record;
        await env.DATA_KV.put('activations', JSON.stringify(data));
        return json({ code, token: record.token, activatedAt: record.activatedAt });
      }

      // Same device
      if (record.fingerprint === fp || (record.ips || []).includes(ip)) {
        if (!record.token) {
          record.token = randomHex(32);
          data.codes[code] = record;
          await env.DATA_KV.put('activations', JSON.stringify(data));
        }
        return json({ code, token: record.token, activatedAt: record.activatedAt });
      }

      // Different device
      return json({ error: '该激活码已在其他设备使用，如需换绑请联系博主' }, 403);
    }

    // POST /api/feedback — submit feedback
    if (request.method === 'POST' && path === '/feedback') {
      const body = await parseBody(request);
      const text = (body.text || '').trim();
      if (!text) return json({ error: '请输入反馈内容' }, 400);
      const data = (await env.DATA_KV.get('feedback', 'json')) || [];
      data.push({
        id: randomHex(8),
        text,
        time: new Date().toISOString(),
        ip: request.headers.get('cf-connecting-ip') || ''
      });
      await env.DATA_KV.put('feedback', JSON.stringify(data));
      return json({ success: true });
    }

    // ===== PROGRESS ROUTES (requires activation token) =====

    // GET /api/progress — get current user's progress
    if (request.method === 'GET' && path === '/progress') {
      const active = await isActivated(request, env);
      if (!active) return json({ error: '未授权' }, 401);
      const token = (request.headers.get('Authorization') || '').replace('Bearer ', '');
      const data = (await env.DATA_KV.get('progress', 'json')) || {};
      return json(data[token] || {});
    }

    // POST /api/progress — save current user's progress
    if (request.method === 'POST' && path === '/progress') {
      const active = await isActivated(request, env);
      if (!active) return json({ error: '未授权' }, 401);
      const token = (request.headers.get('Authorization') || '').replace('Bearer ', '');
      const body = await parseBody(request);
      const data = (await env.DATA_KV.get('progress', 'json')) || {};
      data[token] = body.courses || {};
      await env.DATA_KV.put('progress', JSON.stringify(data));
      return json({ success: true });
    }

    // ===== ADMIN ROUTES =====

    // POST /api/admin/login
    if (request.method === 'POST' && path === '/admin/login') {
      const body = await parseBody(request);

      // Rate limiting: max 5 attempts per minute per IP
      const ip = request.headers.get('cf-connecting-ip') || 'unknown';
      const rateKey = 'rate:admin:' + ip;
      const attempts = parseInt((await env.DATA_KV.get(rateKey)) || '0');
      if (attempts >= 5) {
        return json({ error: '尝试次数过多，请1分钟后再试' }, 429);
      }
      await env.DATA_KV.put(rateKey, String(attempts + 1), { expirationTtl: 60 });

      const data = (await env.DATA_KV.get('activations', 'json')) || {};
      // Password priority: env var > KV store > default
      const adminPwd = env.ADMIN_PASSWORD || data.adminPassword || 'admin123';

      if (body.password !== adminPwd) {
        return json({ error: '密码错误' }, 401);
      }

      // Clear rate limit on successful login
      await env.DATA_KV.delete(rateKey);

      data.adminToken = randomHex(32);
      // Token expires in 24 hours
      data.adminTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
      await env.DATA_KV.put('activations', JSON.stringify(data));
      return json({ token: data.adminToken });
    }

    // All routes below need admin auth
    const isAdmin = await checkAdmin(request, env);
    if (!isAdmin)
      return json({ error: '未授权' }, 401);

    // GET /api/admin/courses
    if (request.method === 'GET' && path === '/admin/courses') {
      let data = await env.DATA_KV.get('courses', 'json');
      // Auto-seed from static file if KV is empty
      if (!data || !data.categories || data.categories.length === 0) {
        try {
          const url = new URL(request.url);
          const seedRes = await fetch(url.origin + '/data/courses.json');
          if (seedRes.ok) {
            data = await seedRes.json();
            await env.DATA_KV.put('courses', JSON.stringify(data));
          }
        } catch(e) {}
      }
      return json(data || { categories: [] });
    }

    // POST /api/admin/courses/save
    if (request.method === 'POST' && path === '/admin/courses/save') {
      const { course, groupName } = await parseBody(request);
      if (!course || !course.id || !course.categoryId)
        return json({ error: '缺少课程信息' }, 400);

      const data = (await env.DATA_KV.get('courses', 'json')) || { categories: [] };
      // Match by id or display name
      let cat = data.categories.find(c => c.id === course.categoryId || c.name === course.categoryId);
      if (!cat) {
        cat = { id: course.categoryId, name: course.categoryId, groups: [{ name: groupName || '默认', courses: [] }] };
        data.categories.push(cat);
      }

      // Ensure groups array exists
      if (!cat.groups) cat.groups = [];
      if (cat.groups.length === 0) cat.groups.push({ name: groupName || '默认', courses: [] });

      // Find or create target group
      const targetName = groupName || cat.groups[0].name || '默认';
      let group = cat.groups.find(g => g.name === targetName);
      if (!group) {
        group = { name: targetName, courses: [] };
        cat.groups.push(group);
      }
      if (!group.courses) group.courses = [];

      // Upsert course in group
      const idx = group.courses.findIndex(c => c.id === course.id);
      if (idx !== -1) group.courses[idx] = course;
      else group.courses.push(course);

      await env.DATA_KV.put('courses', JSON.stringify(data));
      return json({ success: true });
    }

    // POST /api/admin/courses/reorder
    if (request.method === 'POST' && path === '/admin/courses/reorder') {
      const { orders } = await parseBody(request);
      if (!orders || !Array.isArray(orders))
        return json({ error: '缺少排序数据' }, 400);

      const data = (await env.DATA_KV.get('courses', 'json')) || { categories: [] };
      // Build lookup map
      const orderMap = {};
      for (const item of orders) {
        orderMap[item.id] = item.order;
      }
      // Update orders
      for (const cat of data.categories) {
        if (cat.groups) {
          for (const group of cat.groups) {
            if (group.courses) {
              for (const course of group.courses) {
                if (orderMap[course.id] !== undefined) {
                  course.order = orderMap[course.id];
                }
              }
              group.courses.sort((a, b) => (a.order || 0) - (b.order || 0));
            }
          }
        }
        if (cat.courses) {
          for (const course of cat.courses) {
            if (orderMap[course.id] !== undefined) {
              course.order = orderMap[course.id];
            }
          }
          cat.courses.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
      }
      await env.DATA_KV.put('courses', JSON.stringify(data));
      return json({ success: true });
    }

    // POST /api/admin/courses/delete
    if (request.method === 'POST' && path === '/admin/courses/delete') {
      const { id } = await parseBody(request);
      if (!id) return json({ error: '缺少课程ID' }, 400);

      const data = (await env.DATA_KV.get('courses', 'json')) || { categories: [] };
      for (const cat of data.categories) {
        if (cat.groups) {
          for (const group of cat.groups) {
            if (group.courses) group.courses = group.courses.filter(c => c.id !== id);
          }
        }
        if (cat.courses) cat.courses = cat.courses.filter(c => c.id !== id);
      }
      await env.DATA_KV.put('courses', JSON.stringify(data));
      return json({ success: true });
    }

    // POST /api/admin/codes/generate
    if (request.method === 'POST' && path === '/admin/codes/generate') {
      const { count } = await parseBody(request);
      if (!count || count < 1) return json({ error: '请输入生成数量' }, 400);

      const data = (await env.DATA_KV.get('activations', 'json')) || { codes: {} };
      const generated = [];
      for (let i = 0; i < Math.min(count, 100); i++) {
        let code;
        do {
          code = 'XZST-' + randomHex(2).toUpperCase().slice(0, 4) + '-' + randomHex(2).toUpperCase().slice(0, 4);
        } while (data.codes[code]);
        data.codes[code] = { code, activated: false, banned: false, createdAt: new Date().toISOString() };
        generated.push(code);
      }
      await env.DATA_KV.put('activations', JSON.stringify(data));
      return json({ success: true, codes: generated });
    }

    // GET /api/admin/codes
    if (request.method === 'GET' && path === '/admin/codes') {
      const data = (await env.DATA_KV.get('activations', 'json')) || { codes: {} };
      const list = Object.entries(data.codes).map(([code, info]) => ({
        code, activated: info.activated || false, banned: info.banned || false,
        activatedAt: info.activatedAt || null, fingerprint: info.fingerprint || null,
        ips: info.ips || [], createdAt: info.createdAt || null,
      }));
      return json({ codes: list });
    }

    // GET /api/admin/feedback
    if (request.method === 'GET' && path === '/admin/feedback') {
      const data = (await env.DATA_KV.get('feedback', 'json')) || [];
      return json({ feedback: data });
    }

    // POST /api/admin/codes/ban
    if (request.method === 'POST' && path === '/admin/codes/ban') {
      const { code } = await parseBody(request);
      if (!code) return json({ error: '请输入激活码' }, 400);

      const data = (await env.DATA_KV.get('activations', 'json')) || { codes: {} };
      if (!data.codes[code]) return json({ error: '激活码不存在' }, 404);

      data.codes[code].banned = !data.codes[code].banned;
      await env.DATA_KV.put('activations', JSON.stringify(data));
      return json({ success: true, code, banned: data.codes[code].banned });
    }

    // POST /api/admin/codes/revoke-all — delete all activation codes
    if (request.method === 'POST' && path === '/admin/codes/revoke-all') {
      const { confirm } = await parseBody(request);
      if (confirm !== 'yes') return json({ error: '请输入确认指令' }, 400);
      const data = (await env.DATA_KV.get('activations', 'json')) || { codes: {} };
      const count = Object.keys(data.codes).length;
      data.codes = {};
      await env.DATA_KV.put('activations', JSON.stringify(data));
      return json({ success: true, message: '已删除 ' + count + ' 个激活码' });
    }

    // 404
    return json({ error: 'Not Found' }, 404);

  } catch (err) {
    console.error('API Error:', err.message);
    return json({ error: '服务器错误，请稍后重试' }, 500);
  }
}
