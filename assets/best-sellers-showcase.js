/**
 * Collection tabs, product carousel, three-zone image previews,
 * and horizontally revealing specification rows.
 */
class BestSellersShowcase extends HTMLElement {
  /** @type {AbortController | null} */
  #controller = null;

  connectedCallback() {
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.#bindTabs(signal);
    this.#bindCarousels(signal);
    this.#bindCards(signal);
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#controller = null;
  }

  /**
   * @param {AbortSignal} signal
   */
  #bindTabs(signal) {
    const tabs = this.querySelectorAll('[data-bss-tab]');

    tabs.forEach((tab) => {
      tab.addEventListener(
        'click',
        () => {
          const panelId = tab.getAttribute('aria-controls');
          if (!panelId) return;

          tabs.forEach((item) => {
            const active = item === tab;
            item.classList.toggle('is-active', active);
            item.setAttribute('aria-selected', active ? 'true' : 'false');
            item.setAttribute('tabindex', active ? '0' : '-1');
          });

          this.querySelectorAll('[data-bss-panel]').forEach((panel) => {
            const active = panel.id === panelId;
            panel.hidden = !active;
            panel.classList.toggle('is-active', active);
          });
        },
        { signal }
      );

      tab.addEventListener(
        'keydown',
        (event) => {
          if (!(event instanceof KeyboardEvent) || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
          event.preventDefault();
          const list = [...tabs];
          const current = list.indexOf(tab);
          const step = event.key === 'ArrowRight' ? 1 : -1;
          const next = list[(current + step + list.length) % list.length];
          if (next instanceof HTMLButtonElement) {
            next.focus();
            next.click();
          }
        },
        { signal }
      );
    });
  }

  /**
   * @param {AbortSignal} signal
   */
  #bindCarousels(signal) {
    const previous = this.querySelector('[data-bss-previous]');
    const next = this.querySelector('[data-bss-next]');

    const activeTrack = () => {
      const panel = this.querySelector('[data-bss-panel].is-active') || this.querySelector('[data-bss-panel]:not([hidden])');
      return panel?.querySelector('[data-bss-track]') ?? null;
    };

    const scroll = (direction) => {
      const track = activeTrack();
      if (!(track instanceof HTMLElement)) return;
      const card = track.querySelector('[data-bss-card]');
      const amount = card instanceof HTMLElement ? card.offsetWidth + 14 : track.clientWidth * 0.8;
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      track.scrollBy({ left: amount * direction, behavior });
    };

    previous?.addEventListener('click', () => scroll(-1), { signal });
    next?.addEventListener('click', () => scroll(1), { signal });

    const updateButtons = () => {
      const track = activeTrack();
      if (!(track instanceof HTMLElement)) return;
      if (previous instanceof HTMLButtonElement) previous.disabled = track.scrollLeft <= 2;
      if (next instanceof HTMLButtonElement) {
        next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      }
    };

    this.querySelectorAll('[data-bss-track]').forEach((track) => {
      track.addEventListener('scroll', updateButtons, { signal, passive: true });
    });
    window.addEventListener('resize', updateButtons, { signal });
    this.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('[data-bss-tab]')) {
        requestAnimationFrame(updateButtons);
      }
    }, { signal });
    requestAnimationFrame(updateButtons);
  }

  /**
   * @param {AbortSignal} signal
   */
  #bindCards(signal) {
    this.querySelectorAll('[data-bss-card]').forEach((card) => {
      const gallery = card.querySelector('[data-bss-gallery]');

      if (gallery instanceof HTMLElement) {
        const mediaCount = Number(gallery.dataset.mediaCount || 1);
        const defaultIndex = Math.min(1, mediaCount - 1);
        this.#selectMedia(gallery, defaultIndex);

        gallery.addEventListener(
          'pointermove',
          (event) => {
            if (event.pointerType && event.pointerType !== 'mouse') return;
            const rect = gallery.getBoundingClientRect();
            const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0.5;
            const zone = Math.min(2, Math.max(0, Math.floor(Math.min(ratio, 0.999) * 3)));
            this.#selectMedia(gallery, Math.min(zone, mediaCount - 1));
          },
          { signal }
        );

        gallery.addEventListener(
          'click',
          (event) => {
            const target = event.target;
            if (target instanceof Element && target.closest('a, button')) return;
            const rect = gallery.getBoundingClientRect();
            const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0.5;
            const zone = Math.min(2, Math.max(0, Math.floor(Math.min(ratio, 0.999) * 3)));
            this.#selectMedia(gallery, Math.min(zone, mediaCount - 1));
          },
          { signal }
        );

        gallery.querySelectorAll('[data-bss-dot]').forEach((dot, index) => {
          dot.addEventListener(
            'click',
            (event) => {
              event.preventDefault();
              event.stopPropagation();
              this.#selectMedia(gallery, index);
            },
            { signal }
          );
        });
      }
    });
  }

  /**
   * @param {HTMLElement} gallery
   * @param {number} index
   */
  #selectMedia(gallery, index) {
    const mediaCount = Number(gallery.dataset.mediaCount || 1);
    const nextIndex = Math.min(Math.max(index, 0), Math.max(0, mediaCount - 1));
    const track = gallery.querySelector('[data-bss-media-track]');

    if (track instanceof HTMLElement) {
      track.style.transform = `translate3d(-${nextIndex * 100}%, 0, 0)`;
    }

    gallery.dataset.activeMedia = String(nextIndex);
    gallery.querySelectorAll('[data-bss-dot]').forEach((dot, dotIndex) => {
      const active = dotIndex === nextIndex;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
}

if (!customElements.get('best-sellers-showcase')) {
  customElements.define('best-sellers-showcase', BestSellersShowcase);
}
