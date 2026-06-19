import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * ─────────────────────────────────────────────────────────────────────
 * Astro content collection schemas — strict Webflow-slug naming
 * ─────────────────────────────────────────────────────────────────────
 *
 * Every field name in this file is the camelCase form of its Webflow
 * collection-field slug (confirmed live via MCP `get_collection_details`).
 *
 * No invented fields. No suffixes. Three documented derivations:
 *   • `status`       — derived from Webflow's system `isDraft` /
 *                      `isArchived` flags. Same on every collection.
 *   • `*ImageAlt`    — extracted from Webflow Image.alt sub-property at
 *                      migration time (Webflow's Image type embeds alt).
 *   • `faqs`         — Webflow exposes 10 flat fields (faq1..faq5 +
 *                      answer1..answer5). The ETL collapses them into a
 *                      structured array `[{q, a}, ...]` for editor sanity.
 *   • `metrics`      — Same pattern as faqs: Webflow's metric-1-number /
 *                      metric-1-explainer-text / metric-2-… collapse to
 *                      `metrics: [{value, explainer}, ...]`.
 *
 * Service collections (4) all share the managed-it superset by design:
 * managed-it is the most complete Webflow collection (14 fields), and we
 * keep editorial parity across categories. cybersecurity / it-consulting /
 * it-infrastructure-and-cloud items will have empty `cta` and/or
 * `linkDescriptionText` values where Webflow doesn't carry them.
 */

const statusSchema = z
  .enum(['published', 'draft', 'archived'])
  .default('published');

const faqsSchema = z
  .array(z.object({ q: z.string(), a: z.string() }))
  .optional();

// ────────────────────────────────────────────────────────────────────────
// Services (× 4 — managed-it superset)
// ────────────────────────────────────────────────────────────────────────
const services = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/services' }),
  schema: z.object({
    name: z.string(),
    status: statusSchema,
    shortDescriptionForCards: z.string().optional(),
    featuredImage: z.string(),
    featuredImageAlt: z.string().optional(),
    subHeading: z.string().optional(),
    /** RichText — rendered HTML/markdown string. */
    overviewOfContent: z.string().optional(),
    faqs: faqsSchema,
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    navHeading: z.string().optional(),
    projectNumber: z.number().optional(),
    cta: z.string().optional(),
    linkDescriptionText: z.string().optional(),
  }),
});

// ────────────────────────────────────────────────────────────────────────
// Industries
// ────────────────────────────────────────────────────────────────────────
const industries = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/industries' }),
  schema: z.object({
    name: z.string(),
    status: statusSchema,
    shortDescriptionForCards: z.string().optional(),
    featuredImage: z.string(),
    featuredImageAlt: z.string().optional(),
    subHeading: z.string().optional(),
    overviewOfContent: z.string().optional(),
    faqs: faqsSchema,
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    navHeading: z.string().optional(),
    projectNumber: z.number().optional(),
    cta: z.string().optional(),
    blueIcon2: z.string().optional(),
    whiteIcon2: z.string().optional(),
    homepageShortDesc: z.string().optional(),
    orangeCounty: z.string().optional(),
    pasadena: z.string().optional(),
    buttonLabelText: z.string().optional(),
  }),
});

// ────────────────────────────────────────────────────────────────────────
// Blog Posts
// ────────────────────────────────────────────────────────────────────────
const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    name: z.string(),
    status: statusSchema,
    mainImage: z.string().optional(),
    mainImageAlt: z.string().optional(),
    thumbnailImage: z.string().optional(),
    introductionParagraph: z.string().optional(),
    /** Reference: slug of an entry in `blogCategory`. */
    category: z.string().optional(),
    /** Reference: slug of an entry in `author`. */
    author: z.string().optional(),
    firstPublishedDate: z.coerce.date(),
    postFeatured: z.boolean().optional().default(false),
    metaTitleForBlogs: z.string().optional(),
    metaDescriptionForBlogs: z.string().optional(),
    faqSchemaJson: z.string().optional(),
  }),
});

// ────────────────────────────────────────────────────────────────────────
// Blog Categories
// ────────────────────────────────────────────────────────────────────────
const blogCategory = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/blog-category' }),
  schema: z.object({
    name: z.string(),
    status: statusSchema,
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

// ────────────────────────────────────────────────────────────────────────
// Authors
// ────────────────────────────────────────────────────────────────────────
const author = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/author' }),
  schema: z.object({
    name: z.string(),
    status: statusSchema,
    position: z.string().optional(),
    picture: z.string().optional(),
    numberOrder: z.number().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  }),
});

// ────────────────────────────────────────────────────────────────────────
// Customers / Case Studies
// ────────────────────────────────────────────────────────────────────────
const customer = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/customer' }),
  schema: z.object({
    name: z.string(),
    status: statusSchema,
    mainImage: z.string().optional(),
    secondaryImage: z.string().optional(),
    customerLogo: z.string().optional(),
    customerAvatar: z.string().optional(),
    caseStudyTitle: z.string().optional(),
    summaryText: z.string().optional(),
    location: z.string().optional(),
    industry: z.string().optional(),
    servicesUsed: z.string().optional(),
    introductionParagraph: z.string().optional(),
    quoteFromCustomer: z.string().optional(),
    quoteAuthor: z.string().optional(),
    quoteAuthorPosition: z.string().optional(),
    metrics: z
      .array(z.object({ value: z.string(), explainer: z.string().optional() }))
      .optional(),
    orderNumber: z.number().optional(),
  }),
});

// ────────────────────────────────────────────────────────────────────────
// Testimonials
// ────────────────────────────────────────────────────────────────────────
const testimonial = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/testimonial' }),
  schema: z.object({
    name: z.string(),
    status: statusSchema,
    subtitle: z.string().optional(),
    photo: z.string().optional(),
    /** Webflow `tetsimonial-new` — typo preserved verbatim. */
    tetsimonialNew: z.string().optional(),
    /** Webflow `testimonial-long` — long-form variant. */
    testimonialLong: z.string().optional(),
    hide: z.boolean().optional().default(false),
    showDarkLogo: z.boolean().optional().default(false),
    showLightLogo: z.boolean().optional().default(false),
    longText: z.boolean().optional().default(false),
    numberOrder: z.number().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  }),
});

// ────────────────────────────────────────────────────────────────────────
// Team Members
// ────────────────────────────────────────────────────────────────────────
const teamMember = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/team-member' }),
  schema: z.object({
    name: z.string(),
    status: statusSchema,
    image: z.string().optional(),
    position: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    orderList: z.number().optional(),
  }),
});

// ────────────────────────────────────────────────────────────────────────
// Job Openings
// ────────────────────────────────────────────────────────────────────────
const jobOpening = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/job-opening' }),
  schema: z.object({
    name: z.string(),
    status: statusSchema,
    careerTitle: z.string().optional(),
    careerLink: z.string().optional(),
    careerIcon: z.string().optional(),
    careerExcerpt: z.string().optional(),
    careerJobApplicationEmail: z.string().optional(),
    careerAbout: z.string().optional(),
    careerResponsibilities: z.string().optional(),
    careerRequirements: z.string().optional(),
  }),
});

// ────────────────────────────────────────────────────────────────────────
// Careers
// ────────────────────────────────────────────────────────────────────────
const career = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/career' }),
  schema: z.object({
    name: z.string(),
    status: statusSchema,
    location: z.string().optional(),
    basis: z.string().optional(),
  }),
});

// ────────────────────────────────────────────────────────────────────────
// Professional IT Services
// ────────────────────────────────────────────────────────────────────────
const professionalService = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/professional-service' }),
  schema: z.object({
    name: z.string(),
    status: statusSchema,
    mainImage: z.string().optional(),
    shortDescription: z.string().optional(),
    heroSectionDescription: z.string().optional(),
    navHeading: z.string().optional(),
    projectNumber: z.number().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  }),
});

// ────────────────────────────────────────────────────────────────────────
// Navigation — site-internal config, not from Webflow.
// ────────────────────────────────────────────────────────────────────────
const navigation = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/navigation' }),
  schema: z.object({
    items: z.array(
      z.object({
        type: z.enum(['auto-services', 'auto-industries', 'group', 'link']),
        label: z.string(),
        href: z.string().optional(),
        links: z
          .array(
            z.object({
              label: z.string(),
              href: z.string(),
              emphasis: z.boolean().optional(),
            }),
          )
          .optional(),
      }),
    ),
    cta: z.object({ label: z.string(), href: z.string() }),
  }),
});

export const collections = {
  services,
  industries,
  blog,
  blogCategory,
  author,
  customer,
  testimonial,
  teamMember,
  jobOpening,
  career,
  professionalService,
  navigation,
};
