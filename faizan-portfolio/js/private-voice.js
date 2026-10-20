/* INSIDE OF ME: password-gated encrypted audio. No secret or file URL appears in public code. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const open = $('voiceVaultOpen');
  const dialog = $('voiceVaultDialog');
  if (!open || !dialog) return;

  const close = $('voiceVaultClose');
  const back = $('voiceVaultBack');
  const roles = $('voiceVaultRoles');
  const form = $('voiceVaultForm');
  const input = $('voiceVaultPassword');
  const status = $('voiceVaultStatus');
  const submit = $('voiceVaultSubmit');
  const player = $('voiceVaultPlayer');
  const playback = $('voiceVaultPlayback');
  const forFuture = $('voiceVaultWelcome');
  const forSomebody = $('voiceVaultSomebody');
  let role = '';
  let objectUrl = null;
  let controller = null;
  let taskId = 0;

  function clearMedia() {
    player.pause();
    player.removeAttribute('src');
    player.load();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
    playback.hidden = true;
  }
  function reset() {
    ++taskId;
    controller?.abort();
    controller = null;
    role = '';
    input.value = '';
    status.textContent = '';
    roles.hidden = false;
    form.hidden = true;
    forFuture.hidden = true;
    forSomebody.hidden = true;
    submit.disabled = false;
    submit.textContent = 'UNLOCK LETTER ↗';
    clearMedia();
  }
  function decodeBase64(value) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9+/]+=*$/.test(value)) throw new Error('Invalid encryption metadata');
    return Uint8Array.from(atob(value), c => c.charCodeAt(0));
  }
  async function decryptAudio(ciphertext, password, details) {
    // Encryption and verifier KDF use different random salts and separate algorithms.
    const salt = decodeBase64(details.salt);
    const iv = decodeBase64(details.iv);
    if (salt.length !== 16 || iv.length !== 12 || details.iterations !== 600000) {
      throw new Error('Unsupported encryption metadata');
    }
    const encoded = new TextEncoder().encode(password);
    const material = await crypto.subtle.importKey('raw', encoded, 'PBKDF2', false, ['deriveKey']);
    encoded.fill(0);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: details.iterations, hash: 'SHA-256' },
      material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
    );
    return await crypto.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, ciphertext);
  }
  open.addEventListener('click', () => {
    reset();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else { status.textContent = 'A modern browser is required to open this letter.'; return; }
    dialog.querySelector('[data-voice-audience]')?.focus();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', reset);
  back.addEventListener('click', () => {
    ++taskId;
    controller?.abort();
    controller = null;
    role = '';
    input.value = '';
    status.textContent = '';
    form.hidden = true;
    roles.hidden = false;
    clearMedia();
    roles.querySelector('button')?.focus();
  });
  dialog.querySelectorAll('[data-voice-audience]').forEach(button => {
    button.addEventListener('click', () => {
      role = button.dataset.voiceAudience;
      roles.hidden = true;
      form.hidden = false;
      forFuture.hidden = role !== 'future';
      forSomebody.hidden = role !== 'somebody';
      input.focus();
    });
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!role || submit.disabled) return;
    let password = input.value;
    input.value = ''; // The app never saves the password to localStorage, cookies, or a URL.
    if (!password) {
      status.textContent = 'Enter the private password to continue.';
      return;
    }
    const thisTask = ++taskId;
    controller?.abort();
    controller = new AbortController();
    submit.disabled = true;
    submit.textContent = 'OPENING YOUR LETTER…';
    status.textContent = 'Verifying your password…';
    clearMedia();
    try {
      if (!window.crypto?.subtle || !window.isSecureContext) throw new Error('HTTPS is required to unlock this recording.');
      const result = await fetch('/api/private-voice', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, audience: role }),
        signal: controller.signal
      });
      if (thisTask !== taskId) return;
      if (!result.ok) {
        if (result.status === 401) throw new Error('That password is not correct. Please try again.');
        if (result.status === 429) throw new Error('Too many attempts. Please try again in 15 minutes.');
        throw new Error('The private archive is temporarily unavailable. Please try again later.');
      }
      const details = await result.json();
      const encrypted = await fetch(details.url, { cache: 'no-store', signal: controller.signal });
      if (!encrypted.ok) throw new Error('Unable to retrieve the private recording. Please try again.');
      const ciphertext = await encrypted.arrayBuffer();
      if (ciphertext.byteLength > 30 * 1024 * 1024) throw new Error('This recording exceeds the player size limit.');
      status.textContent = 'Decrypting locally on your device…';
      const plaintext = await decryptAudio(ciphertext, password, details);
      if (thisTask !== taskId) return;
      objectUrl = URL.createObjectURL(new Blob([plaintext], { type: details.mediaType || 'audio/mpeg' }));
      player.src = objectUrl;
      playback.hidden = false;
      status.textContent = 'Your letter is ready. Press play when you are ready.';
      player.focus();
    } catch (error) {
      if (error?.name === 'AbortError' || thisTask !== taskId) return;
      // Never print entered passwords, encrypted payloads or signed URLs to logs.
      status.textContent = error?.name === 'OperationError'
        ? 'This recording could not be decrypted. Please check the password.'
        : (error.message || 'Unable to unlock the note.');
    } finally {
      password = '';
      if (thisTask === taskId) {
        submit.disabled = false;
        submit.textContent = 'UNLOCK LETTER ↗';
        controller = null;
      }
    }
  });
})();
