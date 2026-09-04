/**
 * Hotspot product showcase:
 * - Left hotspots switch the active product card
 * - Right gallery uses 3 horizontal hover zones to select media
 *
 * @typedef {object} Refs
 * @property {HTMLElement[]} [hotspots]
 * @property {HTMLElement[]} [panels]
 * @property {HTMLElement[]} [galleries]
 */

class HotspotProductShowcase extends HTMLElement {
  /** @type {AbortController | null} */
  #controller = null;

  /** @type {number} */
  #activeIndex = 0;

  connectedCallback() {
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.#bindHotspots(signal);
    this.#bindGalleries(signal);

    const initial = Number(this.dataset.activeIndex || 0);
    this.#setActiveProduct(Number.isFinite(initial) ? initial : 0, { announce: false });
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#controller = null;
  }

  /**
   * @param {AbortSignal} signal
   */
  #bindHotspots(signal) {
    const hotspots = this.querySelectorAll('[data-hps-hotspot]');
    hotspots.forEach((hotspot, index) => {
      hotspot.addEventListener('pointerenter', () => this.#setActiveProduct(index), { signal });
      hotspot.addEventListener('focus', () => this.#setActiveProduct(index), { signal });
      hotspot.addEventListener(
        'click',
        (event) => {
          event.preventDefault();
          this.#setActiveProduct(index);
        },
        { signal }
      );
    });
  }

  /**
   * @param {AbortSignal} signal
   */
  #bindGalleries(signal) {
    const galleries = this.querySelectorAll('[data-hps-gallery]');
    galleries.forEach((gallery) => {
      const track = gallery.querySelector('[data-hps-track]');
      const dots = gallery.querySelectorAll('[data-hps-dot]');
      const mediaCount = Number(gallery.dataset.mediaCount || 1);

      gallery.addEventListener(
        'pointermove',
        (event) => {
          if (event.pointerType && event.pointerType !== 'mouse') return;
          const index = this.#zoneIndexFromEvent(gallery, event, mediaCount);
          this.#selectMedia(gallery, track, dots, index);
        },
        { signal }
      );

      gallery.addEventListener(
        'pointerleave',
        () => {
          // Keep the last selected image; no reset required by the plan.
        },
        { signal }
      );

      gallery.addEventListener(
        'click',
        (event) => {
          const target = event.target;
          if (target instanceof Element && target.closest('a, button')) return;

          // Touch/tap: map horizontal position to a zone.
          if (!(event instanceof PointerEvent) && !(event instanceof MouseEvent)) return;
          const index = this.#zoneIndexFromEvent(gallery, event, mediaCount);
          this.#selectMedia(gallery, track, dots, index);
        },
        { signal }
      );

      dots.forEach((dot, index) => {
        dot.addEventListener(
          'click',
          (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.#selectMedia(gallery, track, dots, index);
          },
          { signal }
        );
      });
    });
  }

  /**
   * @param {Element} gallery
   * @param {{ clientX: number }} event
   * @param {number} mediaCount
   */
  #zoneIndexFromEvent(gallery, event, mediaCount) {
    const rect = gallery.getBoundingClientRect();
    const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
    const clampedRatio = Math.min(Math.max(ratio, 0), 0.999);
    const rawIndex = Math.floor(clampedRatio * 3);
    const maxIndex = Math.max(0, Math.min(2, mediaCount - 1));
    return Math.min(rawIndex, maxIndex);
  }

  /**
   * @param {Element} gallery
   * @param {Element | null} track
   * @param {NodeListOf<Element> | Element[]} dots
   * @param {number} index
   */
  #selectMedia(gallery, track, dots, index) {
    const mediaCount = Number(gallery.dataset.mediaCount || 1);
    const maxIndex = Math.max(0, Math.min(2, mediaCount - 1));
    const nextIndex = Math.min(Math.max(index, 0), maxIndex);

    if (track instanceof HTMLElement) {
      track.style.transform = `translate3d(-${nextIndex * 100}%, 0, 0)`;
    }

    gallery.setAttribute('data-active-media', String(nextIndex));

    dots.forEach((dot, i) => {
      const active = i === nextIndex;
      dot.classList.toggle('is-active', active);
      if (dot instanceof HTMLButtonElement) {
        dot.setAttribute('aria-pressed', active ? 'true' : 'false');
      }
    });
  }

  /**
   * @param {number} index
   * @param {{ announce?: boolean }} [options]
   */
  #setActiveProduct(index, options = {}) {
    const panels = [...this.querySelectorAll('[data-hps-panel]')];
    if (panels.length === 0) return;

    const nextIndex = Math.min(Math.max(index, 0), panels.length - 1);
    this.#activeIndex = nextIndex;
    this.dataset.activeIndex = String(nextIndex);

    panels.forEach((panel, i) => {
      const active = i === nextIndex;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
      panel.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    // On mobile the panels form a horizontally scrollable compact list (all
    // visible, not hidden/shown) instead of a single swapped panel — bring
    // the matching card into view. `block: 'nearest'` keeps this a no-op on
    // desktop, where the panel is already fully in view.
    panels[nextIndex]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

    const hotspots = this.querySelectorAll('[data-hps-hotspot]');
    hotspots.forEach((hotspot, i) => {
      const active = i === nextIndex;
      hotspot.classList.toggle('is-active', active);
      hotspot.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    if (options.announce !== false) {
      const live = this.querySelector('[data-hps-live]');
      const title = panels[nextIndex]?.getAttribute('data-product-title');
      if (live && title) live.textContent = title;
    }
  }
}

if (!customElements.get('hotspot-product-showcase')) {
  customElements.define('hotspot-product-showcase', HotspotProductShowcase);
}
