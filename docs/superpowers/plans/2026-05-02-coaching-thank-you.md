# Coaching Thank You Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/coaching-thank-you` page that thanks paying coaching clients and links them to book their first call.

**Architecture:** New JSON content file using the existing block system. Two small code changes: fix a bug in `CTASectionBlock` where `buttonUrl` is ignored for Cal.com links, and add `noindex` support to the SEO system. No routing changes needed — `/:slug` already handles it.

**Tech Stack:** React 19, Vite, React Router DOM 7, Tailwind CSS v4, TypeScript

---

### Task 1: Fix CTASectionBlock to respect explicit buttonUrl

**Files:**
- Modify: `frontend/components/blocks/CTASectionBlock.tsx:34`

Currently, any `buttonUrl` containing `cal.com` is treated as a booking embed and the URL is ignored — the site-wide Cal.com config is used instead. This is a bug. Fix: when `buttonUrl` is explicitly provided, use a direct `<a href>` link.

- [ ] **Step 1: Open the file and locate the isBooking line**

Open `frontend/components/blocks/CTASectionBlock.tsx`. Find line 34:

```js
const isBooking = !block.buttonUrl || block.buttonUrl.includes('tidycal.com') || block.buttonUrl.includes('cal.com');
```

- [ ] **Step 2: Replace with corrected logic**

Replace that line with:

```js
const isBooking = !block.buttonUrl && !!siteConfig.calCom;
```

This means: use the Cal.com embed only when no explicit URL is given AND the site has Cal.com configured. When `buttonUrl` is provided, always use a direct link.

- [ ] **Step 3: Verify the file looks correct after the change**

The relevant section of `CTASectionBlock.tsx` should now look like:

```tsx
{block.buttonText && (() => {
  const isBooking = !block.buttonUrl && !!siteConfig.calCom;
  const className = block.pricing
    ? 'w-full bg-black dark:bg-white text-white dark:text-black py-4 font-bold hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors uppercase tracking-widest text-xs focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white cursor-pointer inline-block max-w-xs text-center'
    : 'inline-block bg-black dark:bg-white text-white dark:text-black px-12 py-5 text-lg font-bold hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors uppercase tracking-[0.2em] focus:outline-none focus:ring-4 focus:ring-black/20 dark:focus:ring-white/20 cursor-pointer text-center';

  if (isBooking && siteConfig.calCom) {
    return (
      <button
        onClick={() => trackBookingClick('cta_section')}
        data-cal-link={siteConfig.calCom.link}
        data-cal-namespace={siteConfig.calCom.namespace}
        data-cal-config={JSON.stringify(siteConfig.calCom.config)}
        className={className}
      >
        {block.buttonText}
      </button>
    );
  }

  return (
    <a
      href={block.buttonUrl || '#'}
      target={block.buttonUrl ? "_blank" : undefined}
      rel={block.buttonUrl ? "noopener noreferrer" : undefined}
      className={className}
    >
      {block.buttonText}
    </a>
  );
})()}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/components/blocks/CTASectionBlock.tsx
git commit -m "fix: use direct link when buttonUrl is explicitly provided in CTASectionBlock"
```

---

### Task 2: Add noindex support to the SEO system

**Files:**
- Modify: `frontend/types.ts:27-33` (the `seo` field in `PageContent`)
- Modify: `frontend/components/SEO.tsx` (add noindex handling)

- [ ] **Step 1: Add `noindex` to the PageContent SEO type**

In `frontend/types.ts`, find the `PageContent` interface (around line 22). The `seo` field currently is:

```ts
seo?: {
  title?: string;
  description?: string;
  ogImage?: string;
};
```

Add `noindex`:

```ts
seo?: {
  title?: string;
  description?: string;
  ogImage?: string;
  noindex?: boolean;
};
```

- [ ] **Step 2: Handle noindex in SEO.tsx**

In `frontend/components/SEO.tsx`, find the `initializeSEO` function (around line 250). After the `updateFeedLinks()` call, add:

```ts
// Handle noindex
if (page?.seo?.noindex) {
  updateMetaTag('robots', 'noindex, nofollow');
} else {
  updateMetaTag('robots', 'index, follow');
}
```

The full updated `initializeSEO` function should be:

```ts
function initializeSEO(
  page: PageContent | undefined,
  siteConfig: ReturnType<typeof getSiteConfig>,
  pathname: string
): void {
  const title = getPageTitle(page, siteConfig.seo.defaultTitle);
  const description = getPageDescription(page, siteConfig.seo.defaultDescription);
  const ogImage = page?.seo?.ogImage;
  const sections = page?.sections;
  const canonicalUrl = getCanonicalUrl(pathname);

  updateDocumentTitle(title);
  updateBasicMetaTags(title, description);
  updateCanonicalUrl(canonicalUrl);
  updateFeedLinks();
  if (page?.seo?.noindex) {
    updateMetaTag('robots', 'noindex, nofollow');
  } else {
    updateMetaTag('robots', 'index, follow');
  }
  updateOpenGraphTags(
    title,
    description,
    canonicalUrl,
    siteConfig.name,
    ogImage,
    sections
  );
  updateTwitterCardTags(title, description, ogImage, sections);
  updateStructuredData(siteConfig.name, siteConfig.seo.defaultDescription);
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/types.ts frontend/components/SEO.tsx
git commit -m "feat: add noindex support to SEO system"
```

---

### Task 3: Create the coaching-thank-you page

**Files:**
- Create: `frontend/content/pages/coaching-thank-you.json`

- [ ] **Step 1: Create the page content file**

Create `frontend/content/pages/coaching-thank-you.json` with this content:

```json
{
  "title": "Thank You",
  "slug": "coaching-thank-you",
  "published": true,
  "seo": {
    "title": "Thank You — Yordan Ivanov",
    "description": "Thank you for investing in your growth.",
    "noindex": true
  },
  "sections": [
    {
      "_block": "cta-section",
      "title": "You're in.",
      "description": "Thank you for investing in your growth. Book your first call below — the same link works for every session.",
      "buttonText": "Book Your Call",
      "buttonUrl": "https://cal.com/ivanovyordan/private-coaching"
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/content/pages/coaching-thank-you.json
git commit -m "feat: add coaching thank you page at /coaching-thank-you"
```

---

### Task 4: Verify end-to-end

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/yordan/workspace/apps/ivanovyordan.com/frontend
npm run dev
```

- [ ] **Step 2: Visit the page**

Open `http://localhost:5173/coaching-thank-you` in a browser.

Expected: Page renders with:
- Heading "You're in."
- Description text about booking
- Black "BOOK YOUR CALL" button

- [ ] **Step 3: Verify button links to private coaching URL**

Click the button (or inspect it). Expected: opens `https://cal.com/ivanovyordan/private-coaching` in a new tab. Must NOT open the discovery-call Cal.com embed popup.

- [ ] **Step 4: Verify noindex**

Open browser DevTools → Elements → `<head>`. Look for:

```html
<meta name="robots" content="noindex, nofollow">
```

- [ ] **Step 5: Verify dark mode**

Toggle dark mode in browser (or OS). Expected: page uses dark background (`zinc-900`), white text, white button.

- [ ] **Step 6: Verify existing booking still works**

Visit `http://localhost:5173/coaching`. Click "Book a Discovery Call". Expected: Cal.com embed popup still opens (site-wide config unchanged).
