import { prefersReducedMotion } from '@theme/utilities';

/**
 * Manual review slider: selecting a dot slides the next quote in from the right.
 */
class ReviewQuoteSlider extends HTMLElement {
  /** @type {AbortController | null} */
  #controller = null;

  /** @type {number} */
  #activeIndex = 0;

  /** @type {boolean} */
  #animating = false;

  /** @type {number | null} */
  #touchStartX = null;

  connectedCallback() {
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.#activeIndex = Number(this.dataset.activeIndex || 0) || 0;
    this.#bindDots(signal);
    this.#bindSwipe(signal);
    this.#syncState(this.#activeIndex, { announce: false });
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#controller = null;
  }

  get #slides() {
    return [...this.querySelectorAll('[data-rqs-slide]')];
  }

  get #dots() {
    return [...this.querySelectorAll('[data-rqs-dot]')];
  }

  get #reducedMotion() {
    return prefersReducedMotion() || this.hasAttribute('data-reduced-motion');
  }

  /**
   * @param {AbortSignal} signal
   */
  #bindDots(signal) {
    this.#dots.forEach((dot, index) => {
      dot.addEventListener(
        'click',
        (event) => {
          event.preventDefault();
          this.#goTo(index);
        },
        { signal }
      );
    });
  }

  /**
   * @param {AbortSignal} signal
   */
  #bindSwipe(signal) {
    const viewport = this.querySelector('[data-rqs-viewport]');
    if (!viewport) return;

    viewport.addEventListener(
      'touchstart',
      (event) => {
        if (!(event instanceof TouchEvent) || !event.changedTouches[0]) return;
        this.#touchStartX = event.changedTouches[0].clientX;
      },
      { signal, passive: true }
    );

    viewport.addEventListener(
      'touchend',
      (event) => {
        if (this.#touchStartX == null || !(event instanceof TouchEvent) || !event.changedTouches[0]) return;
        const deltaX = event.changedTouches[0].clientX - this.#touchStartX;
        this.#touchStartX = null;

        if (Math.abs(deltaX) < 40) return;

        if (deltaX < 0) {
          this.#goTo(this.#activeIndex + 1);
        } else {
          this.#goTo(this.#activeIndex - 1);
        }
      },
      { signal, passive: true }
    );
  }

  /**
   * @param {number} index
   */
  #goTo(index) {
    const slides = this.#slides;
    if (slides.length === 0 || this.#animating) return;

    const nextIndex = ((index % slides.length) + slides.length) % slides.length;
    if (nextIndex === this.#activeIndex) return;

    if (this.#reducedMotion) {
      this.#activeIndex = nextIndex;
      this.#syncState(nextIndex);
      return;
    }

    this.#animateTo(nextIndex);
  }

  /**
   * @param {number} nextIndex
   */
  #animateTo(nextIndex) {
    const slides = this.#slides;
    const current = slides[this.#activeIndex];
    const next = slides[nextIndex];
    if (!(current instanceof HTMLElement) || !(next instanceof HTMLElement)) return;

    this.#animating = true;
    this.dataset.animating = 'true';

    // Prepare incoming slide off the right edge.
    next.hidden = false;
    next.classList.remove('is-active', 'is-exit', 'is-enter');
    next.classList.add('is-enter');
    next.setAttribute('aria-hidden', 'false');

    current.classList.add('is-exit');
    current.classList.remove('is-active');

    // Force layout so the enter transition starts from the right.
    void next.offsetWidth;

    requestAnimationFrame(() => {
      next.classList.remove('is-enter');
      next.classList.add('is-active');
    });

    const finish = () => {
      current.hidden = true;
      current.classList.remove('is-exit', 'is-active', 'is-enter');
      current.setAttribute('aria-hidden', 'true');

      next.classList.add('is-active');
      next.classList.remove('is-enter', 'is-exit');
      next.hidden = false;

      this.#activeIndex = nextIndex;
      this.#syncState(nextIndex, { skipVisibility: true });
      this.#animating = false;
      this.removeAttribute('data-animating');
    };

    const onEnd = (event) => {
      if (event.target !== next || event.propertyName !== 'transform') return;
      next.removeEventListener('transitionend', onEnd);
      finish();
    };

    next.addEventListener('transitionend', onEnd);

    // Fallback if transitionend does not fire.
    window.setTimeout(() => {
      if (!this.#animating) return;
      next.removeEventListener('transitionend', onEnd);
      finish();
    }, 500);
  }

  /**
   * @param {number} index
   * @param {{ announce?: boolean, skipVisibility?: boolean }} [options]
   */
  #syncState(index, options = {}) {
    const slides = this.#slides;
    const dots = this.#dots;

    this.dataset.activeIndex = String(index);

    slides.forEach((slide, i) => {
      const active = i === index;
      if (!options.skipVisibility) {
        slide.hidden = !active;
        slide.classList.toggle('is-active', active);
        slide.classList.remove('is-enter', 'is-exit');
      }
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    dots.forEach((dot, i) => {
      const active = i === index;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (dot instanceof HTMLButtonElement) {
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      }
    });

    if (options.announce !== false) {
      const live = this.querySelector('[data-rqs-live]');
      const quote = slides[index]?.querySelector('[data-rqs-quote]')?.textContent?.trim();
      if (live && quote) live.textContent = quote;
    }
  }
}

if (!customElements.get('review-quote-slider')) {
  customElements.define('review-quote-slider', ReviewQuoteSlider);
}
