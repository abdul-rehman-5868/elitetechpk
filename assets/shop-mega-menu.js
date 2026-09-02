/**
 * Shop mega menu: collection tabs swap the "Most popular" panel
 * with staggered entrance animations synced to submenu open progress.
 */

/** @returns {number} */
function getSubmenuHalfOpenDelayMs() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--submenu-animation-speed').trim();
  const speed = Number.parseFloat(raw);
  const durationMs = Number.isFinite(speed) ? speed : 360;
  return durationMs * 0.55;
}

class ShopMegaMenu extends HTMLElement {
  /** @type {AbortController | null} */
  #controller = null;

  /** @type {string | null} */
  #activeId = null;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #openTimer;

  connectedCallback() {
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    const submenu = this.closest('.shop-mega-menu');
    const menuItem = this.closest('.menu-list__list-item--shop');
    const link = menuItem?.querySelector('.menu-list__link');

    const scheduleOpenAnimation = () => {
      if (!this.#isMenuOpen()) return;

      clearTimeout(this.#openTimer);
      this.#openTimer = setTimeout(() => {
        if (!this.#isMenuOpen()) return;
        this.#runOpenAnimation();
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
          this.#resetAnimations();
        }
      });
      observer.observe(link, { attributes: true, attributeFilter: ['aria-expanded'] });
      signal.addEventListener('abort', () => observer.disconnect());
    }

    submenu?.addEventListener(
      'pointerleave',
      () => {
        if (link?.getAttribute('aria-expanded') !== 'true') {
          this.#resetAnimations();
        }
      },
      { signal }
    );

    const tabs = this.querySelectorAll('[data-shop-mega-category]');
    const first = this.querySelector('[data-shop-mega-category].is-active') || tabs[0];
    if (first instanceof HTMLElement) {
      this.#activeId = first.dataset.shopMegaCategory || null;
    }

    tabs.forEach((tab) => {
      tab.addEventListener(
        'click',
        (event) => {
          event.preventDefault();
          if (!(tab instanceof HTMLElement)) return;
          this.#select(tab);
        },
        { signal }
      );

      tab.addEventListener(
        'keydown',
        (event) => {
          if (!(event instanceof KeyboardEvent)) return;
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          if (!(tab instanceof HTMLElement)) return;
          this.#select(tab);
        },
        { signal }
      );
    });
  }

  disconnectedCallback() {
    clearTimeout(this.#openTimer);
    this.#controller?.abort();
    this.#controller = null;
  }

  #isMenuOpen() {
    const submenu = this.closest('.shop-mega-menu');
    const link = this.closest('.menu-list__list-item--shop')?.querySelector('.menu-list__link');
    return Boolean(submenu?.matches(':hover') || link?.getAttribute('aria-expanded') === 'true');
  }

  #runOpenAnimation() {
    this.#resetAnimationClasses();
    this.classList.add('is-entering');

    const panel = this.querySelector('.shop-mega-menu__panel.is-active');
    if (panel instanceof HTMLElement) {
      this.#replayCardAnimation(panel);
    }

    this.#notifyHeightChange();
  }

  #resetAnimations() {
    clearTimeout(this.#openTimer);
    this.#resetAnimationClasses();
  }

  #resetAnimationClasses() {
    this.classList.remove('is-entering', 'is-switching');
    this.querySelectorAll('.shop-mega-menu__product-card').forEach((node) => {
      node.classList.remove('is-entering');
    });
  }

  /**
   * @param {HTMLElement} tab
   */
  #select(tab) {
    const id = tab.dataset.shopMegaCategory;
    if (!id || id === this.#activeId) return;

    this.#activeId = id;

    this.querySelectorAll('[data-shop-mega-category]').forEach((item) => {
      const active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', active ? 'true' : 'false');
      if (item instanceof HTMLElement) {
        item.tabIndex = active ? 0 : -1;
      }
    });

    const allLink = this.querySelector('[data-shop-mega-all-link]');
    if (allLink instanceof HTMLAnchorElement) {
      const url = tab.dataset.url;
      const title = tab.dataset.title || 'Products';
      const count = tab.dataset.count;
      if (url) allLink.href = url;

      const label = allLink.querySelector('[data-shop-mega-all-label]');
      if (label) {
        label.textContent = count ? `All ${title} (${count})` : `All ${title}`;
      }
    }

    this.querySelectorAll('[data-shop-mega-panel]').forEach((panel) => {
      const active = panel.getAttribute('data-shop-mega-panel') === id;
      panel.classList.toggle('is-active', active);
      panel.toggleAttribute('hidden', !active);

      if (active && panel instanceof HTMLElement) {
        this.#replayCardAnimation(panel, { switching: true });
      }
    });

    this.#notifyHeightChange();
  }

  /**
   * @param {HTMLElement} panel
   * @param {{ switching?: boolean }} [options]
   */
  #replayCardAnimation(panel, { switching = false } = {}) {
    if (switching) {
      this.classList.add('is-switching');
      window.setTimeout(() => {
        this.classList.remove('is-switching');
      }, 520);
    }

    const cards = panel.querySelectorAll('.shop-mega-menu__product-card');
    cards.forEach((card) => {
      if (!(card instanceof HTMLElement)) return;
      card.classList.remove('is-entering');
      void card.offsetWidth;
      card.classList.add('is-entering');
    });
  }

  #notifyHeightChange() {
    const submenu = this.closest('.menu-list__submenu');
    const header = document.querySelector('#header-component');
    if (!(submenu instanceof HTMLElement) || !(header instanceof HTMLElement)) return;

    requestAnimationFrame(() => {
      const height = submenu.offsetHeight;
      header.style.setProperty('--submenu-height', `${height}px`);

      const headerVisible = header.offsetHeight;
      if (height > 0 && headerVisible > 0) {
        header.style.setProperty('--full-open-header-height', `${height + headerVisible}px`);
      }
    });
  }
}

if (!customElements.get('shop-mega-menu')) {
  customElements.define('shop-mega-menu', ShopMegaMenu);
}
