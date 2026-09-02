/**
 * Gallery zone switching for shared bss-card markup.
 * Spec row slide is handled in CSS to avoid hover flicker.
 * Uses event delegation so newly loaded/morphed cards keep working.
 */
class BssProductCards extends HTMLElement {
  /** @type {AbortController | null} */
  #controller = null;

  connectedCallback() {
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.addEventListener(
      'pointermove',
      (event) => {
        if (!(event instanceof PointerEvent)) return;
        if (event.pointerType && event.pointerType !== 'mouse') return;
        const gallery = this.#galleryFromEvent(event);
        if (!gallery) return;
        this.#selectFromPointer(gallery, event.clientX);
      },
      { signal }
    );

    this.addEventListener(
      'click',
      (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const dot = target.closest('[data-bss-dot]');
        if (dot instanceof HTMLElement) {
          const gallery = dot.closest('[data-bss-gallery]');
          if (!(gallery instanceof HTMLElement)) return;
          event.preventDefault();
          event.stopPropagation();
          const dots = [...gallery.querySelectorAll('[data-bss-dot]')];
          this.#selectMedia(gallery, dots.indexOf(dot));
          return;
        }

        if (target.closest('a, button')) return;
        const gallery = this.#galleryFromEvent(event);
        if (!gallery) return;
        this.#selectFromPointer(gallery, event.clientX);
      },
      { signal }
    );

    this.querySelectorAll('[data-bss-gallery]').forEach((gallery) => {
      if (!(gallery instanceof HTMLElement)) return;
      const mediaCount = Number(gallery.dataset.mediaCount || 1);
      const defaultIndex = Math.min(
        Number(gallery.dataset.activeMedia || 0),
        Math.max(0, mediaCount - 1)
      );
      this.#selectMedia(gallery, defaultIndex);
    });
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#controller = null;
  }

  /**
   * @param {Event} event
   * @returns {HTMLElement | null}
   */
  #galleryFromEvent(event) {
    const target = event.target;
    if (!(target instanceof Element)) return null;
    const gallery = target.closest('[data-bss-gallery]');
    return gallery instanceof HTMLElement && this.contains(gallery) ? gallery : null;
  }

  /**
   * @param {HTMLElement} gallery
   * @param {number} clientX
   */
  #selectFromPointer(gallery, clientX) {
    const mediaCount = Number(gallery.dataset.mediaCount || 1);
    const rect = gallery.getBoundingClientRect();
    const ratio = rect.width > 0 ? (clientX - rect.left) / rect.width : 0.5;
    const zone = Math.min(2, Math.max(0, Math.floor(Math.min(ratio, 0.999) * 3)));
    this.#selectMedia(gallery, Math.min(zone, mediaCount - 1));
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

if (!customElements.get('bss-product-cards')) {
  customElements.define('bss-product-cards', BssProductCards);
}
