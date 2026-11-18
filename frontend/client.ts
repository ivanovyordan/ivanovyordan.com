import './index.css';
import { getSiteConfig } from './utils/site';
import { handleExternalLinkClick, trackBlogPostView, trackBookingClick } from './utils/analytics';
import { initConsent } from './consent';

/**
 * The only script every page loads. The pages are plain pre-rendered HTML, so this
 * does the few things HTML and CSS cannot: the phone menu, click tracking, the
 * video play button, the booking calendar and the analytics consent banner. Sentry
 * and the digital twin are separate chunks that load later.
 */

const BARS =
  '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 13h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const CROSS =
  '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const TIDYCAL_EMBED = 'https://asset-tidycal.b-cdn.net/js/embed.js';

/** A page opened as its own file (/about.html, a static preview) is the same page as /about. */
function cleanUrl(): void {
  const { pathname, search, hash } = window.location;
  if (!pathname.endsWith('.html')) return;
  const clean = pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  window.history.replaceState(null, '', clean + search + hash);
}

/** The phone sheet: the header's menu button, Escape, and a tap on any link inside it. */
function initNav(): void {
  const nav = document.querySelector<HTMLElement>('.nav');
  const toggle = nav?.querySelector<HTMLButtonElement>('.nav__toggle');
  if (!nav || !toggle) return;

  const setOpen = (open: boolean) => {
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-locked', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.innerHTML = open ? CROSS : BARS;
  };

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  nav.addEventListener('click', (event) => {
    if (nav.classList.contains('is-open') && (event.target as Element).closest('a[href]')) setOpen(false);
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}

/** Clicks: tracking attributes on links, and the video play button. */
function initClicks(): void {
  document.addEventListener('click', (event) => {
    const target = event.target as Element;

    const tracked = target.closest<HTMLElement>('[data-track]');
    if (tracked?.dataset.track === 'booking') {
      trackBookingClick(tracked.dataset.trackLoc);
    } else if (tracked?.dataset.track === 'external') {
      handleExternalLinkClick((tracked as HTMLAnchorElement).href, tracked.dataset.trackLabel);
    }

    const video = target.closest<HTMLElement>('[data-video]');
    if (video) {
      const iframe = document.createElement('iframe');
      iframe.src = video.dataset.video as string;
      iframe.title = video.dataset.videoTitle || 'Video';
      iframe.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      video.replaceWith(iframe);
    }
  });
}

/** The TidyCal calendar: its embed.js turns every div.tidycal-embed into the calendar. */
function initBooking(): void {
  if (!document.querySelector('.tidycal-embed')) return;

  const script = document.createElement('script');
  script.src = TIDYCAL_EMBED;
  script.async = true;
  script.addEventListener('load', () => {
    // The calendar grows the page after the browser has scrolled to the anchor.
    const anchor = window.location.hash.slice(1);
    if (anchor) document.getElementById(anchor)?.scrollIntoView();
  });
  document.body.appendChild(script);

  window.setTimeout(() => {
    const fallback = document.querySelector<HTMLElement>('[data-booking-fallback]');
    if (fallback && !document.querySelector('.booking-host iframe')) fallback.hidden = false;
  }, 8000);
}

/** A blog post's page view. */
function initPostView(): void {
  const post = document.querySelector<HTMLElement>('[data-post-id]');
  if (post) trackBlogPostView(post.dataset.postId as string, post.dataset.postTitle);
}

/**
 * Sentry loads when the browser is idle, or at the first error. Errors that happen
 * before it is there are buffered and replayed.
 */
function initErrorTracking(): void {
  if (!getSiteConfig().errorTracking?.sentryDsn) return;

  const buffered: Array<ErrorEvent | PromiseRejectionEvent> = [];
  let started = false;

  const buffer = (event: ErrorEvent | PromiseRejectionEvent) => {
    buffered.push(event);
    start();
  };
  const start = () => {
    if (started) return;
    started = true;
    window.removeEventListener('error', buffer);
    window.removeEventListener('unhandledrejection', buffer);
    import('./sentry').then(({ initSentry }) => initSentry(buffered));
  };

  window.addEventListener('error', buffer);
  window.addEventListener('unhandledrejection', buffer);
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 5000 }) : setTimeout(start, 3000));
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });
}

/** The digital twin loads when its section nears the screen, or at the first focus inside it. */
function initTwin(): void {
  const section = document.getElementById('twin');
  if (!section) return;

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    observer?.disconnect();
    import('./twin').then(({ initTwin }) => initTwin(section));
  };

  const observer =
    'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => entries.some((entry) => entry.isIntersecting) && start(), {
          rootMargin: '600px',
        })
      : null;
  if (observer) observer.observe(section);
  else start();
  section.addEventListener('focusin', start, { once: true });
}

cleanUrl();
initNav();
initClicks();
initBooking();
initConsent();
initPostView();
initErrorTracking();
initTwin();
