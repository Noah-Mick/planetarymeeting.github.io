/** Site-wide odds and ends. Loaded on every page. */
(function () {
  'use strict';

  // Keep the footer copyright current without anyone having to remember.
  var year = String(new Date().getFullYear());
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = year;
  });
})();
