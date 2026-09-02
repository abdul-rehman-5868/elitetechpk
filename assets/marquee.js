import { Component } from '@theme/component';
import { debounce, prefersReducedMotion, clamp } from '@theme/utilities';
import {
  getScrollTop,
  getScrollEventTarget,
  getIntersectionRoot,
  scrollContainerMediaQuery,
} from '@theme/scroll-container';

const ANIMATION_OPTIONS = {
  duration: 500,
};

const SCROLL_IDLE_MS = 140;

/**
 * A custom element that displays a marquee.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} wrapper - The wrapper element.
 * @property {HTMLElement} content - The content element.
 * @property {HTMLElement[]} marqueeItems - The marquee items collection.
 *
 * @extends Component<Refs>
 */
class MarqueeComponent extends Component {
  requiredRefs = ['wrapper', 'content', 'marqueeItems'];

  /** @type {{ cancel: () => void, current: number } | null} */
  #animation = null;

  /** @type {number | null} */
  #marqueeWidth = null;

  /** @type {boolean} */
  #reactive = false;

  /** @type {boolean} */
  #inView = false;

  /** @type {boolean} */
  #hovered = false;

  /** @type {boolean} */
  #isScrolling = false;

  /** @type {number} */
  #currentRate = 0;

  /** @type {number} */
  #targetRate = 0;

  /** @type {number} */
  #lastScrollTop = 0;

  /** @type {number} */
  #lastScrollTime = 0;

  /** @type {number | null} */
  #scrollRafId = null;

  /** @type {number | null} */
  #rateRafId = null;

  /** @type {number | null} */
  #scrollIdleTimeout = null;

  /** @type {EventTarget | null} */
  #scrollContainer = null;

  /** @type {IntersectionObserver | null} */
  #visibilityObserver = null;

  async connectedCallback() {
    super.connectedCallback();

    const { marqueeItems } = this.refs;
    if (marqueeItems.length === 0) return;

    this.#reactive = this.dataset.scrollReactive === 'true';

    if (prefersReducedMotion()) {
      this.setAttribute('data-disabled', '');
      return;
    }

    const { numberOfCopies } = await this.#queryNumberOfCopies();
    const speed = this.#calculateSpeed(numberOfCopies);

    this.#addRepeatedItems(numberOfCopies);
    this.#duplicateContent();
    this.#setSpeed(speed);

    window.addEventListener('resize', this.#handleResize);

    if (this.#reactive) {
      this.#setupReactiveMode();
    } else {
      this.addEventListener('pointerenter', this.#slowDown);
      this.addEventListener('pointerleave', this.#speedUp);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.#handleResize);
    this.removeEventListener('pointerenter', this.#slowDown);
    this.removeEventListener('pointerleave', this.#speedUp);
    this.#teardownReactiveMode();
  }

  get #idleRate() {
    return Number(this.dataset.idleRate || 0.35);
  }

  get #scrollBoost() {
    return Number(this.dataset.scrollBoost || 12);
  }

  get #maxBoost() {
    return Number(this.dataset.maxBoost || 3.5);
  }

  get #hoverPause() {
    return this.dataset.hoverPause !== 'false';
  }

  /**
   * Matches CSS animation-direction:
   * - "normal" → keyframes move left with a positive rate
   * - "reverse" → keyframes move right with a positive rate
   *
   * Positive rates are always the row's idle direction so reverse rows
   * are not stuck at currentTime 0 with a negative playbackRate.
   */
  get #directionSign() {
    return this.dataset.movementDirection === 'reverse' ? -1 : 1;
  }

  get #signedIdleRate() {
    return this.#idleRate;
  }

  #setupReactiveMode() {
    this.setAttribute('data-reactive', '');
    this.#lastScrollTop = getScrollTop();
    this.#lastScrollTime = performance.now();
    this.#currentRate = this.#signedIdleRate;
    this.#targetRate = this.#signedIdleRate;

    this.#scrollContainer = getScrollEventTarget();
    this.#scrollContainer.addEventListener('scroll', this.#handleScroll, { passive: true });
    scrollContainerMediaQuery.addEventListener('change', this.#handleBreakpointChange);

    this.addEventListener('pointerenter', this.#onPointerEnter);
    this.addEventListener('pointerleave', this.#onPointerLeave);

    this.#observeVisibility();

    // Create the WAAPI loop immediately (CSS animation is disabled in reactive mode).
    this.#getWrapperAnimation();
    this.#startRateLoop();
    this.#syncReactivePlayback();
  }

  #teardownReactiveMode() {
    this.#scrollContainer?.removeEventListener('scroll', this.#handleScroll);
    this.#scrollContainer = null;
    scrollContainerMediaQuery.removeEventListener('change', this.#handleBreakpointChange);
    this.removeEventListener('pointerenter', this.#onPointerEnter);
    this.removeEventListener('pointerleave', this.#onPointerLeave);
    this.#visibilityObserver?.disconnect();
    this.#visibilityObserver = null;

    if (this.#scrollRafId !== null) {
      cancelAnimationFrame(this.#scrollRafId);
      this.#scrollRafId = null;
    }

    if (this.#rateRafId !== null) {
      cancelAnimationFrame(this.#rateRafId);
      this.#rateRafId = null;
    }

    if (this.#scrollIdleTimeout !== null) {
      clearTimeout(this.#scrollIdleTimeout);
      this.#scrollIdleTimeout = null;
    }
  }

  #observeVisibility() {
    this.#visibilityObserver?.disconnect();
    this.#visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const wasInView = this.#inView;
        this.#inView = entry.isIntersecting;

        // Reset scroll baseline when entering view to avoid a velocity spike.
        if (this.#inView && !wasInView) {
          this.#lastScrollTop = getScrollTop();
          this.#lastScrollTime = performance.now();
        }

        this.#syncReactivePlayback();
      },
      { root: getIntersectionRoot(), threshold: 0.05 }
    );
    this.#visibilityObserver.observe(this);
  }

  #handleBreakpointChange = () => {
    if (!this.#reactive) return;

    this.#scrollContainer?.removeEventListener('scroll', this.#handleScroll);
    this.#scrollContainer = getScrollEventTarget();
    this.#scrollContainer.addEventListener('scroll', this.#handleScroll, { passive: true });
    this.#lastScrollTop = getScrollTop();
    this.#lastScrollTime = performance.now();
    this.#observeVisibility();
  };

  #handleScroll = () => {
    if (this.#scrollRafId !== null) return;

    this.#scrollRafId = requestAnimationFrame(() => {
      this.#scrollRafId = null;
      this.#updateScrollVelocity();
    });
  };

  #updateScrollVelocity() {
    const now = performance.now();
    const scrollTop = getScrollTop();
    const deltaY = scrollTop - this.#lastScrollTop;
    const deltaT = Math.max(now - this.#lastScrollTime, 1);

    this.#lastScrollTop = scrollTop;
    this.#lastScrollTime = now;

    // Keep the scroll baseline fresh while offscreen; only drive motion in view.
    if (!this.#inView || Math.abs(deltaY) < 0.5) return;

    this.#isScrolling = true;

    // Scroll down accelerates each row in its own idle direction.
    // Scroll up reverses both rows together.
    const velocity = Math.abs(deltaY) / deltaT;
    const magnitude = clamp(this.#idleRate + velocity * this.#scrollBoost, this.#idleRate, this.#maxBoost);
    this.#targetRate = Math.sign(deltaY) * magnitude;

    if (this.#scrollIdleTimeout !== null) clearTimeout(this.#scrollIdleTimeout);
    this.#scrollIdleTimeout = setTimeout(() => {
      this.#isScrolling = false;
      this.#targetRate = this.#hovered && this.#hoverPause ? 0 : this.#signedIdleRate;
      this.#scrollIdleTimeout = null;
    }, SCROLL_IDLE_MS);
  }

  #onPointerEnter = () => {
    this.#hovered = true;
    if (!this.#isScrolling && this.#hoverPause) {
      this.#targetRate = 0;
    }
  };

  #onPointerLeave = () => {
    this.#hovered = false;
    if (!this.#isScrolling) {
      this.#targetRate = this.#signedIdleRate;
    }
  };

  #startRateLoop() {
    if (this.#rateRafId !== null) return;

    const tick = () => {
      this.#rateRafId = requestAnimationFrame(tick);

      if (!this.#inView) {
        this.#applyPlaybackRate(0);
        return;
      }

      const next = this.#currentRate + (this.#targetRate - this.#currentRate) * 0.18;
      this.#currentRate = Math.abs(next - this.#targetRate) < 0.01 ? this.#targetRate : next;
      this.#applyPlaybackRate(this.#currentRate);
    };

    this.#rateRafId = requestAnimationFrame(tick);
  }

  /**
   * @param {number} rate
   */
  #applyPlaybackRate(rate) {
    const animation = this.#getWrapperAnimation();
    if (!animation) return;

    if (Math.abs(rate) < 0.001) {
      if (animation.playState === 'running') animation.pause();
      animation.updatePlaybackRate(0);
      return;
    }

    if (animation.playState !== 'running') animation.play();
    animation.updatePlaybackRate(rate);
  }

  #syncReactivePlayback() {
    if (!this.#reactive) return;

    if (!this.#inView) {
      this.#applyPlaybackRate(0);
      return;
    }

    if (!this.#isScrolling) {
      this.#targetRate = this.#hovered && this.#hoverPause ? 0 : this.#signedIdleRate;
    }

    this.#applyPlaybackRate(this.#currentRate || this.#targetRate);
  }

  #getWrapperAnimation() {
    const { wrapper } = this.refs;
    if (!wrapper) return null;

    const existing = wrapper.getAnimations()[0];
    if (existing) return existing;

    // Reverse rows use mirrored keyframes so a positive rate moves right.
    // Negative playbackRate at currentTime 0 would otherwise appear frozen.
    const keyframes =
      this.#directionSign < 0
        ? [
            { transform: 'translate3d(calc(-50% - (var(--marquee-gap) / 2)), 0, 0)' },
            { transform: 'translate3d(0, 0, 0)' },
          ]
        : [
            { transform: 'translate3d(0, 0, 0)' },
            { transform: 'translate3d(calc(-50% - (var(--marquee-gap) / 2)), 0, 0)' },
          ];

    return wrapper.animate(keyframes, {
      duration: this.#getDurationMs(),
      iterations: Infinity,
      easing: 'linear',
    });
  }

  #getDurationMs() {
    const seconds = Number.parseFloat(getComputedStyle(this).getPropertyValue('--marquee-speed')) || 25;
    return Math.max(seconds, 1) * 1000;
  }

  #slowDown = debounce(() => {
    if (this.#reactive || this.#animation) return;

    const animation = this.refs.wrapper.getAnimations()[0];
    if (!animation) return;

    this.#animation = animateValue({
      ...ANIMATION_OPTIONS,
      from: 1,
      to: 0,
      onUpdate: (value) => animation.updatePlaybackRate(value),
      onComplete: () => {
        this.#animation = null;
      },
    });
  }, ANIMATION_OPTIONS.duration);

  #speedUp() {
    if (this.#reactive) return;

    this.#slowDown.cancel();

    const animation = this.refs.wrapper.getAnimations()[0];
    if (!animation || animation.playbackRate === 1) return;

    const from = this.#animation?.current ?? 0;
    this.#animation?.cancel();

    this.#animation = animateValue({
      ...ANIMATION_OPTIONS,
      from,
      to: 1,
      onUpdate: (value) => animation.updatePlaybackRate(value),
      onComplete: () => {
        this.#animation = null;
      },
    });
  }

  get clonedContent() {
    const { content, wrapper } = this.refs;
    const lastChild = wrapper.lastElementChild;

    return content !== lastChild ? lastChild : null;
  }

  /**
   * @param {number} value
   */
  #setSpeed(value) {
    this.style.setProperty('--marquee-speed', `${value}s`);
  }

  async #queryNumberOfCopies() {
    const { marqueeItems } = this.refs;

    return new Promise((resolve) => {
      if (!marqueeItems[0]) {
        return setTimeout(() => resolve({ numberOfCopies: 1, isHorizontalResize: true }), 0);
      }

      const intersectionObserver = new IntersectionObserver(
        (entries) => {
          const firstEntry = entries[0];
          if (!firstEntry) return;
          intersectionObserver.disconnect();

          const { width: marqueeWidth } = firstEntry.rootBounds ?? { width: 0 };
          const { width: marqueeItemsWidth } = firstEntry.boundingClientRect;

          const isHorizontalResize = this.#marqueeWidth !== marqueeWidth;
          this.#marqueeWidth = marqueeWidth;

          setTimeout(() => {
            resolve({
              numberOfCopies: marqueeItemsWidth === 0 ? 1 : Math.ceil(marqueeWidth / marqueeItemsWidth),
              isHorizontalResize,
            });
          }, 0);
        },
        { root: this }
      );
      intersectionObserver.observe(marqueeItems[0]);
    });
  }

  /**
   * @param {number} numberOfCopies
   */
  #calculateSpeed(numberOfCopies) {
    const speedFactor = Number(this.getAttribute('data-speed-factor') || 25);
    return Math.sqrt(numberOfCopies) * speedFactor;
  }

  #handleResize = debounce(async () => {
    const { marqueeItems } = this.refs;
    const { numberOfCopies: newNumberOfCopies, isHorizontalResize } = await this.#queryNumberOfCopies();

    if (!isHorizontalResize) return;

    const currentNumberOfCopies = marqueeItems.length;
    const speed = this.#calculateSpeed(newNumberOfCopies);

    if (newNumberOfCopies > currentNumberOfCopies) {
      this.#addRepeatedItems(newNumberOfCopies - currentNumberOfCopies);
    } else if (newNumberOfCopies < currentNumberOfCopies) {
      this.#removeRepeatedItems(currentNumberOfCopies - newNumberOfCopies);
    }

    this.#duplicateContent();
    this.#setSpeed(speed);
    this.#restartAnimation();
  }, 250);

  #restartAnimation() {
    const { wrapper } = this.refs;

    requestAnimationFrame(() => {
      if (this.#reactive) {
        // Recreate WAAPI so duration tracks the latest --marquee-speed after resize.
        for (const animation of wrapper.getAnimations()) {
          animation.cancel();
        }
        this.#getWrapperAnimation();
        this.#syncReactivePlayback();
        return;
      }

      for (const animation of wrapper.getAnimations()) {
        animation.currentTime = 0;
      }
    });
  }

  #duplicateContent() {
    this.clonedContent?.remove();

    const clone = /** @type {HTMLElement} */ (this.refs.content.cloneNode(true));

    clone.setAttribute('aria-hidden', 'true');
    clone.removeAttribute('ref');

    this.refs.wrapper.appendChild(clone);
  }

  /**
   * @param {number} numberOfCopies
   */
  #addRepeatedItems(numberOfCopies) {
    const { content, marqueeItems } = this.refs;

    if (!marqueeItems[0]) return;

    for (let i = 0; i < numberOfCopies - 1; i++) {
      const clone = marqueeItems[0].cloneNode(true);
      content.appendChild(clone);
    }
  }

  /**
   * @param {number} numberOfCopies
   */
  #removeRepeatedItems(numberOfCopies) {
    const { content } = this.refs;
    const children = Array.from(content.children);
    const itemsToRemove = Math.min(numberOfCopies, children.length - 1);

    for (let i = 0; i < itemsToRemove; i++) {
      content.lastElementChild?.remove();
    }
  }
}

/**
 * Animate a numeric property smoothly.
 * @param {Object} params - The parameters for the animation.
 * @param {number} params.from - The starting value.
 * @param {number} params.to - The ending value.
 * @param {number} params.duration - The duration of the animation in milliseconds.
 * @param {function(number): void} params.onUpdate - The function to call on each update.
 * @param {function(number): number} [params.easing] - The easing function.
 * @param {function(): void} [params.onComplete] - The function to call when the animation completes.
 */
function animateValue({ from, to, duration, onUpdate, easing = (t) => t * t * (3 - 2 * t), onComplete }) {
  const startTime = performance.now();
  let cancelled = false;
  let currentValue = from;

  /**
   * @param {number} currentTime - The current time in milliseconds.
   */
  function animate(currentTime) {
    if (cancelled) return;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    currentValue = from + (to - from) * easedProgress;

    onUpdate(currentValue);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else if (typeof onComplete === 'function') {
      onComplete();
    }
  }

  requestAnimationFrame(animate);

  return {
    get current() {
      return currentValue;
    },
    cancel() {
      cancelled = true;
    },
  };
}

if (!customElements.get('marquee-component')) {
  customElements.define('marquee-component', MarqueeComponent);
}
