/**
 * Contact form.
 *
 * A static site cannot receive form posts by itself, so the form needs a
 * third-party endpoint. Nothing is wired up yet — set ENDPOINT below and the
 * form starts working. Until then the page says so plainly rather than
 * pretending to send and quietly dropping messages.
 *
 * To switch it on with Formspree (free tier, handles file attachments):
 *   1. Sign up at https://formspree.io and create a form.
 *   2. Copy the form ID it gives you (looks like "xyzabcde").
 *   3. Set:  var ENDPOINT = 'https://formspree.io/f/xyzabcde';
 *
 * Any service that accepts a multipart POST works the same way — Formspark,
 * Web3Forms, Netlify Forms, or your own handler.
 */
(function () {
  'use strict';

  var ENDPOINT = '';   // <- paste your form endpoint here

  var form = document.getElementById('contact-form');
  if (!form) return;

  var button = form.querySelector('button[type="submit"]');

  function notice(text, replaceForm) {
    var el = document.createElement('p');
    el.className = 'form-notice';
    el.setAttribute('role', 'status');
    el.textContent = text;

    if (replaceForm) {
      form.replaceWith(el);
    } else {
      form.insertBefore(el, form.firstChild);
    }
    return el;
  }

  if (!ENDPOINT) {
    // Not configured. Show the form so the layout can be reviewed, but make it
    // obvious that nothing would be delivered, and disable sending.
    notice(
      'This form is not connected yet, so nothing sent here would reach anyone. ' +
      'Please email planetarymeeting directly, or message on Instagram, until it is set up. ' +
      '(Developer note: set ENDPOINT in js/contact.js.)'
    );
    button.disabled = true;
    button.textContent = 'Not connected yet';
    return;
  }

  form.action = ENDPOINT;

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    button.disabled = true;
    button.textContent = 'Sending…';

    fetch(ENDPOINT, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        notice('Thanks! Your message is on its way. I will get back to you soon:)', true);
      })
      .catch(function () {
        button.disabled = false;
        button.textContent = 'Send';
        notice('Something went wrong sending that. Please try again, or reach out on Instagram.');
      });
  });
})();
