import { isMobileBreakpoint } from '@theme/utilities';

/**
 * Drives the mobile header-collapse / bottom-dock reveal behavior.
 *
 * Mobile only (<750px). While the first section on the page (the hero on
 * the homepage) is still in view, the header stays visible as normal. Once
 * scrolled past it, scrolling down hides the sticky header and reveals the
 * bottom dock; scrolling back up at any point reverses both. Toggles
 * `[data-mobile-nav-collapsed]` on <body>, which sections/header.liquid and
 * this file's companion snippet (mobile-bottom-nav.liquid) key off of.
 */

const COLLAPSED_ATTR = 'data-mobile-nav-collapsed';

let heroBottom = 0;
let lastScrollY = window.scrollY;
let collapsed = false;
let ticking = false;

function measureHero() {
  const hero = document.querySelector('#MainContent .shopify-section');
  heroBottom = hero instanceof HTMLElement ? hero.offsetTop + hero.offsetHeight : window.innerHeight;
}

/** @param {boolean} value */
function setCollapsed(value) {
  if (collapsed === value) return;
  collapsed = value;
  document.body.toggleAttribute(COLLAPSED_ATTR, value);
}

function update() {
  ticking = false;

  if (!isMobileBreakpoint()) {
    setCollapsed(false);
    lastScrollY = window.scrollY;
    return;
  }

  const scrollY = window.scrollY;
  const scrollingDown = scrollY > lastScrollY;

  if (scrollY < heroBottom) {
    setCollapsed(false);
  } else if (scrollingDown) {
    setCollapsed(true);
  } else {
    setCollapsed(false);
  }

  lastScrollY = scrollY;
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(update);
}

function onResize() {
  measureHero();
  update();
}

measureHero();
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onResize, { passive: true });

/**
 * The mobile menu is a native <details>/<summary> drawer (see
 * snippets/header-drawer.liquid), not a custom element addressable via the
 * theme's `on:click="#id/action"` dispatch used by cart-drawer/search-modal
 * — so the dock's Menu button opens it with a direct DOM toggle instead.
 */
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest('[data-mobile-bottom-nav-menu]') : null;
  if (!target) return;

  const menuDrawer = document.getElementById('Details-menu-drawer-container');
  if (menuDrawer instanceof HTMLDetailsElement) {
    menuDrawer.open = true;
  }
});
