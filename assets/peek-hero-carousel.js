import { SlideshowSelectEvent } from '@theme/events';

const CENTER = 'peek-slide--center';
const PEEK_LEFT = 'peek-slide--peek-left';
const PEEK_RIGHT = 'peek-slide--peek-right';

/**
 * Peek hero carousel: applies center / left-peek / right-peek border-radius roles
 * based on each slide's position relative to the carousel center.
 */
class PeekHeroCarousel extends HTMLElement {
  /** @type {AbortController | null} */
  #controller = null;

  /** @type {number} */
  #raf = 0;

  connectedCallback() {
    // Must run before the nested slideshow-component connects (and sets its
    // initial scroll position), so the first/last real slides have genuine
    // content to peek at instead of empty track space at the two ends.
    this.#setupInfiniteEdges();

    this.#controller = new AbortController();
    const { signal } = this.#controller;
    const slideshow = this.querySelector('slideshow-component');
    if (!slideshow) return;

    slideshow.addEventListener(SlideshowSelectEvent.eventName, () => this.#scheduleUpdate(), { signal });
    slideshow.addEventListener('transitionend', () => this.#scheduleUpdate(), { signal });

    const scroller = slideshow.querySelector('slideshow-slides');
    if (scroller) {
      scroller.addEventListener('scroll', () => this.#scheduleUpdate(), { passive: true, signal });
    }

    const resizeObserver = new ResizeObserver(() => this.#scheduleUpdate());
    resizeObserver.observe(this);
    signal.addEventListener('abort', () => resizeObserver.disconnect());

    this.#scheduleUpdate();
    requestAnimationFrame(() => {
      this.#scheduleUpdate();
      requestAnimationFrame(() => this.#scheduleUpdate());
    });
    window.setTimeout(() => this.#scheduleUpdate(), 150);
  }

  disconnectedCallback() {
    this.#controller?.abort();
    cancelAnimationFrame(this.#raf);
  }

  /**
   * The track only ever contains the real slides in DOM order, so the first
   * slide has nothing before it to reveal as a left peek (same for the last
   * slide's right peek) — scrollLeft can't go negative and there's no
   * content past the last slide. Clone the last real slide before the first,
   * and the first real slide after the last, so every real slide — including
   * the first and last — has genuine content on both sides when centered.
   * Clones are decorative only: not part of `refs.slides`, not focusable,
   * not reachable via next/prev/dot navigation.
   */
  #setupInfiniteEdges() {
    // Skip in the theme editor: clones would duplicate each block's
    // data-shopify-editor-block id, which could confuse block selection.
    if (window.Shopify?.designMode) return;

    const scroller = this.querySelector('slideshow-slides');
    if (!scroller) return;

    const realSlides = [...scroller.querySelectorAll(':scope > slideshow-slide[ref]')];
    if (realSlides.length < 2) return;

    const first = realSlides[0];
    const last = realSlides[realSlides.length - 1];
    if (!first || !last) return;

    first.before(this.#cloneSlide(last));
    last.after(this.#cloneSlide(first));
  }

  /**
   * @param {Element} slide
   * @returns {Element}
   */
  #cloneSlide(slide) {
    const clone = /** @type {HTMLElement} */ (slide.cloneNode(true));
    clone.removeAttribute('ref');
    clone.removeAttribute('slide-id');
    clone.removeAttribute('on:click');
    clone.setAttribute('aria-hidden', 'true');
    clone.setAttribute('inert', '');
    clone.setAttribute('data-peek-clone', '');
    return clone;
  }

  #scheduleUpdate() {
    cancelAnimationFrame(this.#raf);
    this.#raf = requestAnimationFrame(() => this.#updateRadii());
  }

  #getRadius() {
    const radius = getComputedStyle(this).getPropertyValue('--peek-corner-radius').trim();
    return radius || '17px';
  }

  /**
   * @param {Element} slide
   * @param {'center' | 'left' | 'right' | 'none'} role
   */
  #applyRadius(slide, role) {
    const radius = this.#getRadius();

    switch (role) {
      case 'center':
        slide.style.borderRadius = radius;
        break;
      case 'left':
        slide.style.borderRadius = `0 ${radius} ${radius} 0`;
        break;
      case 'right':
        slide.style.borderRadius = `${radius} 0 0 ${radius}`;
        break;
      default:
        slide.style.removeProperty('border-radius');
    }
  }

  #updateRadii() {
    const slideshow = this.querySelector('slideshow-component');
    const slides = [...this.querySelectorAll('slideshow-slide.peek-slide')];
    if (!slideshow || !slides.length) return;

    const carouselRect = this.getBoundingClientRect();
    const centerX = carouselRect.left + carouselRect.width / 2;
    const threshold = 10;
    const radius = this.#getRadius();

    /** @type {{ slide: Element; center: number; dist: number }[]} */
    const visible = [];

    for (const slide of slides) {
      const rect = slide.getBoundingClientRect();
      if (rect.width < 1 || rect.right < carouselRect.left || rect.left > carouselRect.right) continue;

      const slideCenter = rect.left + rect.width / 2;
      visible.push({
        slide,
        center: slideCenter,
        dist: Math.abs(slideCenter - centerX),
      });
    }

    if (!visible.length) return;

    for (const slide of slides) {
      slide.classList.remove(CENTER, PEEK_LEFT, PEEK_RIGHT);
      slide.style.removeProperty('border-radius');
    }

    if (slides.length === 1) {
      slides[0].classList.add(CENTER);
      this.#applyRadius(slides[0], 'center');
      return;
    }

    const centerSlide = visible.reduce((closest, candidate) =>
      candidate.dist < closest.dist ? candidate : closest
    );

    const leftPeeks = visible.filter((entry) => entry.center < centerSlide.center - threshold);
    const rightPeeks = visible.filter((entry) => entry.center > centerSlide.center + threshold);
    const leftPeek = leftPeeks.sort((a, b) => b.center - a.center)[0];
    const rightPeek = rightPeeks.sort((a, b) => a.center - b.center)[0];

    centerSlide.slide.classList.add(CENTER);
    this.#applyRadius(centerSlide.slide, 'center');

    if (leftPeek) {
      leftPeek.slide.classList.add(PEEK_LEFT);
      this.#applyRadius(leftPeek.slide, 'left');
    }

    if (rightPeek) {
      rightPeek.slide.classList.add(PEEK_RIGHT);
      this.#applyRadius(rightPeek.slide, 'right');
    }

    // Keep CSS variables in sync for transitions when theme editor updates radius.
    for (const slide of slides) {
      slide.style.setProperty('--peek-r', radius);
    }
  }
}

if (!customElements.get('peek-hero-carousel')) {
  customElements.define('peek-hero-carousel', PeekHeroCarousel);
}
