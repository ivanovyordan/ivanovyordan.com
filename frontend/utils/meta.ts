import type { PageContent, Post } from "../types";
import { getSiteConfig, getDefaultDescription } from "./site";
import { getCanonicalUrl } from "./routes";

/**
 * Everything a route puts in <head>: title, description, canonical, robots,
 * Open Graph / Twitter tags and JSON-LD.
 *
 * One description per route, built here, so the pre-rendered HTML (see
 * entry-server.tsx) and the client (components/SEO.tsx) carry the same tags.
 */
export interface RouteMeta {
  title: string;
  description: string;
  /** Absolute URL. Omitted for pages that should not be indexed under a URL. */
  canonical?: string;
  robots: "index, follow" | "noindex, nofollow";
  ogType: "website" | "article";
  /** Absolute image URL for Open Graph / Twitter cards. */
  image?: string;
  jsonLd: Record<string, unknown>[];
}

type Schema = Record<string, unknown>;

const SCHEMA_CONTEXT = "https://schema.org";

function makeAbsoluteUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const baseUrl = getCanonicalUrl("/").replace(/\/$/, "");
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

/** Plain text for meta descriptions: strips markdown syntax and collapses whitespace. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** First image in a page's sections, for the social card. */
function getFirstImageFromSections(
  sections: PageContent["sections"] | undefined
): string | undefined {
  if (!sections) return undefined;
  for (const section of sections) {
    if (section._block === "image" && section.src) return section.src;
    if (section._block === "about-hero" && section.headshot) {
      return section.headshot;
    }
    if (section._block === "sidebar") {
      const inner = getFirstImageFromSections([
        section.sidebar,
        ...section.content,
      ]);
      if (inner) return inner;
    }
    if (section._block === "columns") {
      const inner = getFirstImageFromSections(section.items);
      if (inner) return inner;
    }
  }
  return undefined;
}

/** The path a CMS page is served at. */
export function getPagePath(page: PageContent): string {
  return page.slug === "home" ? "/" : `/${page.slug}`;
}

/**
 * Yordan as a schema.org Person. On every page, so a crawler can tie the
 * site, the blog and the coaching page to one person and his profiles.
 */
export function personSchema(): Schema {
  const site = getSiteConfig();
  const sameAs = (site.social || []).map((item) => item.url);
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Person",
    name: site.name,
    url: getCanonicalUrl("/"),
    ...(site.tagline ? { jobTitle: site.tagline } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

function personRef(): Schema {
  const site = getSiteConfig();
  return { "@type": "Person", name: site.name, url: getCanonicalUrl("/") };
}

function websiteSchema(): Schema {
  const site = getSiteConfig();
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    name: site.name,
    description: getDefaultDescription(),
    url: getCanonicalUrl("/"),
    author: personRef(),
  };
}

/**
 * The coaching offer as a schema.org Service. Provider is the Person,
 * the URL is where booking lives. No price and no offers: prices do not
 * appear on the website.
 */
function serviceSchema(page: PageContent): Schema {
  const site = getSiteConfig();
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Service",
    name: page.title,
    serviceType: "Coaching",
    ...(page.seo?.description ? { description: page.seo.description } : {}),
    provider: personRef(),
    url: site.bookingUrl || getCanonicalUrl(getPagePath(page)),
  };
}

export function buildPageMeta(page: PageContent): RouteMeta {
  const site = getSiteConfig();
  const image =
    page.seo?.ogImage || getFirstImageFromSections(page.sections);
  const jsonLd: Schema[] = [personSchema(), websiteSchema()];
  if (page.slug === "coaching") {
    jsonLd.push(serviceSchema(page));
  }

  return {
    title: page.seo?.title || `${page.title} - ${site.name}`,
    description: page.seo?.description || getDefaultDescription(),
    canonical: getCanonicalUrl(getPagePath(page)),
    robots: page.seo?.noindex ? "noindex, nofollow" : "index, follow",
    ogType: "website",
    image: image ? makeAbsoluteUrl(image) : undefined,
    jsonLd,
  };
}

export function buildBlogMeta(): RouteMeta {
  const site = getSiteConfig();
  return {
    title: `${site.blog.title} - ${site.name}`,
    description: site.blog.description,
    canonical: getCanonicalUrl("/blog"),
    robots: "index, follow",
    ogType: "website",
    jsonLd: [
      personSchema(),
      {
        "@context": SCHEMA_CONTEXT,
        "@type": "Blog",
        name: `${site.name} - ${site.blog.title}`,
        description: site.blog.description,
        url: getCanonicalUrl("/blog"),
        author: personRef(),
      },
    ],
  };
}

export function buildPostMeta(post: Post): RouteMeta {
  const site = getSiteConfig();
  const postUrl = getCanonicalUrl(`/blog/${post.id}`);
  const description = stripMarkdown(post.excerpt);
  const image = post.image ? makeAbsoluteUrl(post.image) : undefined;
  const postDate = new Date(post.date || Date.now()).toISOString();

  return {
    title: `${post.title} | ${site.name}`,
    description,
    canonical: postUrl,
    robots: "index, follow",
    ogType: "article",
    image,
    jsonLd: [
      personSchema(),
      {
        "@context": SCHEMA_CONTEXT,
        "@type": "BlogPosting",
        headline: post.title,
        description,
        ...(image ? { image } : {}),
        author: personRef(),
        datePublished: postDate,
        dateModified: postDate,
        mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
        publisher: { "@type": "Person", name: site.name },
      },
    ],
  };
}

export function buildNotFoundMeta(): RouteMeta {
  const site = getSiteConfig();
  return {
    title: `Page Not Found - ${site.name}`,
    description: getDefaultDescription(),
    robots: "noindex, nofollow",
    ogType: "website",
    jsonLd: [personSchema()],
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** JSON-LD goes inside a <script>, where "</" would end it early. */
function serializeJsonLd(jsonLd: Schema[]): string {
  return JSON.stringify(jsonLd).replace(/</g, "\\u003c");
}

/** The <head> tags for a route, as HTML. Used by the build-time pre-render. */
export function renderHeadTags(meta: RouteMeta): string {
  const site = getSiteConfig();
  const tags: string[] = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="robots" content="${meta.robots}" />`,
  ];
  if (meta.canonical) {
    tags.push(`<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`);
    tags.push(`<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`);
  }
  tags.push(
    `<meta property="og:type" content="${meta.ogType}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(site.name)}" />`,
    `<meta name="twitter:card" content="${meta.image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`
  );
  if (meta.image) {
    tags.push(
      `<meta property="og:image" content="${escapeHtml(meta.image)}" />`,
      `<meta name="twitter:image" content="${escapeHtml(meta.image)}" />`
    );
  }
  tags.push(
    `<script type="application/ld+json" id="route-schema">${serializeJsonLd(meta.jsonLd)}</script>`
  );
  return tags.map((tag) => `    ${tag}`).join("\n");
}

function setMeta(selector: string, create: () => HTMLElement, content: string): void {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setNamedMeta(name: string, content: string): void {
  setMeta(`meta[name="${name}"]`, () => {
    const el = document.createElement("meta");
    el.setAttribute("name", name);
    return el;
  }, content);
}

function setPropertyMeta(property: string, content: string): void {
  setMeta(`meta[property="${property}"]`, () => {
    const el = document.createElement("meta");
    el.setAttribute("property", property);
    return el;
  }, content);
}

function removeTags(selector: string): void {
  document.head.querySelectorAll(selector).forEach((el) => el.remove());
}

/** Apply a route's meta to the live document. Used after hydration and on client navigation. */
export function applyRouteMeta(meta: RouteMeta): void {
  const site = getSiteConfig();
  document.title = meta.title;
  setNamedMeta("description", meta.description);
  setNamedMeta("robots", meta.robots);

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (meta.canonical) {
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", meta.canonical);
    setPropertyMeta("og:url", meta.canonical);
  } else {
    canonical?.remove();
    removeTags('meta[property="og:url"]');
  }

  setPropertyMeta("og:type", meta.ogType);
  setPropertyMeta("og:title", meta.title);
  setPropertyMeta("og:description", meta.description);
  setPropertyMeta("og:site_name", site.name);
  setNamedMeta("twitter:card", meta.image ? "summary_large_image" : "summary");
  setNamedMeta("twitter:title", meta.title);
  setNamedMeta("twitter:description", meta.description);
  if (meta.image) {
    setPropertyMeta("og:image", meta.image);
    setNamedMeta("twitter:image", meta.image);
  } else {
    removeTags('meta[property="og:image"], meta[name="twitter:image"]');
  }

  let schema = document.head.querySelector<HTMLScriptElement>("script#route-schema");
  if (!schema) {
    schema = document.createElement("script");
    schema.type = "application/ld+json";
    schema.id = "route-schema";
    document.head.appendChild(schema);
  }
  schema.textContent = serializeJsonLd(meta.jsonLd);
}
