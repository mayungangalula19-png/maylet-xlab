import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import crypto from 'crypto';

const app = express();
const port = 3001;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// ─── SQLite ──────────────────────────────────────────────────────────────────
const dbPath = path.resolve('mock-database.sqlite');
const db = new sqlite3.Database(dbPath);
console.log('Using SQLite database at:', dbPath);

db.serialize(() => {
  // Auth
  db.run(`CREATE TABLE IF NOT EXISTS mock_users (
    id         TEXT PRIMARY KEY,
    email      TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    full_name  TEXT,
    user_type  TEXT DEFAULT 'innovator',
    org_name   TEXT,
    phone      TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS mock_sessions (
    token      TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  // App tables
  db.run(`CREATE TABLE IF NOT EXISTS profiles (
    id         TEXT PRIMARY KEY,
    email      TEXT,
    full_name  TEXT,
    role       TEXT DEFAULT 'innovator',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id         TEXT PRIMARY KEY,
    name       TEXT,
    user_id    TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS vault_entries (
    id   TEXT PRIMARY KEY,
    data TEXT
  )`);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function uuid(): string {
  return crypto.randomUUID();
}

function makeToken(): string {
  return 'mock-jwt-' + crypto.randomBytes(16).toString('hex');
}

function buildSession(user: any, token: string) {
  return {
    access_token: token,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock-refresh-' + token.slice(-8),
    user: buildUser(user),
  };
}

function buildUser(u: any) {
  return {
    id: u.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: u.email,
    email_confirmed_at: new Date().toISOString(),
    phone: u.phone ?? '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {
      full_name: u.full_name ?? '',
      user_type: u.user_type ?? 'innovator',
      organization_name: u.org_name ?? '',
      phone: u.phone ?? '',
    },
    created_at: u.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function dbGet<T = any>(sql: string, params: any[]): Promise<T | undefined> {
  return new Promise((res, rej) =>
    db.get(sql, params, (err, row) => (err ? rej(err) : res(row as T)))
  );
}

function dbRun(sql: string, params: any[]): Promise<void> {
  return new Promise((res, rej) =>
    db.run(sql, params, (err) => (err ? rej(err) : res()))
  );
}

function dbAll<T = any>(sql: string, params: any[]): Promise<T[]> {
  return new Promise((res, rej) =>
    db.all(sql, params, (err, rows) => (err ? rej(err) : res(rows as T[])))
  );
}

// ─── Auth: SIGN UP ────────────────────────────────────────────────────────────
// POST /auth/v1/signup
app.post('/auth/v1/signup', async (req, res) => {
  try {
    const { email, password, data: meta } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required', code: 'validation_failed' });
    }

    const existing = await dbGet('SELECT id FROM mock_users WHERE email = ?', [email.toLowerCase()]);
    if (existing) {
      // Supabase returns 200 with empty session when email already exists (security measure)
      return res.status(200).json({ user: null, session: null });
    }

    const userId = uuid();
    const token = makeToken();

    await dbRun(
      `INSERT INTO mock_users (id, email, password, full_name, user_type, org_name, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        email.toLowerCase(),
        password, // plain text is fine for mock
        meta?.full_name ?? '',
        meta?.user_type ?? 'innovator',
        meta?.organization_name ?? '',
        meta?.phone ?? '',
      ]
    );

    // Auto-detect admin role
    const isAdmin = email.toLowerCase().includes('admin');
    const assignedRole = isAdmin ? 'admin' : 'innovator';

    // Auto-create profile row
    await dbRun(
      `INSERT OR IGNORE INTO profiles (id, email, full_name, role)
       VALUES (?, ?, ?, ?)`,
      [userId, email.toLowerCase(), meta?.full_name ?? '', assignedRole]
    );

    if (isAdmin) console.log(`[signup] Admin role assigned to ${email}`);

    await dbRun('INSERT INTO mock_sessions (token, user_id) VALUES (?, ?)', [token, userId]);

    const user = await dbGet('SELECT * FROM mock_users WHERE id = ?', [userId]);
    const session = buildSession(user, token);

    return res.status(200).json({ user: session.user, session });
  } catch (err: any) {
    console.error('[signup]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Auth: SIGN IN (password) ────────────────────────────────────────────────
// POST /auth/v1/token?grant_type=password
app.post('/auth/v1/token', async (req, res) => {
  try {
    const grantType = req.query.grant_type as string;

    if (grantType === 'password') {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'email and password required', code: 'validation_failed' });
      }

      const user = await dbGet(
        'SELECT * FROM mock_users WHERE email = ? AND password = ?',
        [email.toLowerCase(), password]
      );

      if (!user) {
        return res.status(400).json({
          error: 'Invalid login credentials',
          error_description: 'Invalid login credentials',
          code: 'invalid_grant',
        });
      }

      const token = makeToken();
      await dbRun('INSERT INTO mock_sessions (token, user_id) VALUES (?, ?)', [token, user.id]);

      const session = buildSession(user, token);
      return res.status(200).json(session);
    }

    if (grantType === 'refresh_token') {
      // Just return a new mock session — good enough for testing
      const refreshToken = req.body.refresh_token as string;
      const sessionRow = await dbGet(
        'SELECT * FROM mock_sessions WHERE token LIKE ?',
        ['%' + (refreshToken?.slice(-8) ?? '')]
      );
      if (!sessionRow) {
        return res.status(400).json({ error: 'Invalid refresh token', code: 'invalid_grant' });
      }
      const user = await dbGet('SELECT * FROM mock_users WHERE id = ?', [(sessionRow as any).user_id]);
      if (!user) return res.status(400).json({ error: 'User not found', code: 'invalid_grant' });

      const newToken = makeToken();
      await dbRun('INSERT INTO mock_sessions (token, user_id) VALUES (?, ?)', [newToken, (user as any).id]);
      return res.status(200).json(buildSession(user, newToken));
    }

    return res.status(400).json({ error: 'Unsupported grant_type' });
  } catch (err: any) {
    console.error('[token]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Auth: GET USER ───────────────────────────────────────────────────────────
// GET /auth/v1/user
app.get('/auth/v1/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token || token === 'mock-anon-key') {
      return res.status(401).json({ error: 'Not authenticated', code: 'not_authenticated' });
    }

    const sessionRow = await dbGet('SELECT * FROM mock_sessions WHERE token = ?', [token]);
    if (!sessionRow) {
      return res.status(401).json({ error: 'Invalid token', code: 'not_authenticated' });
    }

    const user = await dbGet('SELECT * FROM mock_users WHERE id = ?', [(sessionRow as any).user_id]);
    if (!user) return res.status(401).json({ error: 'User not found' });

    return res.status(200).json(buildUser(user));
  } catch (err: any) {
    console.error('[getUser]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Auth: SIGN OUT ───────────────────────────────────────────────────────────
// POST /auth/v1/logout
app.post('/auth/v1/logout', async (req, res) => {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (token && token !== 'mock-anon-key') {
    await dbRun('DELETE FROM mock_sessions WHERE token = ?', [token]).catch(() => {});
  }
  return res.status(204).send();
});

// ─── Auth: OTP / resend (no-op in mock) ──────────────────────────────────────
app.post('/auth/v1/resend', (_req, res) => res.status(200).json({}));
app.post('/auth/v1/otp', (_req, res) => res.status(200).json({}));
app.post('/auth/v1/recover', (_req, res) => res.status(200).json({}));

// ─── Dev helper: promote user to admin ───────────────────────────────────────
// POST /dev/make-admin  { "email": "someone@example.com" }
app.post('/dev/make-admin', async (req, res) => {
  try {
    const email = (req.body?.email ?? '').toLowerCase().trim();
    if (!email) return res.status(400).json({ error: 'email is required' });

    const user = await dbGet('SELECT id FROM mock_users WHERE email = ?', [email]);
    if (!user) return res.status(404).json({ error: `No user found with email: ${email}` });

    await dbRun(
      `INSERT INTO profiles (id, email, role) VALUES (?, ?, 'admin')
       ON CONFLICT(id) DO UPDATE SET role = 'admin'`,
      [(user as any).id, email]
    );

    console.log(`[dev] Promoted ${email} to admin`);
    return res.json({ ok: true, message: `${email} is now admin` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── RPC endpoints ───────────────────────────────────────────────────────────
// POST /rest/v1/rpc/get_my_role
app.post('/rest/v1/rpc/get_my_role', async (req, res) => {
  try {
    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    const sessionRow = await dbGet('SELECT * FROM mock_sessions WHERE token = ?', [token]);
    if (!sessionRow) return res.json('innovator');

    const profile = await dbGet('SELECT role FROM profiles WHERE id = ?', [(sessionRow as any).user_id]);
    return res.json((profile as any)?.role ?? 'innovator');
  } catch {
    return res.json('innovator');
  }
});

// POST /rest/v1/rpc/ensure_profile
app.post('/rest/v1/rpc/ensure_profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    const sessionRow = await dbGet('SELECT * FROM mock_sessions WHERE token = ?', [token]);
    if (!sessionRow) return res.json({ ok: false, error: 'not authenticated' });

    const userId = (sessionRow as any).user_id;
    const fullName = req.body?.p_full_name ?? null;

    const userRow = await dbGet('SELECT email FROM mock_users WHERE id = ?', [userId]);
    const isAdminEmail = (userRow as any)?.email?.includes('admin') ?? false;

    const existing = await dbGet('SELECT id FROM profiles WHERE id = ?', [userId]);
    if (!existing) {
      const user = await dbGet('SELECT * FROM mock_users WHERE id = ?', [userId]);
      const roleToAssign = isAdminEmail ? 'admin' : 'innovator';
      await dbRun(
        `INSERT INTO profiles (id, email, full_name, role) VALUES (?, ?, ?, ?)`,
        [userId, (user as any)?.email ?? '', fullName ?? (user as any)?.full_name ?? '', roleToAssign]
      );
    } else {
      // If existing profile has no admin role but email says admin, upgrade it
      if (isAdminEmail) {
        await dbRun('UPDATE profiles SET role = ? WHERE id = ? AND role != ?', ['admin', userId, 'super_admin']);
      }
      if (fullName) {
        await dbRun('UPDATE profiles SET full_name = ? WHERE id = ?', [fullName, userId]);
      }
    }

    const profile = await dbGet('SELECT role FROM profiles WHERE id = ?', [userId]);
    return res.json({ ok: true, id: userId, role: (profile as any)?.role ?? 'innovator' });
  } catch (err: any) {
    console.error('[ensure_profile]', err.message);
    return res.json({ ok: false, error: err.message });
  }
});

// ─── REST API (PostgREST-compatible) ─────────────────────────────────────────
function buildWhere(query: any): { whereSql: string; params: any[] } {
  const wheres: string[] = [];
  const params: any[] = [];
  for (const [key, val] of Object.entries(query)) {
    if (['select', 'order', 'limit', 'offset'].includes(key)) continue;
    if (typeof val === 'string' && val.startsWith('eq.')) {
      wheres.push(`${key} = ?`);
      params.push(val.slice(3));
    } else if (typeof val === 'string' && val.startsWith('in.')) {
      const inVals = val.slice(4, -1).split(',');
      wheres.push(`${key} IN (${inVals.map(() => '?').join(',')})`);
      params.push(...inVals);
    } else if (typeof val === 'string' && val.startsWith('is.')) {
      const v = val.slice(3);
      wheres.push(`${key} IS ${v === 'null' ? 'NULL' : 'NOT NULL'}`);
    }
  }
  return { whereSql: wheres.length ? 'WHERE ' + wheres.join(' AND ') : '', params };
}

// GET
app.get('/rest/v1/:table', (req, res) => {
  const table = req.params.table;
  const { whereSql, params } = buildWhere(req.query);
  let sql = `SELECT ${req.query.select || '*'} FROM ${table} ${whereSql}`;
  if (req.query.order) {
    const [col, dir] = (req.query.order as string).split('.');
    sql += ` ORDER BY ${col} ${dir === 'desc' ? 'DESC' : 'ASC'}`;
  }
  if (req.query.limit) { sql += ` LIMIT ?`; params.push(req.query.limit); }

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('SQL Error:', err.message, sql);
      return res.status(400).json({ error: err.message, code: 'SQL_ERROR' });
    }
    if (req.headers.accept?.includes('application/vnd.pgrst.object')) {
      if (!rows.length) return res.status(406).json({ error: 'Not found', code: 'PGRST116' });
      return res.json(rows[0]);
    }
    res.json(rows ?? []);
  });
});

// POST
app.post('/rest/v1/:table', (req, res) => {
  const table = req.params.table;
  const items = Array.isArray(req.body) ? req.body : [req.body];
  if (!items.length) return res.json([]);
  const keys = Object.keys(items[0]);
  const placeholders = keys.map(() => '?').join(',');
  const sql = `INSERT OR REPLACE INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
  const stmt = db.prepare(sql);
  db.serialize(() => {
    items.forEach((item) => stmt.run(keys.map((k) => item[k])));
    stmt.finalize();
  });
  if (req.headers.prefer?.includes('return=representation')) {
    return res.json(Array.isArray(req.body) ? items : items[0]);
  }
  res.status(201).send();
});

// PATCH
app.patch('/rest/v1/:table', (req, res) => {
  const table = req.params.table;
  const { whereSql, params } = buildWhere(req.query);
  if (!whereSql) return res.status(400).json({ error: 'Update requires a filter' });
  const keys = Object.keys(req.body);
  const setSql = keys.map((k) => `${k} = ?`).join(', ');
  const sql = `UPDATE ${table} SET ${setSql} ${whereSql}`;
  db.run(sql, [...keys.map((k) => req.body[k]), ...params], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// DELETE
app.delete('/rest/v1/:table', (req, res) => {
  const table = req.params.table;
  const { whereSql, params } = buildWhere(req.query);
  if (!whereSql) return res.status(400).json({ error: 'Delete requires a filter' });
  db.run(`DELETE FROM ${table} ${whereSql}`, params, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`✅ Mock Supabase API running on http://localhost:${port}`);
  console.log(`   Sign up:  POST /auth/v1/signup`);
  console.log(`   Sign in:  POST /auth/v1/token?grant_type=password`);
  console.log(`   Get user: GET  /auth/v1/user`);
});
