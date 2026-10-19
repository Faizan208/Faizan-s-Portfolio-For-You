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
    projectReference: document.getElementById('projectReference')
  };
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function errorFor(input) {
    const value = input.value.trim();
    if (input.required && !value) {
      return {
        clientName: 'Please enter your name.',
        clientEmail: 'Please enter your email address.',
        projectType: 'Please select your project type.',
        projectDescription: 'Please tell me about your project.'
      }[input.id] || 'This field is required.';
    }
    if (input.id === 'clientName' && value && value.length < 2) return 'Please enter at least 2 characters.';
    if (input.id === 'clientEmail' && value && !emailPattern.test(value)) return 'Please enter a valid email address.';
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
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    let firstInvalid=null;
    for (const input of Object.values(fields)) if (input && !validate(input) && !firstInvalid) firstInvalid=input;
    if (firstInvalid) { if(status) status.textContent='Please correct the highlighted fields.';firstInvalid.focus();return; }
    const submit=form.querySelector('[type="submit"]');
    sending=true;if(submit)submit.disabled=true;
    if(status){status.classList.remove('is-error');status.textContent='Sending your inquiry…';}
    const payload=Object.fromEntries(new FormData(form));
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
      if(matchMedia('(prefers-reduced-motion: reduce)').matches)reveal();else setTimeout(reveal,220);
    } catch(error) {
      if(status) {status.classList.add('is-error');status.textContent=error.message+' No information was confirmed as delivered.';}
      if(submit)submit.disabled=false;
    } finally { sending=false; }
  });
})();
