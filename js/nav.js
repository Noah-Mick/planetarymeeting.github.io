/**
 * Two bits of navigation furniture, on every page and at every width:
 *
 *   1. A slide-out drawer menu, opened by the hamburger pinned top-right.
 *      It's a second route to the same pages for when you've scrolled past
 *      the header — the inline navigation under the logo is untouched.
 *   2. A back-to-top button that fades in once you've scrolled a screen.
 *
 * The drawer's contents are cloned at runtime from the header navigation and
 * the footer social list, so there is only ever one copy of those links in the
 * HTML and the two menus cannot drift apart. Adding a page means editing the
 * header nav in the seven HTML files, exactly as before — nothing extra here.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ drawer */

  var toggle = document.querySelector('.nav-toggle');
  var drawer = document.querySelector('.drawer');
  var overlay = document.querySelector('.drawer-overlay');

  if (toggle && drawer && overlay) {
    buildDrawer();

    var isOpen = false;

    function focusable() {
      return Array.prototype.slice.call(drawer.querySelectorAll('a[href], button'));
    }

    function open() {
      isOpen = true;
      drawer.classList.add('is-open');
      overlay.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('is-locked');

      // The drawer is visibility:hidden until the transition starts, and you
      // cannot focus inside a hidden subtree — so wait for the next frame.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var first = focusable()[0];
          if (first) first.focus();
        });
      });
    }

    function close(returnFocus) {
      isOpen = false;
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('is-locked');

      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener('click', function () {
      if (isOpen) close(true);
      else open();
    });

    overlay.addEventListener('click', function () { close(false); });

    // Following a link closes the drawer. Matters for same-page links, and
    // means the drawer isn't still open behind a slow page load.
    drawer.addEventListener('click', function (event) {
      if (event.target.closest('a')) close(false);
    });

    document.addEventListener('keydown', function (event) {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        close(true);
        return;
      }

      // Keep Tab inside the drawer while it's open.
      if (event.key === 'Tab') {
        var items = focusable();
        if (!items.length) return;

        var first = items[0];
        var last = items[items.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

  }

  /** Fill the empty drawer shell from the header nav and the footer socials. */
  function buildDrawer() {
    var sourceNav = document.querySelector('.nav__list');

    if (sourceNav) {
      var list = document.createElement('ul');
      list.className = 'drawer__list';

      sourceNav.querySelectorAll('a').forEach(function (link) {
        var item = document.createElement('li');
        var copy = link.cloneNode(true);
        copy.className = 'drawer__link';
        item.appendChild(copy);
        list.appendChild(item);
      });

      var nav = document.createElement('nav');
      nav.setAttribute('aria-label', 'Menu');
      nav.appendChild(list);
      drawer.appendChild(nav);
    }

    var social = document.querySelector('.footer .social');
    if (social) drawer.appendChild(social.cloneNode(true));
  }

  /* -------------------------------------------------------------- back to top */

  var toTop = document.querySelector('.to-top');

  if (toTop) {
    var showAfter = function () { return window.innerHeight * 0.75; };
    var ticking = false;

    function updateToTop() {
      toTop.classList.toggle('is-visible', window.scrollY > showAfter());
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateToTop);
    }, { passive: true });

    updateToTop();

    toTop.addEventListener('click', function () {
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });

      // Move focus to the top of the page too, so tabbing carries on from
      // there rather than from a button that has just faded out.
      var logo = document.querySelector('.masthead__logo');
      if (logo) logo.focus({ preventScroll: true });
    });
  }
})();
