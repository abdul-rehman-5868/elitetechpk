import { Component } from '@theme/component';
import { formatMoney } from '@theme/money-formatting';
import { CartLinesUpdateEvent, CartErrorEvent } from '@shopify/events';

/**
 * @typedef {Object} BundleBuilderRefs
 * @property {HTMLElement} [summaryList]
 * @property {HTMLElement} [totalValue]
 * @property {HTMLElement} [statusText]
 * @property {HTMLButtonElement} [addButton]
 * @property {HTMLElement} [errorText]
 * @property {HTMLElement} [liveRegion]
 * @property {HTMLTemplateElement} [itemTemplate]
 * @property {HTMLTemplateElement} [placeholderTemplate]
 */

/**
 * Collection-driven bundle builder with selectable product cards and sticky summary.
 *
 * @extends {Component<BundleBuilderRefs>}
 */
class BundleBuilder extends Component {
  requiredRefs = ['summaryList', 'totalValue', 'addButton', 'statusText'];

  /** @type {Map<string, { variantId: string, productId: string, title: string, vendor: string, price: number, image: string, imageAlt: string }>} */
  #selected = new Map();

  /** @type {boolean} */
  #submitting = false;

  connectedCallback() {
    super.connectedCallback();
    this.#render();
  }

  /**
   * Toggle product selection from a card button.
   * @param {Event} event
   */
  toggleProduct = (event) => {
    const button = /** @type {HTMLElement | null} */ (event.currentTarget);
    if (!(button instanceof HTMLButtonElement) || button.disabled) return;

    const variantId = button.dataset.variantId;
    if (!variantId) return;

    if (this.#selected.has(variantId)) {
      this.#selected.delete(variantId);
      button.setAttribute('aria-pressed', 'false');
      button.classList.remove('is-selected');
    } else {
      this.#selected.set(variantId, {
        variantId,
        productId: button.dataset.productId || '',
        title: button.dataset.title || '',
        vendor: button.dataset.vendor || '',
        price: Number(button.dataset.price || 0),
        image: button.dataset.image || '',
        imageAlt: button.dataset.imageAlt || button.dataset.title || '',
      });
      button.setAttribute('aria-pressed', 'true');
      button.classList.add('is-selected');
    }

    this.#render();
  };

  /**
   * Remove a selected item from the summary list.
   * @param {Event} event
   */
  removeProduct = (event) => {
    const button = /** @type {HTMLElement | null} */ (event.currentTarget);
    const variantId = button?.dataset?.variantId;
    if (!variantId) return;

    this.#selected.delete(variantId);

    const card = this.querySelector(`button.bundle-builder__card[data-variant-id="${variantId}"]`);
    if (card instanceof HTMLButtonElement) {
      card.setAttribute('aria-pressed', 'false');
      card.classList.remove('is-selected');
    }

    this.#render();
  };

  /**
   * Add all selected variants to the cart in one request.
   * @param {Event} event
   */
  addBundle = async (event) => {
    event.preventDefault();
    if (this.#submitting || !this.#canAdd) return;

    if (this.dataset.demo === 'true') {
      this.#setError('Select a collection in the theme editor to enable checkout.');
      return;
    }

    const items = Array.from(this.#selected.values()).map((item) => ({
      id: Number(item.variantId),
      quantity: 1,
    }));

    if (!items.length || items.some((item) => !Number.isFinite(item.id))) return;

    this.#submitting = true;
    this.#setError('');
    this.#syncButtonState();

    const cartItemsComponents = document.querySelectorAll('cart-items-component');
    /** @type {string[]} */
    const sectionIds = [];
    cartItemsComponents.forEach((item) => {
      if (item instanceof HTMLElement && item.dataset.sectionId) {
        sectionIds.push(item.dataset.sectionId);
      }
    });

    const deferredEventPromise = CartLinesUpdateEvent.createPromise();
    this.dispatchEvent(
      new CartLinesUpdateEvent({
        action: 'add',
        context: 'product',
        lines: items.map((item) => ({
          merchandiseId: String(item.id),
          quantity: item.quantity,
        })),
        promise: deferredEventPromise.promise,
      })
    );

    try {
      const response = await fetch(Theme.routes.cart_add_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          items,
          sections: sectionIds.join(','),
        }),
      });

      const data = await response.json();

      if (data.status) {
        this.dispatchEvent(
          new CartErrorEvent({
            error: data.message || 'Add to cart failed',
            code: 'INVALID',
            detail: {
              description: data.description,
              errors: data.errors,
            },
          })
        );

        const ajaxCart = await this.#refreshCart();
        deferredEventPromise.resolve({
          cart: CartLinesUpdateEvent.createCartFromAjaxResponse(ajaxCart),
          detail: {
            didError: true,
            items: ajaxCart.items,
            source: 'bundle-builder',
            sourceId: this.id || '',
            itemCount: items.length,
            sections: data.sections,
          },
        });

        this.#setError(data.message || 'Unable to add bundle to cart');
        return;
      }

      const cart = await this.#refreshCart();
      deferredEventPromise.resolve({
        cart: CartLinesUpdateEvent.createCartFromAjaxResponse(cart),
        detail: {
          items: cart.items,
          source: 'bundle-builder',
          sourceId: this.id || '',
          itemCount: items.length,
          sections: data.sections,
          didError: false,
        },
      });

      this.#announce(Theme.translations.added || 'Added');
    } catch (error) {
      console.error(error);
      deferredEventPromise.reject(error);
      this.dispatchEvent(
        new CartErrorEvent({
          error: error instanceof Error ? error.message : 'Network error during add to cart',
          code: 'SERVICE_UNAVAILABLE',
        })
      );
      this.#setError('Unable to add bundle to cart');
    } finally {
      this.#submitting = false;
      this.#syncButtonState();
    }
  };

  get #minimum() {
    return Number(this.dataset.minimum || 3);
  }

  get #savingsPercent() {
    return Number(this.dataset.savingsPercent || 0);
  }

  get #canAdd() {
    return this.#selected.size >= this.#minimum && !this.#submitting;
  }

  #render() {
    this.#renderSummary();
    this.#renderTotals();
    this.#renderStatus();
    this.#syncButtonState();
  }

  #renderSummary() {
    const list = this.refs.summaryList;
    const itemTemplate = this.refs.itemTemplate;
    const placeholderTemplate = this.refs.placeholderTemplate;
    if (!(list instanceof HTMLElement)) return;

    list.replaceChildren();

    if (this.#selected.size === 0) {
      const count = Math.max(this.#minimum, 3);
      for (let i = 0; i < count; i++) {
        if (placeholderTemplate instanceof HTMLTemplateElement) {
          list.append(placeholderTemplate.content.cloneNode(true));
        }
      }
      return;
    }

    for (const item of this.#selected.values()) {
      if (!(itemTemplate instanceof HTMLTemplateElement)) continue;
      const node = /** @type {DocumentFragment} */ (itemTemplate.content.cloneNode(true));
      const row = node.querySelector('.bundle-builder__summary-item');
      const image = node.querySelector('[data-summary-image]');
      const title = node.querySelector('[data-summary-title]');
      const price = node.querySelector('[data-summary-price]');
      const remove = node.querySelector('[data-summary-remove]');

      if (row instanceof HTMLElement) row.dataset.variantId = item.variantId;
      if (image instanceof HTMLImageElement) {
        if (item.image) {
          image.src = item.image;
          image.alt = item.imageAlt;
          image.hidden = false;
        } else {
          image.hidden = true;
        }
      }
      if (title) title.textContent = item.title;
      if (price) price.textContent = this.#format(item.price);
      if (remove instanceof HTMLElement) remove.dataset.variantId = item.variantId;

      list.append(node);
    }
  }

  #renderTotals() {
    const totalEl = this.refs.totalValue;
    if (!(totalEl instanceof HTMLElement)) return;

    const subtotal = Array.from(this.#selected.values()).reduce((sum, item) => sum + item.price, 0);
    const savings = this.#savingsPercent > 0 ? Math.round(subtotal * (this.#savingsPercent / 100)) : 0;
    const estimated = Math.max(subtotal - savings, 0);

    totalEl.textContent = this.#format(estimated);
    totalEl.dataset.subtotal = String(subtotal);
    totalEl.dataset.estimated = String(estimated);
  }

  #renderStatus() {
    const status = this.refs.statusText;
    if (!(status instanceof HTMLElement)) return;

    const remaining = Math.max(this.#minimum - this.#selected.size, 0);
    const template = this.dataset.statusTemplate || 'Add at least [count] products to proceed and Save [percent]%';
    const readyTemplate = this.dataset.readyTemplate || 'Ready to add — Save [percent]%';

    const message =
      remaining > 0
        ? template
            .split('[count]')
            .join(String(this.#minimum))
            .split('[percent]')
            .join(String(this.#savingsPercent))
            .split('[selected]')
            .join(String(this.#selected.size))
        : readyTemplate
            .split('[percent]')
            .join(String(this.#savingsPercent))
            .split('[selected]')
            .join(String(this.#selected.size));

    status.textContent = message;
  }

  #syncButtonState() {
    const button = this.refs.addButton;
    if (!(button instanceof HTMLButtonElement)) return;
    button.disabled = !this.#canAdd;
    button.setAttribute('aria-disabled', String(!this.#canAdd));
    button.classList.toggle('is-loading', this.#submitting);
  }

  /**
   * @param {number} cents
   */
  #format(cents) {
    const format = this.dataset.moneyFormat || '{{amount}}';
    const currency = this.dataset.currency || 'USD';
    return formatMoney(cents, format, currency);
  }

  /**
   * @param {string} message
   */
  #setError(message) {
    const error = this.refs.errorText;
    if (!(error instanceof HTMLElement)) return;
    error.textContent = message;
    error.hidden = !message;
  }

  /**
   * @param {string} message
   */
  #announce(message) {
    const live = this.refs.liveRegion;
    if (!(live instanceof HTMLElement)) return;
    live.textContent = message;
  }

  async #refreshCart() {
    /** @type {any} */
    const cartItemsComponent = document.querySelector('cart-items-component');

    if (cartItemsComponent?.fetchCartData) {
      await customElements.whenDefined('cart-items-component');
      return cartItemsComponent.fetchCartData();
    }

    return fetch(`${Theme.routes.cart_url}.json`, {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    }).then((response) => {
      if (!response.ok) throw new Error(`Failed to fetch cart: ${response.status}`);
      return response.json();
    });
  }
}

if (!customElements.get('bundle-builder')) {
  customElements.define('bundle-builder', BundleBuilder);
}
