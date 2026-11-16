/* Project Inquiry — validates locally and submits via /api/inquiry on Vercel. */
(() => {
  'use strict';
  const form = document.getElementById('projectInquiryForm');
  const success = document.getElementById('inquirySuccess');
  const status = document.getElementById('inquiryFormStatus');
  if (!form || !success) return;

  const fields = {
    clientName: document.getElementById('clientName'),
    clientEmail: document.getElementById('clientEmail'),
    projectType: document.getElementById('projectType'),
    projectDescription: document.getElementById('projectDescription'),
    projectReference: document.getElementById('projectReference'),
    demoAge: document.getElementById('demoAge'),
    demoStartDate: document.getElementById('demoStartDate')
  };
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function errorFor(input) {
    const value = input.value.trim();
    if (input.id === 'demoAge' && !input.validity.valid) return 'Use a whole number from 1 to 120, or leave this demonstration blank.';
    if (input.id === 'demoStartDate' && !input.validity.valid) return 'Choose a valid sample date, or leave this demonstration blank.';
    if (input.required && !value) {
      return {
        clientName: 'Please enter your name.',
        clientEmail: 'Please enter your email address.',
        projectType: 'Please select your project type.',
        projectDescription: 'Please tell me about your project.'
      }[input.id] || 'This field is required.';
    }
    if (input.id === 'clientName' && value && value.length < 2) return 'Please enter at least 2 characters.';
    if (input.id === 'clientEmail' && value && (!emailPattern.test(value) || input.validity.typeMismatch)) return 'Please enter a valid email address.';
    if (input.id === 'projectReference' && value) {
      try {
        const url = new URL(value);
        if (!['https:', 'http:'].includes(url.protocol) || !url.hostname.includes('.')) return 'Enter a complete URL starting with https://';
      } catch { return 'Enter a complete URL starting with https://'; }
    }
    return '';
  }

  function validate(input) {
    const message = errorFor(input);
    const container = input.closest('.inquiry-field');
    const errorElement = document.getElementById(`${input.id}Error`);
    if (container) container.classList.toggle('is-invalid', Boolean(message));
    if (errorElement) errorElement.textContent = message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    return !message;
  }

  Object.values(fields).forEach(input => {
    if (!input) return;
    input.addEventListener('blur', () => validate(input));
    input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'input', () => {
      if (input.hasAttribute('aria-invalid')) validate(input);
    });
  });

  let sending=false;
  let revealTimer;
  const submit = form.querySelector('[type="submit"]');
  const reset = form.querySelector('[type="reset"]');
  const demoPassword = document.getElementById('demoPassword');
  form.addEventListener('reset', event => {
    // Keep the in-flight request and its loading state consistent.
    if (sending) { event.preventDefault(); return; }
    clearTimeout(revealTimer);
    form.querySelectorAll('.is-invalid').forEach(element => element.classList.remove('is-invalid'));
    form.querySelectorAll('[aria-invalid]').forEach(element => element.removeAttribute('aria-invalid'));
    form.querySelectorAll('.inquiry-error').forEach(element => { element.textContent = ''; });
    form.querySelectorAll('input, select, textarea').forEach(element => element.setCustomValidity(''));
    if (status) { status.textContent = ''; status.classList.remove('is-error'); }
    form.classList.remove('is-exiting');
    form.hidden = false;
    success.hidden = true;
    document.querySelector('.inquiry-content')?.classList.remove('is-complete');
    if (submit) submit.disabled = false;
    if (reset) reset.disabled = false;
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    if (demoPassword) demoPassword.value = '';
    let firstInvalid=null;
    for (const input of Object.values(fields)) if (input && !validate(input) && !firstInvalid) firstInvalid=input;
    if (firstInvalid) { if(status) status.textContent='Please correct the highlighted fields.';firstInvalid.focus();return; }
    sending=true;if(submit)submit.disabled=true;
    if(reset)reset.disabled=true;
    if(status){status.classList.remove('is-error');status.textContent='Sending your inquiry…';}
    // Only API-supported inquiry fields may leave the browser. Demo values
    // (especially password and age) are never read into the payload.
    const payload = {};
    for (const name of ['fullName', 'email', 'projectType', 'description', 'budget', 'timeline', 'referenceUrl']) {
      payload[name] = form.elements.namedItem(name).value.trim();
    }
    try {
      const response=await fetch('/api/inquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const result=await response.json().catch(()=>({}));
      if(!response.ok || !result.ok) throw new Error(result.error || 'Could not send inquiry.');
      if(status) status.textContent='Your inquiry was sent successfully.';
      form.classList.add('is-exiting');
      const reveal=()=>{
        form.hidden=true;
        document.querySelector('.inquiry-content')?.classList.add('is-complete');
        success.hidden=false;
        success.focus({preventScroll:true});
        success.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
      };
      if(matchMedia('(prefers-reduced-motion: reduce)').matches)reveal();else revealTimer=setTimeout(reveal,220);
    } catch(error) {
      if(status) {status.classList.add('is-error');status.textContent=error.message+' No information was confirmed as delivered.';}
      if(submit)submit.disabled=false;
    } finally { sending=false;if(reset)reset.disabled=false; }
  });
})();
