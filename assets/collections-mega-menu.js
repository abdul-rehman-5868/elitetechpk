/**
 * Collections mega menu: staggered slide-in for cards and footer copy,
 * synced to start when the submenu is more than halfway open.
 */

/** @returns {number} */
function getSubmenuHalfOpenDelayMs() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--submenu-animation-speed').trim();
  const speed = Number.parseFloat(raw);
  const durationMs = Number.isFinite(speed) ? speed : 360;
  return durationMs * 0.55;
}

class CollectionsMegaMenu extends HTMLElement {
  /** @type {AbortController | null} */
  #controller = null;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #openTimer;

  connectedCallback() {
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    const submenu = this.closest('.collections-mega-menu');
    const menuItem = this.closest('.menu-list__list-item--collections');
    const link = menuItem?.querySelector('.menu-list__link');

    const scheduleOpenAnimation = () => {
      if (!this.#isMenuOpen()) return;

      clearTimeout(this.#openTimer);
      this.#openTimer = setTimeout(() => {
        if (!this.#isMenuOpen()) return;
        this.#playEnterAnimation();
      }, getSubmenuHalfOpenDelayMs());
    };

    submenu?.addEventListener('pointerenter', () => {
      scheduleOpenAnimation();
    }, { signal });

    link?.addEventListener(
      'focus',
      () => {
        scheduleOpenAnimation();
      },
      { signal }
    );

    if (link) {
      const observer = new MutationObserver(() => {
        if (link.getAttribute('aria-expanded') === 'true') {
          scheduleOpenAnimation();
        } else {
          this.#resetAnimation();
        }
      });
      observer.observe(link, { attributes: true, attributeFilter: ['aria-expanded'] });
      signal.addEventListener('abort', () => observer.disconnect());
    }

    submenu?.addEventListener(
      'pointerleave',
      () => {
        if (link?.getAttribute('aria-expanded') !== 'true') {
          this.#resetAnimation();
        }
      },
      { signal }
    );
  }

  disconnectedCallback() {
    clearTimeout(this.#openTimer);
    this.#controller?.abort();
    this.#controller = null;
  }

  #isMenuOpen() {
    const submenu = this.closest('.collections-mega-menu');
    const link = this.closest('.menu-list__list-item--collections')?.querySelector('.menu-list__link');
    return Boolean(submenu?.matches(':hover') || link?.getAttribute('aria-expanded') === 'true');
  }

  #playEnterAnimation() {
    this.classList.add('is-active');

    this.querySelectorAll('.collections-mega-menu__card').forEach((card) => {
      if (!(card instanceof HTMLElement)) return;
      card.classList.remove('is-entering');
      void card.offsetWidth;
      card.classList.add('is-entering');
    });

    this.#notifyHeightChange();
  }

  #resetAnimation() {
    clearTimeout(this.#openTimer);
    this.classList.remove('is-active');
    this.querySelectorAll('.collections-mega-menu__card').forEach((card) => {
      card.classList.remove('is-entering');
    });
  }

  #notifyHeightChange() {
    const submenu = this.closest('.menu-list__submenu');
    const header = document.querySelector('#header-component');
    if (!(submenu instanceof HTMLElement) || !(header instanceof HTMLElement)) return;

    requestAnimationFrame(() => {
      const height = submenu.offsetHeight;
      if (height <= 0) return;
      header.style.setProperty('--submenu-height', `${height}px`);

      const headerVisible = header.offsetHeight;
      if (headerVisible > 0) {
        header.style.setProperty('--full-open-header-height', `${height + headerVisible}px`);
      }
    });
  }
}

if (!customElements.get('collections-mega-menu')) {
  customElements.define('collections-mega-menu', CollectionsMegaMenu);
}
