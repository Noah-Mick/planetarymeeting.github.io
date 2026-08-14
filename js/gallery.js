/**
 * Renders a gallery from window.ARTWORK and wires up the lightbox.
 *
 * Markup contract — the page just needs:
 *   <div class="gallery" data-gallery="illustration"></div>
 * and the shared lightbox markup (see any gallery page).
 *
 * If scripts/optimize-images.js has been run, js/image-sizes.js exists and
 * supplies natural dimensions plus a signal that WebP thumbnails are available.
 * Without it the gallery still works, it just serves the full-size originals.
 */
(function () {
  'use strict';

  var ARTWORK = window.ARTWORK || {};
  var SIZES = window.IMAGE_SIZES || {};

  /**
   * Sketchbook pieces that were never named carry their camera filename
   * ("Photo Nov 28 2023, 6 55 59 PM"). Treat those as untitled rather than
   * captioning a photo with a timestamp.
   */
  function isUntitled(title) {
    return /^Photo\s+[A-Z][a-z]{2}\s+\d/.test(title);
  }

  function displayTitle(entry) {
    return isUntitled(entry.title) ? '' : entry.title;
  }

  /** images/illustration/Snow-Dogs.png -> images/illustration/thumb/Snow-Dogs.webp */
  function thumbPath(section, file) {
    return 'images/' + section + '/thumb/' + file.replace(/\.[^.]+$/, '') + '.webp';
  }

  function fullPath(section, file) {
    return 'images/' + section + '/' + file;
  }

  function buildItem(section, entry, index) {
    var item = document.createElement('div');
    item.className = 'gallery__item';

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'gallery__button';
    button.dataset.index = String(index);

    var title = displayTitle(entry);
    button.setAttribute('aria-label', 'View ' + (title || 'sketchbook page') + ' larger');

    var img = document.createElement('img');
    var dims = SIZES[section + '/' + entry.file];

    if (dims) {
      // Thumbnails exist. Reserve the exact box so lazy loading can't reflow
      // the masonry columns underneath the reader.
      img.src = thumbPath(section, entry.file);
      img.width = dims[0];
      img.height = dims[1];
      img.style.aspectRatio = dims[0] + ' / ' + dims[1];
    } else {
      img.src = fullPath(section, entry.file);
    }

    img.alt = title || 'Sketchbook page';
    img.loading = 'lazy';
    img.decoding = 'async';

    button.appendChild(img);

    if (title) {
      var caption = document.createElement('span');
      caption.className = 'gallery__caption';
      caption.textContent = title;
      button.appendChild(caption);
    }

    item.appendChild(button);
    return item;
  }

  function renderGallery(root) {
    var section = root.dataset.gallery;
    var entries = ARTWORK[section];

    if (!entries || !entries.length) {
      root.innerHTML = '<p>Nothing here yet.</p>';
      return [];
    }

    var fragment = document.createDocumentFragment();
    entries.forEach(function (entry, i) {
      fragment.appendChild(buildItem(section, entry, i));
    });
    root.appendChild(fragment);

    return entries;
  }

  /* ---------------------------------------------------------------- lightbox */

  function initLightbox(root, section, entries) {
    var box = document.getElementById('lightbox');
    if (!box) return;

    var img = box.querySelector('.lightbox__img');
    var caption = box.querySelector('.lightbox__caption');
    var counter = box.querySelector('.lightbox__counter');
    var current = 0;
    var lastFocused = null;

    function show(index) {
      current = (index + entries.length) % entries.length;
      var entry = entries[current];
      var title = displayTitle(entry);

      // The lightbox always gets the full-resolution original.
      img.src = fullPath(section, entry.file);
      img.alt = title || 'Sketchbook page';
      caption.textContent = title;
      counter.textContent = current + 1 + ' / ' + entries.length;
    }

    function open(index) {
      lastFocused = document.activeElement;
      show(index);
      box.classList.add('is-open');
      document.body.classList.add('is-locked');
      box.querySelector('.lightbox__btn--close').focus();
    }

    function close() {
      box.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      img.removeAttribute('src');
      if (lastFocused) lastFocused.focus();
    }

    root.addEventListener('click', function (event) {
      var button = event.target.closest('.gallery__button');
      if (button) open(Number(button.dataset.index));
    });

    box.querySelector('.lightbox__btn--close').addEventListener('click', close);
    box.querySelector('.lightbox__btn--prev').addEventListener('click', function () { show(current - 1); });
    box.querySelector('.lightbox__btn--next').addEventListener('click', function () { show(current + 1); });

    // Clicking the backdrop (but not the image itself) closes.
    box.addEventListener('click', function (event) {
      if (event.target === box || event.target.classList.contains('lightbox__figure')) close();
    });

    document.addEventListener('keydown', function (event) {
      if (!box.classList.contains('is-open')) return;
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowRight') show(current + 1);
      else if (event.key === 'ArrowLeft') show(current - 1);
    });

    // Swipe between pieces on touch devices.
    var touchX = null;
    box.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      touchX = null;
    }, { passive: true });
  }

  document.querySelectorAll('[data-gallery]').forEach(function (root) {
    var entries = renderGallery(root);
    if (entries.length) initLightbox(root, root.dataset.gallery, entries);
  });
})();
