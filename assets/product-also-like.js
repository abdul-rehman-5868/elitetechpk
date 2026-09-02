/**
 * Horizontal product carousel for the "You may also like" section.
 */
class ProductAlsoLike extends HTMLElement {
  /** @type {AbortController | null} */
  #controller = null;

  connectedCallback() {
    this.#controller?.abort();
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    const track = this.querySelector('[data-pal-track]');
    const previous = this.querySelector('[data-pal-previous]');
    const next = this.querySelector('[data-pal-next]');
    if (!(track instanceof HTMLElement)) return;

    const updateButtons = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      const atStart = track.scrollLeft <= 4;
      const atEnd = track.scrollLeft >= maxScroll - 4;
      if (previous instanceof HTMLButtonElement) {
        previous.disabled = atStart;
        previous.classList.toggle('is-disabled', atStart);
      }
      if (next instanceof HTMLButtonElement) {
        next.disabled = atEnd || maxScroll <= 0;
        next.classList.toggle('is-disabled', atEnd || maxScroll <= 0);
      }
    };

    const scrollByCard = (direction) => {
      const card = track.querySelector('.bss-card');
      const gap = Number.parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 16;
      const amount = card instanceof HTMLElement ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
      track.scrollBy({ left: direction * amount, behavior: 'smooth' });
    };

    previous?.addEventListener('click', () => scrollByCard(-1), { signal });
    next?.addEventListener('click', () => scrollByCard(1), { signal });
    track.addEventListener('scroll', updateButtons, { passive: true, signal });
    window.addEventListener('resize', updateButtons, { passive: true, signal });
    updateButtons();
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#controller = null;
  }
}

if (!customElements.get('product-also-like')) {
  customElements.define('product-also-like', ProductAlsoLike);
}
