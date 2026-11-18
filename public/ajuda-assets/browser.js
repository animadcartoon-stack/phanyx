const root = document.querySelector('#app');
root.querySelector('#locale').addEventListener('change', event => {
  location.assign(event.target.value + location.hash);
});
const dialog = root.querySelector('dialog');
const image = dialog.querySelector('img');
const viewport = dialog.querySelector('.image-viewport');
const output = dialog.querySelector('output');
let scale = 1, fitted = true, trigger, drag;
const clamp = value => Math.min(8, Math.max(0.1, value));
function zoom(next, x = viewport.clientWidth / 2, y = viewport.clientHeight / 2) {
  if (!image.naturalWidth) return;
  const oldWidth = image.naturalWidth * scale, oldHeight = image.naturalHeight * scale;
  const anchorX = (viewport.scrollLeft + x - Math.max(0, (viewport.clientWidth - oldWidth) / 2)) / scale;
  const anchorY = (viewport.scrollTop + y - Math.max(0, (viewport.clientHeight - oldHeight) / 2)) / scale;
  scale = clamp(next);
  const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
  image.style.width = width + 'px'; image.style.height = height + 'px';
  viewport.scrollLeft = anchorX * scale + Math.max(0, (viewport.clientWidth - width) / 2) - x;
  viewport.scrollTop = anchorY * scale + Math.max(0, (viewport.clientHeight - height) / 2) - y;
  output.value = Math.round(scale * 100) + '%';
  dialog.querySelector('[data-zoom="out"]').disabled = scale <= 0.1;
  dialog.querySelector('[data-zoom="in"]').disabled = scale >= 8;
}
function fit() {
  if (!image.naturalWidth) return;
  fitted = true;
  zoom(Math.min(1, (viewport.clientWidth - 2) / image.naturalWidth, (viewport.clientHeight - 2) / image.naturalHeight));
  viewport.scrollTo(0, 0);
}
image.addEventListener('load', () => {if (fitted) fit(); else zoom(scale);});
root.addEventListener('click', event => {
  const button = event.target.closest('[data-image]');
  if (!button) return;
  trigger = button;
  fitted = true;
  scale = 1;
  image.removeAttribute('style');
  image.alt = button.dataset.description;
  image.src = button.dataset.image;
  dialog.showModal();
  if (image.complete) fit();
});
dialog.addEventListener('click', event => {
  const action = event.target.closest('[data-zoom]')?.dataset.zoom;
  if (!action) return;
  if (action === 'fit') return fit();
  fitted = false;
  zoom(action === 'actual' ? 1 : scale * (action === 'in' ? 1.25 : 0.8));
});
viewport.addEventListener('wheel', event => {
  event.preventDefault();
  fitted = false;
  const bounds = viewport.getBoundingClientRect();
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1);
  zoom(scale * Math.exp(-Math.max(-240, Math.min(240, delta)) * 0.002), event.clientX - bounds.left, event.clientY - bounds.top);
}, {passive:false});
viewport.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  drag = {id:event.pointerId,x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};
  viewport.setPointerCapture(event.pointerId);
  viewport.classList.add('dragging');
});
viewport.addEventListener('pointermove', event => {
  if (!drag || drag.id !== event.pointerId) return;
  viewport.scrollLeft = drag.left + drag.x - event.clientX;
  viewport.scrollTop = drag.top + drag.y - event.clientY;
});
function endDrag() {drag = null; viewport.classList.remove('dragging');}
viewport.addEventListener('pointerup', endDrag);
viewport.addEventListener('pointercancel', endDrag);
viewport.addEventListener('lostpointercapture', endDrag);
dialog.addEventListener('keydown', event => {
  if (event.key === '0') {event.preventDefault(); fit();}
  else if (['+', '=', '-'].includes(event.key)) {
    event.preventDefault(); fitted = false; zoom(scale * (event.key === '-' ? 0.8 : 1.25));
  }
});
dialog.addEventListener('close', () => {endDrag(); trigger?.focus();});
new ResizeObserver(() => {if (dialog.open && fitted) fit();}).observe(viewport);
