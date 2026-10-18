/* Project Inquiry — client-side validation and demonstration confirmation only.
   Nothing is transmitted, stored, logged, or sent to an external service. */
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

  form.addEventListener('submit', event => {
    event.preventDefault();
    let firstInvalid = null;
    for (const input of Object.values(fields)) {
      if (input && !validate(input) && !firstInvalid) firstInvalid = input;
    }
    if (firstInvalid) {
      if (status) status.textContent = 'Please correct the highlighted fields.';
      firstInvalid.focus();
      return;
    }
    if (status) status.textContent = '';
    form.classList.add('is-exiting');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reveal = () => {
      form.hidden = true;
      document.querySelector('.inquiry-content')?.classList.add('is-complete');
      success.hidden = false;
      success.focus({ preventScroll: true });
      success.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'center' });
      // Form data is intentionally not collected or transmitted.
    };
    if (reduceMotion) reveal();
    else window.setTimeout(reveal, 220);
  });
})();
