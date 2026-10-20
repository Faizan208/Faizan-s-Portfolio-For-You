# INSIDE OF ME — Private Encrypted Voice Note

This patch adds a private audio-letter unlock dialog to the existing plain-HTML/CSS/JS portfolio. It is prepared for **Vercel Functions + Supabase Database and private Storage**. Nothing is publicly playable until you complete the steps below.

## Threat model (read before setup)

- The **plain audio never goes into GitHub, Vercel's public assets, or Supabase Storage**. Run the offline tool to encrypt it first.
- Supabase stores a **salted scrypt verifier**, separate encryption salt/nonce, media type, and path; NOT the password. The private bucket holds **AES-256-GCM ciphertext** only.
- The website has no hard-coded password, encryption key, Supabase service credentials, or direct audio link.
- Password verification happens in `api/private-voice.js` on Vercel, with database-backed attempt limits. It returns a signed URL for the **encrypted** blob only on success. The browser uses Web Crypto to decrypt the audio locally.
- The client deliberately doesn't save the password to localStorage, sessionStorage or cookies; it exists temporarily in memory while unlocking. No software can prevent an authorized listener from making a copy or recording the output.
- No system is **unhackable or guaranteed lifetime**. Supabase storage, Vercel, email accounts, domain names and account recovery depend on ongoing services. **Save at least two offline encrypted backups** along with the original audio/password/recovery instructions.
- The `Somebody` and `Future Faizan` choices are greeting/UX only. Both use the same private password and cannot establish a person's identity.
- The supplied rate limit is basic protection. For a publicly prominent site consider Vercel Firewall / WAF, a CAPTCHA and monitoring to resist distributed traffic.
- Frontend Web Crypto loads/decrypts the full file. This starter limits ciphertext to 30 MB (tool accepts plaintext up to 25 MB); a larger recording needs a streaming/chunked encryption protocol.

## Step 1 — Add the patch to your repo

Copy all patch files into your **`faizan-portfolio/` folder** (the Vercel Root Directory), maintaining the directory structure.

Changed existing files:
- `index.html`
- `css/style.css`

New files:
- `js/private-voice.js`
- `api/private-voice.js`
- `supabase/private-voice-schema.sql`
- `tools/prepare-private-voice.mjs`
- `PRIVATE_VOICE_SETUP.md`
- `.gitignore`

Do NOT add the original audio file to `assets`, `media`, `public`, or GitHub. The `<audio src="assets/images/Anuv Jain...">` reference has been removed from the audio section.

## Step 2 — Create the Supabase project

1. Create a project at https://supabase.com/dashboard (record project URL and keep the service-role key private).
2. Open **SQL Editor**. Paste/run `supabase/private-voice-schema.sql` once. This sets up `private_voice_config`, `voice_note_attempts`, `voice_note_rate_limit`, and a private `inside-of-me-private` Storage bucket.
3. In **Storage**, verify the `inside-of-me-private` bucket is listed **PRIVATE**. Do not enable public access, and don't create `SELECT` policies allowing `anon` or `authenticated` to read it.

## Step 3 — Encrypt your recording locally

Make sure Node.js 20+ is installed; this step is **only an offline utility**. The live website needs no npm install or frontend framework.

Open VS Code terminal inside your `faizan-portfolio/` folder. Example:

```powershell
node tools/prepare-private-voice.mjs "C:\Users\YOUR_USER\Music\my-private-recording.m4a"
```

The tool requests a **new private password twice without echoing its characters**. Use a strong unique randomly generated password of **at least 20 characters**, preferably 24–32 characters; don't recycle an account password. Store it in a trusted password manager and in a secure offline recovery kit before sharing it.

Output (intentionally excluded by `.gitignore`):

```
private-voice-output/
  inside-of-me.enc          # Encrypted audio, safe to upload privately
  private-voice-config.sql # Hash/salt/encryption metadata, NO plaintext password
```

Do not send the plain recording or password to anyone assisting you with setup. Do not paste the password into this chat.

> Never run this tool to regenerate the encryption without uploading **both** new files together. New random salts and nonce mean the old DB metadata won't decrypt the new audio, and vice versa.

## Step 4 — Upload only the encrypted recording

1. Supabase Dashboard → Storage → bucket **`inside-of-me-private`**.
2. Upload only `private-voice-output/inside-of-me.enc` (file name must be exactly `inside-of-me.enc`). The content type should be `application/octet-stream`.
3. Open SQL Editor and run the **generated** `private-voice-output/private-voice-config.sql` (it contains the salted verifier, NOT the password). Make sure the bucket upload and SQL belong to the same encryption run.
4. Keep the `.enc` file, source audio, and password in a secure backup location for long-term preservation. Do not leave your only copy in one cloud service.

## Step 5 — Add Vercel environment variables

In the Vercel project that hosts `faizan-portfolio/`, go to **Settings → Environment Variables**. Add these variables **for Preview first**, and for Production after testing:

| Name | Value |
|---|---|
| `SUPABASE_URL` | Your project's HTTPS URL from Supabase project settings, without trailing `/` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase's **secret service_role** key. Never in HTML, JS, GitHub or screenshots. |
| `VOICE_RATE_LIMIT_SECRET` | A new random secret of at least 32 characters, generated below. |

Generate the `VOICE_RATE_LIMIT_SECRET` on your computer:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Save it directly in **Vercel environment variables**. Don't commit it or share it in chat. Vercel must redeploy after the env vars are added.

## Step 6 — Deploy and test using a pull request

1. Create a Git branch, apply these patch files, commit only the safe source files, push the branch, and open a pull request.
2. Wait until Vercel Preview is **Ready** (Root Directory is still `faizan-portfolio`).
3. Test: click `Unlock Voice Note` → `Somebody` → enter wrong password → denied. Test `Future Faizan` greeting and correct password → player loads the recording.
4. In a private window, inspect public page source and browser network: there should be **no `.mp3/.m4a` URL** on the webpage; the private bucket should not allow anonymous listing/downloading.
5. Verify SQL injection-like input such as `' OR 1=1 --` is treated as an incorrect password. The backend uses REST/RPC parameters rather than interpolating SQL strings.
6. Verify excessive incorrect attempts are rate limited. This rate limiter applies across instances and uses pseudonymous HMAC IP fingerprints; do not rely on rate limiting alone to protect a weak password.
7. If the preview works, merge the PR into `main`. Add the same environment variables to Production, redeploy Production, and test at the production URL.

## Important limitations / ongoing maintenance

- A signed download URL is briefly visible **after successful authentication**, but it points to ciphertext, not playable audio.
- Anyone you share the correct password with can unlock, record, or save the message. Password rotation means **re-encrypting the recording** with a new secret and updating Supabase metadata/upload together.
- Long-term availability must be maintained: periodically check your Supabase project and Vercel deployments, take offline backups, and preserve account recovery details.
- If Vercel environment variables are missing or Supabase setup isn't complete, the dialog intentionally fails closed with `Private archive is temporarily unavailable` rather than falling back to public audio.
- These files were **not deployed to your account or tested against a live Supabase project**. You must complete the setup above and run a live verification.
