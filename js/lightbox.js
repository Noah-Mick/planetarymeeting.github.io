// === Lightbox Functionality ===
const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox.querySelector('img');
const caption = lightbox.querySelector('.lightbox-caption');
const images = Array.from(document.querySelectorAll('.gallery img'));
let currentIndex = 0;

function openLightbox(index) {
  currentIndex = index;
  const img = images[index];
  lightboxImg.src = img.src;
  caption.innerHTML = `<strong>${img.dataset.title}</strong><br>${img.dataset.description}`;
  lightbox.classList.add('active');
}

function closeLightbox() {
  lightbox.classList.remove('active');
}

function showNext() {
  currentIndex = (currentIndex + 1) % images.length;
  openLightbox(currentIndex);
}

function showPrev() {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  openLightbox(currentIndex);
}

// Event listeners
images.forEach((img, index) => {
  img.addEventListener('click', () => openLightbox(index));
});

lightbox.querySelector('.close').addEventListener('click', closeLightbox);
lightbox.querySelector('.next').addEventListener('click', showNext);
lightbox.querySelector('.prev').addEventListener('click', showPrev);

lightbox.addEventListener('click', e => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') showNext();
  if (e.key === 'ArrowLeft') showPrev();
});
