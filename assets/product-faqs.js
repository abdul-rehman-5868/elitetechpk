/**
 * Smooth height animation for product FAQs <details> rows.
 */
class ProductFaqs extends HTMLElement {
  /** @type {AbortController | null} */
  #controller = null;

  connectedCallback() {
    this.#controller?.abort();
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    for (const details of this.querySelectorAll('details.product-faqs__item')) {
      if (!(details instanceof HTMLDetailsElement)) continue;
      const summary = details.querySelector('summary');
      const panel = details.querySelector('.product-faqs__panel');
      if (!(summary instanceof HTMLElement) || !(panel instanceof HTMLElement)) continue;

      panel.style.height = details.open ? 'auto' : '0px';

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

if (!customElements.get('product-faqs')) {
  customElements.define('product-faqs', ProductFaqs);
}
