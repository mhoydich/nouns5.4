const cards = [...document.querySelectorAll('.poster-card')];
const posters = cards.map((card) => ({
  id: card.dataset.id,
  title: card.querySelector('h3').textContent,
  category: card.dataset.category,
  src: card.querySelector('[data-poster]').getAttribute('href'),
  alt: card.querySelector('img').alt,
}));
const filters = document.querySelector('.filters');
const filterButtons = [...filters.querySelectorAll('button')];
const galleryStatus = document.getElementById('gallery-status');
let visiblePosters = posters;
filters.hidden = false;
filterButtons.forEach((button) => button.addEventListener('click', () => {
  const category = button.dataset.filter;
  filterButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  cards.forEach((card) => { card.hidden = category !== 'all' && card.dataset.category !== category; });
  visiblePosters = posters.filter((poster) => category === 'all' || poster.category === category);
  galleryStatus.textContent = `${visiblePosters.length} advertisements${category === 'all' ? '' : ` · ${button.textContent}`}`;
}));

const dialog = document.getElementById('poster-dialog');
const dialogImage = document.getElementById('dialog-image');
const dialogTitle = document.getElementById('dialog-title');
const dialogPosition = document.getElementById('dialog-position');
const openFile = document.getElementById('open-poster-file');
let currentId = null;
let dialogPosters = posters;
let previousOverflow = '';

function showPoster(id) {
  const index = dialogPosters.findIndex((poster) => poster.id === id);
  const poster = dialogPosters[index];
  if (!poster) return;
  currentId = id;
  dialogImage.src = poster.src;
  dialogImage.alt = poster.alt;
  dialogTitle.textContent = poster.title;
  dialogPosition.textContent = `${index + 1} / ${dialogPosters.length}`;
  openFile.href = poster.src;
}
function movePoster(direction) {
  const index = dialogPosters.findIndex((poster) => poster.id === currentId);
  showPoster(dialogPosters[(index + direction + dialogPosters.length) % dialogPosters.length].id);
}
if (typeof dialog.showModal === 'function') {
  document.querySelectorAll('[data-poster]').forEach((link) => link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    dialogPosters = visiblePosters.some((poster) => poster.id === link.dataset.poster) ? visiblePosters : posters;
    showPoster(link.dataset.poster);
    previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  }));
  document.getElementById('close-poster').addEventListener('click', () => dialog.close());
  document.getElementById('previous-poster').addEventListener('click', () => movePoster(-1));
  document.getElementById('next-poster').addEventListener('click', () => movePoster(1));
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      movePoster(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  dialog.addEventListener('close', () => { document.body.style.overflow = previousOverflow; });
}

const form = document.getElementById('task-form');
const service = document.getElementById('service');
const preview = document.getElementById('request-preview');
const requestText = document.getElementById('request-text');
const status = document.getElementById('form-status');
const emailLink = document.getElementById('open-email');
form.querySelector('[type="submit"]').disabled = false;

function clearPreview() {
  preview.hidden = true;
  requestText.value = '';
  emailLink.href = 'mailto:mh@pointcast.xyz';
  status.textContent = 'Nothing is sent by this page. Prepare your updated note when you are ready.';
}
document.querySelectorAll('[data-service]').forEach((link) => link.addEventListener('click', () => {
  service.value = link.dataset.service;
  clearPreview();
}));
form.addEventListener('input', (event) => {
  if (event.target !== requestText && !preview.hidden) clearPreview();
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const brief = [
    'HOYDICH INDUSTRIES — ONE USEFUL TASK', '',
    'What I would like help with:', String(data.get('task')).trim(), '',
    'Tools involved:', String(data.get('tools')).trim() || 'To discuss', '',
    'Starting point:', String(data.get('service')), '',
    'Reply email:', String(data.get('email')).trim(), '',
    'Prepared at https://www.industrynext.xyz/agents/',
    'This is a request to discuss fit and scope, not a confirmed booking.',
  ].join('\n');
  requestText.value = brief;
  emailLink.href = `mailto:mh@pointcast.xyz?subject=${encodeURIComponent('Hoydich Industries — one useful task')}&body=${encodeURIComponent(brief)}`;
  preview.hidden = false;
  status.textContent = 'Your note is prepared below. Nothing has been sent. Review it, then open your email app or copy it.';
  requestText.focus({ preventScroll: true });
  preview.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
});
document.getElementById('copy-request').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(requestText.value);
    status.textContent = 'Note copied. Paste it into an email to mh@pointcast.xyz when you are ready. Nothing has been sent.';
  } catch {
    requestText.focus();
    requestText.select();
    status.textContent = 'The note is selected. Use your device’s Copy command, then email it to mh@pointcast.xyz. Nothing has been sent.';
  }
});
