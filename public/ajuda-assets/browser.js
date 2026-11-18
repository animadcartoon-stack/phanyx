const root = document.querySelector('#app');

root.querySelector('#locale').addEventListener('change', event => {
  location.assign(event.target.value + location.hash);
});

root.addEventListener('click', event => {
  const trigger = event.target.closest('[data-image]');
  if (!trigger) return;

  const dialog = root.querySelector('dialog');
  const image = dialog.querySelector('img');
  image.src = trigger.dataset.image;
  image.alt = trigger.dataset.description;
  dialog.showModal();
});
