import { RecentlyViewed } from '@theme/recently-viewed-products';

/**
 * Cart drawer tabs + recently viewed panel.
 */
class CartDrawerUI {
  /** @param {HTMLElement} root */
  constructor(root) {
    this.root = root;
    this.#bindTabs();
  }

  #bindTabs() {
    const tabs = this.root.querySelectorAll('[data-cart-tab]');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        if (!(tab instanceof HTMLElement)) return;
        const target = tab.dataset.cartTab;
        this.#activateTab(target || 'cart');
        if (target === 'recent') this.#loadRecentlyViewed();
      });
    });
  }

  /** @param {string} target */
  #activateTab(target) {
    this.root.querySelectorAll('[data-cart-tab]').forEach((tab) => {
      const active = tab instanceof HTMLElement && tab.dataset.cartTab === target;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    this.root.querySelectorAll('[data-cart-panel]').forEach((panel) => {
      if (!(panel instanceof HTMLElement)) return;
      const active = panel.dataset.cartPanel === target;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
  }

  async #loadRecentlyViewed() {
    const container = this.root.querySelector('[data-cart-recent]');
    if (!(container instanceof HTMLElement)) return;
    if (container.dataset.loaded === 'true') return;

    const ids = RecentlyViewed.getProducts();
    if (!ids.length) {
      container.innerHTML = `<p class="cart-drawer-recent__empty">No recently viewed products yet.</p>`;
      container.dataset.loaded = 'true';
      return;
    }

    container.innerHTML = `<p class="cart-drawer-recent__loading">Loading recently viewed…</p>`;

    try {
      const query = ids.map((id) => `id:${id}`).join(' OR ');
      const url = `${window.Shopify.routes.root}search?type=product&q=${encodeURIComponent(query)}&section_id=cart-drawer-recent`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const section = doc.querySelector('#shopify-section-cart-drawer-recent, [data-cart-recent-section]');
      container.innerHTML = section?.innerHTML || `<p class="cart-drawer-recent__empty">No recently viewed products yet.</p>`;
      container.dataset.loaded = 'true';
    } catch (error) {
      console.warn('[cart-drawer-ui]', error);
      container.innerHTML = `<p class="cart-drawer-recent__empty">Unable to load recently viewed products.</p>`;
    }
  }
}

function initCartDrawerUI() {
  const root = document.querySelector('#cart-drawer');
  if (!(root instanceof HTMLElement) || root.dataset.uiBound === 'true') return;
  root.dataset.uiBound = 'true';
  new CartDrawerUI(root);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCartDrawerUI, { once: true });
} else {
  initCartDrawerUI();
}

document.addEventListener('shopify:section:load', initCartDrawerUI);
