/*
  Offline setup utility: encrypt an audio file locally, and prepare hashed-password
  SQL metadata. No audio or password is uploaded, published, or transmitted by this tool.
  Usage: node tools/prepare-private-voice.mjs "C:\\path\\to\\recording.m4a"
*/
import { randomBytes, scryptSync, pbkdf2Sync, createCipheriv } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const SOURCE = process.argv[2];
const MIME = {
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.mp4': 'audio/mp4',
  '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.webm': 'audio/webm', '.aac': 'audio/aac'
};
function die(message) { console.error(`ERROR: ${message}`); process.exit(1); }
if (!SOURCE) die('Specify the path to your private recording: node tools/prepare-private-voice.mjs "C:\\path\\to\\recording.m4a"');
const filename = resolve(SOURCE);
const type = MIME[extname(filename).toLowerCase()];
if (!type) die('Supported input formats: .mp3, .m4a, .mp4, .wav, .ogg, .webm, .aac');
let size;
try { size = statSync(filename).size; } catch { die('The recording was not found at the specified path.'); }
if (size < 100 || size > 25 * 1024 * 1024) die('The input audio must be between 100 bytes and 25 MB. Compress it locally if needed.');
if (!process.stdin.isTTY || !process.stdin.setRawMode) die('Run from an interactive VS Code, PowerShell, or Terminal session.');

// Hidden, raw-mode passphrase input so terminal echo/history does not reveal it.
function hiddenPassword(label) {
  return new Promise((resolvePass, reject) => {
    process.stdout.write(label);
    let value = '';
    process.stdin.setRawMode(true);
    process.stdin.resume();
    function finish(error) {
      process.stdin.removeListener('data', handler);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      if (error) reject(error); else resolvePass(value);
    }
    function handler(bytes) {
      for (const ch of bytes.toString('utf8')) {
        if (ch === '\r' || ch === '\n') { finish(); return; }
        if (ch === '\u0003') { finish(new Error('Cancelled')); return; }
        if (ch === '\u007f' || ch === '\b') {
          if (value.length) { value = value.slice(0,-1); process.stdout.write('\b \b'); }
        } else if (ch >= ' ' && ch !== '\u007f') {
          if (value.length >= 256) continue;
          value += ch;
          process.stdout.write('*');
        }
      }
    }
    process.stdin.on('data', handler);
  });
}
try {
  console.log('PRIVATE LETTER SETUP — audio will be encrypted on THIS COMPUTER.');
  console.log('Choose a UNIQUE randomly generated password of at least 20 characters.');
  let password = await hiddenPassword('New private password: ');
  const repeated = await hiddenPassword('Confirm private password: ');
  if (password !== repeated) die('The two passwords do not match. Nothing was generated.');
  if (password.length < 20) die('Use at least 20 characters. A 24–32 character randomly generated password is strongly recommended.');

  // IMPORTANT: scrypt verifier and PBKDF2 encryption use independent random salts.
  const verifierSalt = randomBytes(16);
  const verifierHash = scryptSync(password, verifierSalt, 32, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  const encryptionSalt = randomBytes(16);
  const nonce = randomBytes(12);
  const encryptionKey = pbkdf2Sync(password, encryptionSalt, 600000, 32, 'sha256');
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, nonce);
  const plain = readFileSync(filename);
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final(), cipher.getAuthTag()]);
  plain.fill(0);
  encryptionKey.fill(0);
  password = ''; // best effort; strings cannot be reliably zeroed by JavaScript engines.

  const output = resolve('private-voice-output');
  mkdirSync(output, { recursive: true });
  writeFileSync(join(output, 'inside-of-me.enc'), encrypted, { flag: 'w', mode: 0o600 });
  const b64 = bytes => bytes.toString('base64');
  const sql = `-- Generated locally. Contains salted password VERIFIER and AES-GCM metadata; NEVER the plaintext password.\n-- Run AFTER supabase/private-voice-schema.sql and AFTER uploading inside-of-me.enc.\ninsert into public.private_voice_config (id, verifier_salt, verifier_hash, encryption_salt, encryption_iv, kdf_iterations, storage_path, media_type)\nvalues ('inside-of-me','${b64(verifierSalt)}','${b64(verifierHash)}','${b64(encryptionSalt)}','${b64(nonce)}',600000,'inside-of-me.enc','${type}')\non conflict (id) do update set verifier_salt=excluded.verifier_salt, verifier_hash=excluded.verifier_hash, encryption_salt=excluded.encryption_salt, encryption_iv=excluded.encryption_iv, kdf_iterations=excluded.kdf_iterations, storage_path=excluded.storage_path, media_type=excluded.media_type, updated_at=now();\n`;
  writeFileSync(join(output, 'private-voice-config.sql'), sql, { flag: 'w', mode: 0o600 });
  console.log(`\nEncrypted recording: ${join(output,'inside-of-me.enc')}`);
  console.log(`SQL metadata (NO plaintext password): ${join(output,'private-voice-config.sql')}`);
  console.log('IMPORTANT: keep the original recording, password, and recovery backups offline; never git-add this output folder.');
  console.log('If you run this tool again, it generates DIFFERENT encryption data. Upload the matching .enc and SQL together.');
} catch (error) {
  die(error?.message || 'Unable to encrypt recording.');
}
