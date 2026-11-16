import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [saltHex, hashHex] = String(stored).split(':');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

// Secret JWT: dari env JWT_SECRET, atau dibuat sekali dan disimpan di DB.
export function getSecret(db, env = process.env) {
  if (env.JWT_SECRET) return env.JWT_SECRET;
  const row = db.prepare("SELECT value FROM settings WHERE key = 'jwt_secret'").get();
  if (row) return row.value;
  const secret = crypto.randomBytes(48).toString('hex');
  db.prepare("INSERT INTO settings (key, value) VALUES ('jwt_secret', ?)").run(secret);
  return secret;
}

// Buat admin pertama bila belum ada. Kembalikan kredensial yang dibuat (untuk dicetak sekali).
export function ensureAdmin(db, env = process.env) {
  if (db.prepare('SELECT COUNT(*) c FROM admin').get().c > 0) return null;
  const username = env.ADMIN_USERNAME || 'admin';
  const generated = !env.ADMIN_PASSWORD;
  const password = env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
  db.prepare('INSERT INTO admin (username, password_hash) VALUES (?, ?)').run(username, hashPassword(password));
  return { username, password, generated };
}

export function signToken(secret, admin) {
  return jwt.sign({ sub: admin.id, username: admin.username }, secret, { expiresIn: '8h' });
}

export function requireAdmin(secret) {
  return (req, res, next) => {
    const m = /^Bearer (.+)$/.exec(req.get('authorization') || '');
    try {
      req.admin = jwt.verify(m?.[1] ?? '', secret);
      next();
    } catch {
      res.status(401).json({ error: 'Silakan login sebagai admin' });
    }
  };
}

// Pembatas percobaan login sederhana (per IP), di memori.
export function loginLimiter({ max = 10, windowMs = 15 * 60 * 1000 } = {}) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now(), key = req.ip;
    const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: 'Terlalu banyak percobaan login. Coba lagi nanti.' });
    arr.push(now); hits.set(key, arr);
    req.clearLoginHits = () => hits.delete(key);
    next();
  };
}
