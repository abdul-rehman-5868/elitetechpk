import { prefersReducedMotion, clamp } from '@theme/utilities';
import {
  getScrollEventTarget,
  getIntersectionRoot,
  scrollContainerMediaQuery,
} from '@theme/scroll-container';

/**
 * Slight center-column parallax for product story highlights.
 */
class ProductStoryHighlights extends HTMLElement {
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

  get #centerColumn() {
    return /** @type {HTMLElement | null} */ (this.querySelector('[ref="centerColumn"]'));
  }

  get #maxOffset() {
    return Number(this.dataset.parallaxStrength || 20);
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
    if (!this.#inView || this.hasAttribute('data-reduced-motion')) return;
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
    const column = this.#centerColumn;
    if (!column || this.hasAttribute('data-reduced-motion')) return;

    const rect = this.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 1;
    const travel = Math.max(rect.height + viewportHeight, 1);
    const progress = clamp((viewportHeight - rect.top) / travel, 0, 1);
    const offset = progress * this.#maxOffset * -1;
    this.#setOffset(offset);
  }

  /**
   * @param {number} offset
   */
  #setOffset(offset) {
    const column = this.#centerColumn;
    if (!column) return;
    column.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
  }
}

if (!customElements.get('product-story-highlights')) {
  customElements.define('product-story-highlights', ProductStoryHighlights);
}
