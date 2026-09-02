import { prefersReducedMotion } from '@theme/utilities';
import { DialogCloseEvent, DialogOpenEvent } from '@theme/dialog';

const TYPE_DELAY = 70;
const DELETE_DELAY = 45;
const WORD_PAUSE = 900;
const SQUEEZE_MS = 350;

/** @type {number | null} */
let animationFrame = null;
/** @type {ReturnType<typeof setTimeout> | null} */
let animationTimeout = null;

/**
 * @param {HTMLElement | null} root
 */
function getTypewriterElements(root) {
  if (!root) return null;

  const input = root.querySelector('.search-modal__input');
  const overlay = root.querySelector('.search-modal__typewriter');
  const textEl = root.querySelector('.search-modal__typewriter-text');

  if (!(input instanceof HTMLInputElement) || !(overlay instanceof HTMLElement) || !(textEl instanceof HTMLElement)) {
    return null;
  }

  const wordsRaw = overlay.dataset.words || '';
  const words = wordsRaw
    .split(/[\n,]+/)
    .map((word) => word.trim())
    .filter(Boolean);

  const finalPlaceholder = input.dataset.finalPlaceholder || 'Search for ...';

  return { input, overlay, textEl, words, finalPlaceholder };
}

/**
 * @param {ReturnType<typeof getTypewriterElements>} elements
 */
function finishTypewriter(elements) {
  if (!elements) return;

  cancelTypewriter();

  const { input, overlay } = elements;
  overlay.classList.add('search-modal__typewriter--hidden');
  overlay.classList.remove('search-modal__typewriter--squeezing');
  overlay.style.transform = '';
  input.placeholder = elements.finalPlaceholder;
}

/**
 * @param {ReturnType<typeof getTypewriterElements>} elements
 */
function startTypewriter(elements) {
  if (!elements) return;

  const { input, overlay, textEl, words, finalPlaceholder } = elements;

  if (input.value.trim().length > 0 || document.activeElement === input) {
    finishTypewriter(elements);
    return;
  }

  cancelTypewriter();

  input.placeholder = '';
  overlay.classList.remove('search-modal__typewriter--hidden', 'search-modal__typewriter--squeezing');
  overlay.style.transform = '';
  textEl.textContent = '';

  if (prefersReducedMotion() || words.length === 0) {
    finishTypewriter(elements);
    return;
  }

  let wordIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const tick = () => {
    if (input.value.trim().length > 0 || document.activeElement === input) {
      finishTypewriter(elements);
      return;
    }

    const currentWord = words[wordIndex] || '';

    if (!deleting) {
      charIndex += 1;
      textEl.textContent = currentWord.slice(0, charIndex);

      if (charIndex >= currentWord.length) {
        if (wordIndex >= words.length - 1) {
          animationTimeout = setTimeout(() => squeezeAndFinish(elements), WORD_PAUSE);
          return;
        }

        animationTimeout = setTimeout(() => {
          deleting = true;
          tick();
        }, WORD_PAUSE);
        return;
      }

      animationTimeout = setTimeout(tick, TYPE_DELAY);
      return;
    }

    charIndex -= 1;
    textEl.textContent = currentWord.slice(0, charIndex);

    if (charIndex <= 0) {
      deleting = false;
      wordIndex += 1;
      animationTimeout = setTimeout(tick, TYPE_DELAY);
      return;
    }

    animationTimeout = setTimeout(tick, DELETE_DELAY);
  };

  tick();
}

/**
 * @param {ReturnType<typeof getTypewriterElements>} elements
 */
function squeezeAndFinish(elements) {
  if (!elements) return;

  const { overlay } = elements;

  overlay.classList.add('search-modal__typewriter--squeezing');

  animationTimeout = setTimeout(() => {
    finishTypewriter(elements);
  }, SQUEEZE_MS);
}

function cancelTypewriter() {
  if (animationTimeout) {
    clearTimeout(animationTimeout);
    animationTimeout = null;
  }

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
}

/**
 * @param {HTMLElement | null} root
 */
function resetTypewriter(root) {
  const elements = getTypewriterElements(root);
  if (!elements) return;

  cancelTypewriter();

  const { input, overlay, textEl } = elements;
  textEl.textContent = '';
  overlay.classList.remove('search-modal__typewriter--squeezing');
  overlay.style.transform = '';
  overlay.classList.add('search-modal__typewriter--hidden');
  input.placeholder = '';
}

/**
 * @param {Event} event
 */
function handleDialogOpen(event) {
  const dialogComponent = event.target;
  if (!(dialogComponent instanceof HTMLElement) || dialogComponent.id !== 'search-modal') return;

  const elements = getTypewriterElements(dialogComponent);
  if (!elements) return;

  requestAnimationFrame(() => {
    startTypewriter(elements);
  });
}

/**
 * @param {Event} event
 */
function handleDialogClose(event) {
  const dialogComponent = event.target;
  if (!(dialogComponent instanceof HTMLElement) || dialogComponent.id !== 'search-modal') return;

  resetTypewriter(dialogComponent);
}

/**
 * @param {Event} event
 */
function handleInputInterrupt(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || !target.classList.contains('search-modal__input')) return;

  const dialogComponent = target.closest('#search-modal');
  finishTypewriter(getTypewriterElements(dialogComponent));
}

function initSearchModalTypewriter() {
  document.addEventListener(DialogOpenEvent.eventName, handleDialogOpen);
  document.addEventListener(DialogCloseEvent.eventName, handleDialogClose);
  document.addEventListener('search-modal:finish-typewriter', () => {
    finishTypewriter(getTypewriterElements(document.getElementById('search-modal')));
  });
  document.addEventListener('focusin', handleInputInterrupt);
  document.addEventListener('input', handleInputInterrupt);
}

initSearchModalTypewriter();
