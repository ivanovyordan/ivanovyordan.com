export interface Post {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
  body: string;
  image?: string;
}

export interface CourseModule {
  title: string;
  lessons: string[];
}

export interface NavItem {
  label: string;
  path: string;
}

export interface PageContent {
  title: string;
  slug: string;
  sections: PageBlock[];
  // SEO metadata
  seo?: {
    title?: string;
    description?: string;
    ogImage?: string;
    noindex?: boolean;
  };
  // Page visibility (defaults to true if not specified)
  published?: boolean;
}

export type PageBlock =
  | HeroBlock
  | StatementBlock
  | AboutHeroBlock
  | TextBlock
  | HeadingBlock
  | HighlightBoxBlock
  | FeaturesGridBlock
  | CTASectionBlock
  | NewsletterBlock
  | TestimonialBlock
  | ContactInfoBlock
  | GeminiAssistantBlock
  | VideoBlock
  | CourseModulesBlock
  | HeroWithVideoBlock
  | LatestPostsBlock
  | ImageBlock
  | ColumnsBlock
  | SidebarBlock
  | AccordionBlock
  | BookingEmbedBlock;

export interface HeroBlock {
  _block: "hero";
  title: string;
  subtitle?: string;
  badge?: string;
  /** With a picture the hero is the split hero: words left, the picture right. */
  image?: string;
  imageAlt?: string;
  buttonText?: string;
  secondaryText?: string;
  secondaryUrl?: string;
  facts?: Array<{ label: string; value: string }>;
}

export interface StatementBlock {
  _block: "statement";
  label?: string;
  text: string;
  /** The one word the moment turns to ink last. Must appear in text. */
  highlight?: string;
}

export interface AboutHeroBlock {
  _block: "about-hero";
  title: string;
  headshot?: string;
  location?: string;
  expertise?: string;
  currently?: string;
}

export interface TextBlock {
  _block: "text";
  content: string;
}

export interface HeadingBlock {
  _block: "heading";
  text: string;
  level?: number;
}

export interface HighlightBoxBlock {
  _block: "highlight-box";
  title: string;
  content: string;
}

export interface FeaturesGridBlock {
  _block: "features-grid";
  title: string;
  items: Array<{
    title: string;
    description: string;
  }>;
}

export interface CTASectionBlock {
  _block: "cta-section";
  title: string;
  description?: string;
  /** Optional bullets rendered between the description and the button. */
  items?: string[];
  buttonText: string;
  /** Defaults to site.discoveryCallPage, then site.discoveryCallUrl. */
  buttonUrl?: string;
  /** Quieter text link under the main button. */
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
  pricing?: {
    label: string;
    price: string;
  };
  image?: string;
  imageAlt?: string;
  /** Turns the title into a statement that fills with ink word by word; this word takes the accent. */
  highlight?: string;
  /** A testimonial beside the words, in place of an image. */
  quote?: string;
  quoteAuthor?: string;
  quoteLinkText?: string;
  quoteLinkUrl?: string;
}

export interface NewsletterBlock {
  _block: "newsletter";
  title: string;
  description: string;
  /** The testimonial that closes the section on the home page. */
  quote?: string;
  quoteAuthor?: string;
}

export interface TestimonialBlock {
  _block: "testimonial";
  heading?: string;
  quote: string;
  author: string;
}

export interface ContactInfoBlock {
  _block: "contact-info";
  email: string;
  social?: Array<{
    label: string;
    url: string;
  }>;
  officeHours?: {
    description?: string;
    buttonText?: string;
    url?: string;
  };
}

export interface GeminiAssistantBlock {
  _block: "gemini-assistant";
  label?: string; // Optional, for CMS display only
}

export interface VideoBlock {
  _block: "video";
  videoId: string;
  title?: string;
  buttonText?: string;
  duration?: string;
  badge?: {
    value: string;
    label: string;
  };
}

export interface CourseModulesBlock {
  _block: "course-modules";
  title?: string;
  modules?: CourseModule[];
}

export interface HeroWithVideoBlock {
  _block: "hero-with-video";
  badge?: string;
  title: string;
  subtitle?: string;
  video: {
    videoId: string;
    title?: string;
    buttonText?: string;
    duration?: string;
    badge?: {
      value: string;
      label: string;
    };
  };
  buttons?: Array<{
    text: string;
    style: "primary" | "secondary";
  }>;
}

export interface LatestPostsBlock {
  _block: "latest-posts";
  title?: string;
  limit?: number;
  showViewAll?: boolean;
}

export interface ImageBlock {
  _block: "image";
  src: string;
  alt?: string;
  caption?: string;
  width?: "narrow" | "medium" | "full";
  fullWidth?: boolean;
  rounded?: boolean;
  shadow?: boolean;
}

export interface ColumnsBlock {
  _block: "columns";
  columns: 2 | 3;
  gap?: "sm" | "md" | "lg";
  items: PageBlock[];
}

export interface SidebarBlock {
  _block: "sidebar";
  sidebar: PageBlock; // Typically about-hero, but can be any block
  content: PageBlock[]; // Content blocks for the main column
}

export interface AccordionItem {
  question: string;
  answer: string; // HTML content
}

export interface AccordionBlock {
  _block: "accordion";
  title?: string;
  items: AccordionItem[];
  defaultOpen?: number; // Index of item to open by default (optional)
}

export interface BookingEmbedBlock {
  _block: "booking-embed";
  /** TidyCal booking path, e.g. "ivanovyordan/discovery-call". */
  path: string;
  /** Section id so /coaching#book lands here. Defaults to "book". */
  id?: string;
  title?: string;
  description?: string;
}

export interface HeaderConfig {
  branding: {
    text: string;
    suffix: string;
    link: string;
  };
}

export interface FooterConfig {
  copyright: {
    name: string;
    tagline?: string;
  };
  social?: Array<{
    label: string;
    url: string;
    platform?: string;
  }>;
}

export interface SiteConfig {
  name: string;
  tagline?: string;
  description?: string;
  siteUrl?: string;
  email?: string;
  /** Where booking lives (every call type). */
  bookingUrl?: string;
  /** The external discovery-call page: the twin, llms.txt and the fallback link under the embedded calendar. */
  discoveryCallUrl?: string;
  /** Where on-site "book a discovery call" buttons go, e.g. "/coaching#book". */
  discoveryCallPage?: string;
  /** The flagship 6-call package booking page. */
  flagshipUrl?: string;
  /** The newsletter the Substack embed signs people up to. */
  newsletter?: {
    name: string;
    url: string;
  };
  social?: Array<{
    label: string;
    url: string;
    platform?: string;
  }>;
  analytics?: {
    googleAnalyticsId?: string;
    facebookPixelId?: string;
  };
  errorTracking?: {
    sentryDsn?: string;
    environment?: string;
  };
  /** Optional overrides. Defaults derive from name, tagline and description. */
  seo?: {
    defaultTitle?: string;
    defaultDescription?: string;
  };
  blog: {
    title: string;
    description: string;
    initialPosts: number;
    postsPerLoad: number;
  };
}
