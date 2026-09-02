/**
 * Play/pause control for the immersive video banner background.
 *
 * @typedef {Object} Refs
 * @property {HTMLVideoElement} [video]
 * @property {HTMLButtonElement} [toggle]
 *
 * @extends {HTMLElement}
 */
class ImmersiveVideoBanner extends HTMLElement {
  /** @type {AbortController | null} */
  #controller = null;

  connectedCallback() {
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.#bindVideo();
    this.#syncButton();

    this.toggle?.addEventListener('click', this.#onToggle, { signal });
    this.video?.addEventListener('play', this.#syncButton, { signal });
    this.video?.addEventListener('pause', this.#syncButton, { signal });

    if (this.dataset.reducedMotion === 'true') {
      this.video?.pause();
      this.#syncButton();
      return;
    }

    if (this.dataset.autoplay === 'true') {
      this.#tryAutoplay();
    }
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#controller = null;
  }

  get video() {
    return /** @type {HTMLVideoElement | null} */ (this.querySelector('[ref="video"], video'));
  }

  get toggle() {
    return /** @type {HTMLButtonElement | null} */ (this.querySelector('[ref="toggle"]'));
  }

  #bindVideo() {
    const video = this.video;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    if (this.dataset.loop === 'true') video.loop = true;
  }

  #tryAutoplay = async () => {
    const video = this.video;
    if (!video) return;

    try {
      await video.play();
    } catch {
      // Autoplay may be blocked; leave paused until visitor interacts.
    }

    this.#syncButton();
  };

  #onToggle = async () => {
    const video = this.video;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
      } catch {
        // Ignore play failures from browser policies.
      }
    } else {
      video.pause();
    }

    this.#syncButton();
  };

  #syncButton = () => {
    const video = this.video;
    const toggle = this.toggle;
    if (!toggle) return;

    const paused = !video || video.paused;
    toggle.setAttribute('aria-pressed', paused ? 'false' : 'true');
    toggle.dataset.state = paused ? 'paused' : 'playing';
    this.dataset.state = paused ? 'paused' : 'playing';
    toggle.setAttribute('aria-label', paused ? 'Play video' : 'Pause video');
  };
}

if (!customElements.get('immersive-video-banner')) {
  customElements.define('immersive-video-banner', ImmersiveVideoBanner);
}
