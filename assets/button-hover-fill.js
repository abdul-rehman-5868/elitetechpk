const buttonSelector = [
  '.button:not(.button-unstyled, .close-button)',
  '.button-secondary:not(.button-unstyled)',
  '.button-custom',
  '.product-faqs__submit',
  '.peek-slide__button',
  '.story-collection-section__button[href]',
  '.immersive-video-banner__button[href]',
  '.parallax-sale-banner__button[href]',
  '.bundle-builder__add-button',
  '.hps__cta',
  '.bss-card__cta',
].join(',');

const leaveTimers = new WeakMap();

function getAnimatedButton(target) {
  if (!(target instanceof Element)) return null;
  const button = target.closest(buttonSelector);
  if (!button) return null;
  // Buy it now / payment buttons use fade, not eclipse fill.
  if (
    button.closest('shopify-accelerated-checkout') ||
    button.classList.contains('shopify-payment-button__button') ||
    button.closest('.shopify-payment-button')
  ) {
    return null;
  }
  return button;
}

function enterButton(button) {
  const timer = leaveTimers.get(button);
  if (timer) window.clearTimeout(timer);

  button.classList.remove('is-fill-leaving');
}

function leaveButton(button) {
  button.classList.remove('is-fill-leaving');
  // Restart the exit keyframe even after quick repeat hovers.
  void button.offsetWidth;
  button.classList.add('is-fill-leaving');

  const leaveMs = button.closest('.quick-add-modal') ? 480 : 520;
  const timer = window.setTimeout(() => {
    button.classList.remove('is-fill-leaving');
    leaveTimers.delete(button);
  }, leaveMs);
  leaveTimers.set(button, timer);
}

document.addEventListener('pointerover', (event) => {
  const button = getAnimatedButton(event.target);
  if (!button || button.contains(event.relatedTarget)) return;
  enterButton(button);
});

document.addEventListener('pointerout', (event) => {
  const button = getAnimatedButton(event.target);
  if (!button || button.contains(event.relatedTarget)) return;
  leaveButton(button);
});
