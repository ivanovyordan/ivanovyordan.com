# Coaching Thank You Page — Design Spec

**Date:** 2026-05-02

## Context

After a client pays for coaching, they need to be redirected somewhere that confirms the purchase and points them to book their first call. Currently there is no such page. This is a minimal post-payment confirmation page.

## Goal

A simple thank-you page at `/coaching-thank-you` that:
1. Acknowledges the payment
2. Gives the client the link to book their first (and every subsequent) call

## Design

### URL & Routing

- **Path:** `/coaching-thank-you`
- **No routing changes needed** — the existing `/:slug` route in `App.tsx` handles this automatically.

### Content

Single `cta-section` block with:
- **Title:** "You're in."
- **Description:** "Thank you for investing in your growth. Book your first call below — the same link works for every session."
- **Button text:** "Book Your Call"
- **Button URL:** `https://cal.com/ivanovyordan/private-coaching`
- **SEO:** `noindex: true`, title "Thank You — Yordan Ivanov"

### Files to create/modify

| File | Change |
|------|--------|
| `frontend/content/pages/coaching-thank-you.json` | New page content file |
| `frontend/components/blocks/CTASectionBlock.tsx` | 1-line fix (see below) |

### CTASectionBlock fix

Current logic treats any `buttonUrl` containing `cal.com` as a booking embed and ignores the URL, using the site config instead. Fix: when `buttonUrl` is explicitly provided, use a direct `<a href>` link.

**Before:**
```js
const isBooking = !block.buttonUrl || block.buttonUrl.includes('tidycal.com') || block.buttonUrl.includes('cal.com');
```

**After:**
```js
const isBooking = !block.buttonUrl && !!siteConfig.calCom;
```

This makes the semantics clear: no `buttonUrl` = use site-wide Cal.com embed; explicit `buttonUrl` = use direct link.

## Verification

1. Run `npm run dev` in `frontend/`
2. Visit `http://localhost:5173/coaching-thank-you`
3. Confirm page renders with title, description, and button
4. Confirm button links to `https://cal.com/ivanovyordan/private-coaching`
5. Confirm dark mode renders correctly
6. Confirm page is not indexed (check `<meta name="robots">` in page source)
