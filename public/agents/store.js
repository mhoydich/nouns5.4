const cards = [...document.querySelectorAll('.poster-card')];
const posters = cards.map((card) => ({
  id: card.dataset.id,
  title: card.querySelector('h3').textContent,
  category: card.dataset.category,
  src: card.querySelector('[data-poster]').getAttribute('href'),
  alt: card.querySelector('img').alt,
  width: 1024,
  height: 1536,
}));
const featuredPosters = [...document.querySelectorAll('[data-featured-poster]')].map((link) => ({
  id: link.dataset.poster,
  title: link.dataset.title,
  src: link.getAttribute('href'),
  alt: link.querySelector('img').alt,
  width: 1536,
  height: 1024,
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
  dialogImage.width = poster.width;
  dialogImage.height = poster.height;
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
    dialogPosters = link.hasAttribute('data-featured-poster') ? featuredPosters : visiblePosters;
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
const fields = document.getElementById('request-fields');
const submitButton = form.querySelector('[type="submit"]');
const submitLabel = document.getElementById('request-submit-label');
const status = document.getElementById('form-status');
const requestState = document.getElementById('request-state');
const errorContact = document.getElementById('request-error-contact');
const receiptSection = document.getElementById('request-receipt');
const receiptId = document.getElementById('receipt-id');
const receiptCopyStatus = document.getElementById('receipt-copy-status');
const receiptEmailLink = document.getElementById('receipt-email-link');
let requestPayload = null;
let pending = false;
let received = false;

function resetRequestState() {
  if (pending) return;
  requestPayload = null;
  received = false;
  receiptSection.hidden = true;
  receiptId.textContent = '';
  receiptCopyStatus.textContent = '';
  errorContact.hidden = true;
  requestState.textContent = 'NOT YET SENT';
  submitButton.disabled = false;
  submitLabel.textContent = 'Send my request';
  status.textContent = 'Sending a request does not book a session or take a payment.';
}

document.querySelectorAll('[data-service]').forEach((link) => link.addEventListener('click', () => {
  if (pending) return;
  if (service.value !== link.dataset.service) {
    service.value = link.dataset.service;
    resetRequestState();
  }
}));
form.addEventListener('input', resetRequestState);
form.addEventListener('change', resetRequestState);

function preparePayload() {
  const data = new FormData(form);
  return {
    requestId: crypto.randomUUID(),
    name: String(data.get('name') || '').trim(),
    email: String(data.get('email') || '').trim(),
    task: String(data.get('task') || '').trim(),
    tools: String(data.get('tools') || '').trim(),
    success: String(data.get('success') || '').trim(),
    offer: String(data.get('offer')),
    privacyConsent: data.get('privacyConsent') === 'on',
    companyWebsite: String(data.get('companyWebsite') || ''),
  };
}

function showReceipt(data) {
  received = true;
  requestState.textContent = 'RECEIVED';
  status.textContent = 'Request received. Save the reference below. This is not a confirmed booking or payment.';
  receiptId.textContent = data.receipt.id;
  const subject = `Hoydich Industries request ${data.receipt.id}`;
  receiptEmailLink.href = `mailto:mh@pointcast.xyz?subject=${encodeURIComponent(subject)}`;
  const customerNotice = data.notification?.customer;
  document.getElementById('receipt-email-note').textContent = customerNotice === 'sent'
    ? 'A confirmation email has been sent. Save this reference too.'
    : customerNotice === 'failed'
      ? 'We couldn’t send the confirmation email. Your request is still saved; please save this reference.'
      : customerNotice === 'unavailable'
        ? 'No email confirmation was sent. Please save this reference.'
        : 'Email confirmation wasn’t confirmed. Please save this reference.';
  const ownerNote = document.getElementById('receipt-owner-note');
  const ownerNotice = data.notification?.owner;
  ownerNote.hidden = ownerNotice === 'sent';
  ownerNote.dataset.notice = ownerNotice || 'unknown';
  ownerNote.textContent = ownerNotice === 'unavailable'
    ? 'Your request is saved for manual review. You can also email Mike with this reference.'
    : ownerNotice === 'failed'
      ? 'Your request is saved, but we couldn’t send the notification to our team. You can also email Mike with this reference.'
      : 'Your request is saved, but the notification to our team wasn’t confirmed. You can also email Mike with this reference.';
  receiptSection.hidden = false;
  receiptSection.focus({ preventScroll: true });
  receiptSection.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (pending || received || !form.reportValidity()) return;
  pending = true;
  errorContact.hidden = true;
  status.textContent = 'Sending your request…';
  requestState.textContent = 'SENDING';
  submitLabel.textContent = 'Sending…';
  let timeout;
  try {
    // The same in-memory request is retried after an uncertain response.
    requestPayload ||= preparePayload();
    fields.disabled = true;
    submitButton.disabled = true;
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 25000);
    const response = await fetch('/api/agent-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    const validReceipt = data.received === true
      && typeof data.receipt?.id === 'string'
      && data.receipt.id.length > 0
      && data.receipt.status === 'received';
    if (![200, 201].includes(response.status) || !validReceipt) {
      throw new Error(typeof data.error === 'string' ? data.error : 'We couldn’t confirm that the request was received.');
    }
    showReceipt(data);
  } catch (error) {
    requestState.textContent = 'NOT CONFIRMED';
    const message = error instanceof Error && error.name !== 'AbortError' && error.message !== 'Failed to fetch'
      ? error.message
      : 'We couldn’t confirm that the request was received.';
    status.textContent = `${message} Your details are still here. Try again to check the same request, or email us.`;
    errorContact.hidden = false;
  } finally {
    clearTimeout(timeout);
    pending = false;
    fields.disabled = false;
    submitButton.disabled = received;
    submitLabel.textContent = received ? 'Request received' : 'Send my request';
  }
});

document.getElementById('copy-reference').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(receiptId.textContent);
    receiptCopyStatus.textContent = 'Reference copied.';
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(receiptId);
    selection.removeAllRanges();
    selection.addRange(range);
    receiptCopyStatus.textContent = 'Reference selected. Use your device’s Copy command.';
  }
});
submitButton.disabled = false;
