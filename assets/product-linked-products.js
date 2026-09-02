/**
 * Popular upgrades accordion + pairs-well-with carousel for the PDP buy box.
 */

class ProductUpgradesAccordion extends HTMLElement {
  /** @type {AbortController | null} */
  #controller = null;

  connectedCallback() {
    this.#controller?.abort();
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    const toggle = this.querySelector('[data-upgrades-toggle]');
    const panel = this.querySelector('[data-upgrades-panel]');
    if (!(toggle instanceof HTMLButtonElement) || !(panel instanceof HTMLElement)) return;

    toggle.addEventListener(
      'click',
      () => {
        const open = this.dataset.open !== 'true';
        this.dataset.open = open ? 'true' : 'false';
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        panel.hidden = !open;
      },
      { signal }
    );
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#controller = null;
  }
}

class ProductPairsCarousel extends HTMLElement {
  /** @type {AbortController | null} */
  #controller = null;

  connectedCallback() {
    this.#controller?.abort();
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    const track = this.querySelector('[data-pairs-track]');
    const previous = this.querySelector('[data-pairs-previous]');
    const next = this.querySelector('[data-pairs-next]');
    if (!(track instanceof HTMLElement)) return;

    const updateButtons = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      const atStart = track.scrollLeft <= 2;
      const atEnd = track.scrollLeft >= maxScroll - 2;
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
      track.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' });
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

if (!customElements.get('product-upgrades-accordion')) {
  customElements.define('product-upgrades-accordion', ProductUpgradesAccordion);
}

if (!customElements.get('product-pairs-carousel')) {
  customElements.define('product-pairs-carousel', ProductPairsCarousel);
}
