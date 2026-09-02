/**
 * Smooth height animation for product tech specs <details> rows.
 */
class ProductTechSpecs extends HTMLElement {
  /** @type {AbortController | null} */
  #controller = null;

  connectedCallback() {
    this.#controller?.abort();
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    for (const details of this.querySelectorAll('details.product-tech-specs__group')) {
      if (!(details instanceof HTMLDetailsElement)) continue;
      const summary = details.querySelector('summary');
      const panel = details.querySelector('.product-tech-specs__panel');
      if (!(summary instanceof HTMLElement) || !(panel instanceof HTMLElement)) continue;

      if (details.open) {
        panel.style.height = 'auto';
      } else {
        panel.style.height = '0px';
      }

      summary.addEventListener(
        'click',
        (event) => {
          event.preventDefault();
          if (details.dataset.animating === 'true') return;

          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            details.open = !details.open;
            panel.style.height = details.open ? 'auto' : '0px';
            return;
          }

          if (details.open) this.#close(details, panel);
          else this.#open(details, panel);
        },
        { signal }
      );
    }
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#controller = null;
  }

  /**
   * @param {HTMLDetailsElement} details
   * @param {HTMLElement} panel
   */
  #open(details, panel) {
    details.dataset.animating = 'true';
    details.open = true;
    panel.style.height = '0px';
    panel.offsetHeight;
    panel.style.height = `${panel.scrollHeight}px`;

    const onEnd = (event) => {
      if (event.propertyName !== 'height') return;
      panel.style.height = 'auto';
      details.dataset.animating = 'false';
      panel.removeEventListener('transitionend', onEnd);
    };
    panel.addEventListener('transitionend', onEnd);
  }

  /**
   * @param {HTMLDetailsElement} details
   * @param {HTMLElement} panel
   */
  #close(details, panel) {
    details.dataset.animating = 'true';
    panel.style.height = `${panel.scrollHeight}px`;
    panel.offsetHeight;
    panel.style.height = '0px';

    const onEnd = (event) => {
      if (event.propertyName !== 'height') return;
      details.open = false;
      details.dataset.animating = 'false';
      panel.removeEventListener('transitionend', onEnd);
    };
    panel.addEventListener('transitionend', onEnd);
  }
}

if (!customElements.get('product-tech-specs')) {
  customElements.define('product-tech-specs', ProductTechSpecs);
}
