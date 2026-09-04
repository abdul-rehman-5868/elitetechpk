import { isMobileBreakpoint } from '@theme/utilities';

/**
 * Drives the mobile header-collapse / bottom-dock reveal behavior.
 *
 * Mobile only (<750px), on every template. Below SCROLL_THRESHOLD the header
 * stays visible as normal. Once scrolled past it, scrolling down hides the
 * sticky header and reveals the bottom dock; scrolling back up at any point
 * reverses both. Toggles `[data-mobile-nav-collapsed]` on <body>, which
 * sections/header.liquid and this file's companion snippet
 * (mobile-bottom-nav.liquid) key off of.
 *
 * Previously this used the height of the page's first section (the
 * homepage's hero carousel) as the threshold, which only made sense on the
 * homepage — collapsing at a fixed distance instead makes the behavior
 * identical across every template, since the dock now renders everywhere.
 */

const COLLAPSED_ATTR = 'data-mobile-nav-collapsed';
const SCROLL_THRESHOLD = 300;

let lastScrollY = window.scrollY;
let collapsed = false;
let ticking = false;

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

  if (scrollY < SCROLL_THRESHOLD) {
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
  update();
}

update();
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onResize, { passive: true });

// The mobile menu button above now uses on:click="#menu-drawer/toggle" —
// the same standard dispatch mechanism Cart and Search use — since the menu
// drawer was migrated to <theme-drawer> (see snippets/header-drawer.liquid).
// No special-case JS is needed here any more.
