import { prefersReducedMotion, clamp } from '@theme/utilities';
import {
  getScrollEventTarget,
  getIntersectionRoot,
  scrollContainerMediaQuery,
} from '@theme/scroll-container';

/**
 * Vertical parallax for the sale banner background image only.
 *
 * Scroll down → image moves up. Scroll up → image moves down.
 * Overlay and content stay fixed.
 */
class ParallaxSaleBanner extends HTMLElement {
  /** @type {AbortController | null} */
  #controller = null;

  /** @type {IntersectionObserver | null} */
  #visibilityObserver = null;

  /** @type {boolean} */
  #inView = false;

  /** @type {number | null} */
  #rafId = null;

  connectedCallback() {
    if (prefersReducedMotion()) {
      this.setAttribute('data-reduced-motion', '');
      this.#setOffset(0);
      return;
    }

    this.#attachListeners();
    this.#observeVisibility();
    this.#scheduleUpdate();
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#controller = null;
    this.#visibilityObserver?.disconnect();
    this.#visibilityObserver = null;

    if (this.#rafId !== null) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
  }

  get #media() {
    return /** @type {HTMLElement | null} */ (this.querySelector('[ref="media"]'));
  }

  get #maxOffset() {
    return Number(this.dataset.parallaxStrength || 48);
  }

  #attachListeners() {
    this.#controller?.abort();
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    getScrollEventTarget().addEventListener('scroll', this.#onScroll, {
      passive: true,
      signal,
    });
    scrollContainerMediaQuery.addEventListener('change', this.#handleBreakpointChange, { signal });
  }

  #observeVisibility() {
    this.#visibilityObserver?.disconnect();
    this.#visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        this.#inView = entry.isIntersecting;
        if (this.#inView) this.#scheduleUpdate();
        else this.#setOffset(0);
      },
      { root: getIntersectionRoot(), threshold: 0, rootMargin: '10% 0px' }
    );
    this.#visibilityObserver.observe(this);
  }

  #handleBreakpointChange = () => {
    this.#attachListeners();
    this.#observeVisibility();
    this.#scheduleUpdate();
  };

  #onScroll = () => {
    if (!this.#inView) return;
    this.#scheduleUpdate();
  };

  #scheduleUpdate() {
    if (this.#rafId !== null) return;
    this.#rafId = requestAnimationFrame(() => {
      this.#rafId = null;
      this.#updateParallax();
    });
  }

  #updateParallax() {
    const media = this.#media;
    if (!media) return;

    const rect = this.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 1;
    const sectionCenter = rect.top + rect.height / 2;
    const viewportCenter = viewportHeight / 2;

    // Progress: -1 when section is below center, +1 when above.
    // Scroll down moves section up → positive progress → negative translateY (image up).
    const progress = clamp((viewportCenter - sectionCenter) / (viewportHeight * 0.75), -1, 1);
    const offset = progress * this.#maxOffset * -1;
    this.#setOffset(offset);
  }

  /**
   * @param {number} offset
   */
  #setOffset(offset) {
    const media = this.#media;
    if (!media) return;
    media.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
  }
}

if (!customElements.get('parallax-sale-banner')) {
  customElements.define('parallax-sale-banner', ParallaxSaleBanner);
}
