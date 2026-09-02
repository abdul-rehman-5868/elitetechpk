import { prefersReducedMotion } from '@theme/utilities';
import {
  getScrollContainer,
  getScrollEventTarget,
  getIntersectionRoot,
  scrollContainerMediaQuery,
  scrollTo as themeScrollTo,
} from '@theme/scroll-container';

/**
 * Page-level product story TOC: pins under the navbar and tracks active section.
 * Desktop scrolling uses `.page-wrapper`, so pin math and listeners must follow that.
 */
class ProductStoryToc extends HTMLElement {
  /** @type {AbortController | null} */
  #controller = null;

  /** @type {IntersectionObserver | null} */
  #tocObserver = null;

  /** @type {boolean} */
  #tocPinned = false;

  /** @type {string | null} */
  #activeId = null;

  /** @type {number | null} */
  #rafId = null;

  connectedCallback() {
    this.#attachListeners();
    this.#observeTocTargets();
    this.#bindTocClicks();
    this.#schedulePinUpdate();
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#controller = null;
    this.#tocObserver?.disconnect();
    this.#tocObserver = null;
    this.#unpinToc();

    if (this.#rafId !== null) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
  }

  get #toc() {
    return (
      /** @type {HTMLElement | null} */ (this.querySelector('[data-toc-nav]')) ||
      /** @type {HTMLElement | null} */ (document.getElementById('ProductStoryTocNav'))
    );
  }

  get #tocSlot() {
    return /** @type {HTMLElement | null} */ (this.querySelector('[data-toc-slot]'));
  }

  get #tocLinks() {
    const toc = this.#toc;
    if (!toc) return /** @type {NodeListOf<HTMLAnchorElement>} */ (this.querySelectorAll('[data-toc-link]'));
    return /** @type {NodeListOf<HTMLAnchorElement>} */ (toc.querySelectorAll('[data-toc-link]'));
  }

  #attachListeners() {
    this.#controller?.abort();
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    const scrollTarget = getScrollEventTarget();
    scrollTarget.addEventListener('scroll', this.#onScroll, { passive: true, signal });

    // Fallback: some layouts still emit window scroll.
    if (scrollTarget !== window && scrollTarget !== document) {
      window.addEventListener('scroll', this.#onScroll, { passive: true, signal });
    }

    window.addEventListener('resize', this.#onResize, { passive: true, signal });
    scrollContainerMediaQuery.addEventListener('change', this.#handleBreakpointChange, { signal });
  }

  #observeTocTargets() {
    this.#tocObserver?.disconnect();

    const targets = [];
    const seen = new Set();
    for (const link of this.#tocLinks) {
      const href = link.getAttribute('href') || '';
      if (!href.startsWith('#')) continue;
      const id = href.slice(1);
      if (seen.has(id)) continue;
      seen.add(id);
      const el = document.getElementById(id);
      if (el) targets.push(el);
    }

    if (!targets.length) return;

    this.#tocObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (!visible.length) return;
        const id = visible[0].target.id;
        if (id && id !== this.#activeId) {
          this.#activeId = id;
          this.#setActiveToc(id);
        }
      },
      {
        root: getIntersectionRoot(),
        threshold: [0.12, 0.28, 0.45],
        rootMargin: '-18% 0px -48% 0px',
      }
    );

    for (const target of targets) {
      this.#tocObserver.observe(target);
    }
  }

  #bindTocClicks() {
    const { signal } = this.#controller || {};
    if (!signal) return;

    for (const link of this.#tocLinks) {
      link.addEventListener(
        'click',
        (event) => {
          const href = link.getAttribute('href') || '';
          if (!href.startsWith('#')) return;
          const target = document.getElementById(href.slice(1));
          if (!target) return;

          event.preventDefault();
          this.#scrollToTarget(target);
          this.#activeId = target.id;
          this.#setActiveToc(target.id);
        },
        { signal }
      );
    }
  }

  /**
   * @param {HTMLElement} target
   */
  #scrollToTarget(target) {
    const headerOffset = this.#pinTop() + (this.#toc?.offsetHeight || 0);
    const current = getScrollContainer().scrollTop;
    const delta = target.getBoundingClientRect().top - headerOffset - 12;
    const behavior = prefersReducedMotion() ? 'instant' : 'smooth';
    themeScrollTo({ top: Math.max(0, current + delta), behavior });
  }

  #cssVar(name) {
    const fromBody = Number.parseFloat(getComputedStyle(document.body).getPropertyValue(name));
    if (Number.isFinite(fromBody) && fromBody > 0) return fromBody;
    const fromRoot = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
    return Number.isFinite(fromRoot) && fromRoot > 0 ? fromRoot : 0;
  }

  #headerHeight() {
    return this.#cssVar('--header-height') || this.#cssVar('--header-group-height');
  }

  #pinTop() {
    return this.#headerHeight() + 30;
  }

  /**
   * Left edge for pinned TOC — aligns with FAQ content when on the dark FAQs section.
   */
  #getTocPinLeft(slotRect) {
    if (document.body.classList.contains('product-story-toc-on-dark')) {
      const faqMain = document.querySelector('.product-faqs__main');
      if (faqMain) {
        return Math.max(16, faqMain.getBoundingClientRect().left);
      }

      const faqShell = document.querySelector('.product-faqs__shell');
      if (faqShell) {
        return Math.max(16, faqShell.getBoundingClientRect().left);
      }
    }

    return Math.max(16, slotRect.left);
  }

  /**
   * @param {string} id
   */
  #setActiveToc(id) {
    for (const link of this.#tocLinks) {
      const href = link.getAttribute('href') || '';
      const isUp = link.classList.contains('product-story-toc__link--up');
      const active = !isUp && href === `#${id}`;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }

    this.classList.toggle('product-story-toc--on-dark', id === 'ProductFAQs');
    document.body.classList.toggle('product-story-toc-on-dark', id === 'ProductFAQs');
    this.#schedulePinUpdate();
  }

  #schedulePinUpdate() {
    if (this.#rafId !== null) return;
    this.#rafId = requestAnimationFrame(() => {
      this.#rafId = null;
      this.#updateTocPin();
    });
  }

  #updateTocPin() {
    const toc = this.#toc;
    const slot = this.#tocSlot;
    if (!toc || !slot) return;

    const pinTop = this.#pinTop();
    const slotTop = slot.getBoundingClientRect().top;

    if (!this.#tocPinned && slotTop <= pinTop) {
      this.#pinToc();
    } else if (this.#tocPinned && slotTop > pinTop + 1) {
      this.#unpinToc();
    }

    if (this.#tocPinned) {
      const slotRect = slot.getBoundingClientRect();
      toc.style.left = `${this.#getTocPinLeft(slotRect)}px`;
      toc.style.top = `${pinTop}px`;
    }
  }

  #pinToc() {
    const toc = this.#toc;
    const slot = this.#tocSlot;
    if (!toc || !slot || this.#tocPinned) return;

    const rect = toc.getBoundingClientRect();
    slot.style.height = `${rect.height}px`;
    slot.style.width = `${rect.width}px`;

    // Reparent outside `.page-wrapper` scrollport so `position: fixed` sticks to the viewport.
    document.body.appendChild(toc);
    toc.classList.add('is-pinned');
    toc.style.position = 'fixed';
    toc.style.zIndex = '1000';
    toc.style.width = `${rect.width}px`;
    const slotRect = slot.getBoundingClientRect();
    toc.style.left = `${this.#getTocPinLeft(slotRect)}px`;
    toc.style.top = `${this.#pinTop()}px`;
    this.#tocPinned = true;
    document.documentElement.style.setProperty('--product-story-toc-height', `${rect.height}px`);
  }

  #unpinToc() {
    const toc = this.#toc;
    const slot = this.#tocSlot;
    // When reparented, toc is on body — find by class if query from this fails.
    const pinnedNav =
      toc ||
      /** @type {HTMLElement | null} */ (document.querySelector('.product-story-toc__nav.is-pinned'));

    if (!pinnedNav) {
      this.#tocPinned = false;
      return;
    }

    if (slot && pinnedNav.parentElement !== slot) {
      slot.appendChild(pinnedNav);
    }

    pinnedNav.classList.remove('is-pinned');
    pinnedNav.style.position = '';
    pinnedNav.style.zIndex = '';
    pinnedNav.style.left = '';
    pinnedNav.style.top = '';
    pinnedNav.style.width = '';
    if (slot) {
      slot.style.height = '';
      slot.style.width = '';
    }
    this.#tocPinned = false;
    document.documentElement.style.removeProperty('--product-story-toc-height');
  }

  #handleBreakpointChange = () => {
    this.#unpinToc();
    this.#attachListeners();
    this.#observeTocTargets();
    this.#bindTocClicks();
    this.#schedulePinUpdate();
  };

  #onResize = () => {
    if (this.#tocPinned) this.#unpinToc();
    this.#schedulePinUpdate();
  };

  #onScroll = () => {
    this.#schedulePinUpdate();
  };
}

if (!customElements.get('product-story-toc')) {
  customElements.define('product-story-toc', ProductStoryToc);
}
