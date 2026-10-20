/* Vercel serverless backend. Supabase service-role credentials must ONLY be in Vercel env settings. */
'use strict';
const { createHmac, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const scryptAsync = promisify(scrypt);

const BUCKET = 'inside-of-me-private';
const ID = 'inside-of-me';
const VOICE_PATH = 'inside-of-me.enc';
const allowedMedia = new Set(['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac']);

function serverHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
}
function fail(res, code, message) { return res.status(code).json({ error: message }); }
function supabaseHeaders(key) {
  return { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
}
async function sbJson(url, options) {
  const response = await fetch(url, { ...options, cache: 'no-store', redirect: 'error' });
  if (!response.ok) throw new Error(`Supabase request failed (${response.status})`);
  return await response.json();
}
function strictBase64(input, expectedBytes) {
  if (typeof input !== 'string' || !/^[a-zA-Z0-9+/]+={0,2}$/.test(input)) return null;
  const value = Buffer.from(input, 'base64');
  return value.length === expectedBytes && value.toString('base64') === input ? value : null;
}
module.exports = async function handler(req, res) {
  serverHeaders(res);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return fail(res, 405, 'Method not allowed.');
  }
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const rateSecret = process.env.VOICE_RATE_LIMIT_SECRET;
  if (!url || !/^https:\/\/[^/]+\.supabase\.co$/.test(url) || !key || !rateSecret || rateSecret.length < 32) {
    return fail(res, 503, 'Private archive is not configured.');
  }
  try {
    // Accept requests from the current website only. Security still depends on the strong password.
    const origin = req.headers.origin;
    const host = req.headers.host;
    if (origin && origin !== `https://${host}` && origin !== `http://${host}`) {
      return fail(res, 403, 'Origin not allowed.');
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const password = body?.password;
    if (typeof password !== 'string' || password.length === 0 || password.length > 256 ||
        !['somebody', 'future'].includes(body?.audience)) {
      return fail(res, 400, 'Invalid request.');
    }

    // HMAC replaces the IP with a pseudonymous fingerprint. IP headers are an imperfect throttle.
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim().slice(0, 80);
    const fingerprint = createHmac('sha256', rateSecret).update(`ip:${ip}`).digest('hex');
    const headers = supabaseHeaders(key);
    const rpc = `${url}/rest/v1/rpc/voice_note_rate_limit`;
    const rateCheck = async (fingerprint, max) => sbJson(rpc, {
      method: 'POST', headers, body: JSON.stringify({ p_fingerprint: fingerprint, p_limit: max, p_window_seconds: 900 })
    });
    // Atomic database counters persist across Vercel instances; a coarse global cap is also applied.
    const globalOk = await rateCheck(createHmac('sha256', rateSecret).update('global').digest('hex'), 150);
    const ipOk = await rateCheck(fingerprint, 8);
    if (globalOk !== true || ipOk !== true) return fail(res, 429, 'Too many attempts.');

    const rows = await sbJson(`${url}/rest/v1/private_voice_config?id=eq.${ID}&select=id,verifier_salt,verifier_hash,encryption_salt,encryption_iv,kdf_iterations,storage_path,media_type`, {
      method: 'GET', headers
    });
    const meta = Array.isArray(rows) ? rows[0] : null;
    if (!meta || meta.storage_path !== VOICE_PATH || !allowedMedia.has(meta.media_type)) {
      return fail(res, 503, 'Private archive is not yet configured.');
    }
    const salt = strictBase64(meta.verifier_salt, 16);
    const expected = strictBase64(meta.verifier_hash, 32);
    const encSalt = strictBase64(meta.encryption_salt, 16);
    const encIv = strictBase64(meta.encryption_iv, 12);
    if (!salt || !expected || !encSalt || !encIv || meta.kdf_iterations !== 600000) {
      return fail(res, 503, 'Invalid private archive configuration.');
    }
    // scrypt is deliberately separate from the PBKDF2 encryption key and uses a different salt.
    const actual = await scryptAsync(password, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
    if (!timingSafeEqual(actual, expected)) return fail(res, 401, 'Incorrect password.');

    // Only successful verification can create a short-lived signed URL for ENCRYPTED bytes.
    const signed = await sbJson(`${url}/storage/v1/object/sign/${BUCKET}/${VOICE_PATH}`, {
      method: 'POST', headers, body: JSON.stringify({ expiresIn: 45 })
    });
    const target = signed?.signedURL || signed?.signedUrl;
    if (typeof target !== 'string' || !target.includes('/object/sign/')) throw new Error('Invalid signed URL');
    const signedUrl = target.startsWith('https://') ? target :
      `${url}/storage/v1/${target.replace(/^\/+/, '').replace(/^storage\/v1\//, '')}`;
    if (!signedUrl.startsWith(`${url}/storage/v1/object/sign/${BUCKET}/${VOICE_PATH}?`)) {
      throw new Error('Unexpected signed URL');
    }
    return res.status(200).json({
      url: signedUrl,
      salt: meta.encryption_salt,
      iv: meta.encryption_iv,
      iterations: meta.kdf_iterations,
      mediaType: meta.media_type
    });
  } catch (_error) {
    // Fail closed. Do not leak passwords, tokens, database details, or file paths to clients.
    return fail(res, 503, 'Private archive is temporarily unavailable.');
  }
};
