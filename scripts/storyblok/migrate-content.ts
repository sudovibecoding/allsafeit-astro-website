#!/usr/bin/env tsx
/**
 * Migrate Tina/Astro content collections → Storyblok stories.
 * Industries, service details, blog posts, blog categories, authors.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { blok, bodyField, faqItems, headingText, introField, richtextField } from './blok-utils';
import { parseMdxFile } from './mdx-html';
import { upsertStory } from './api';

const ROOT = resolve(import.meta.dirname, '../..');
const CONTENT = join(ROOT, 'src/content');

function pageStory(
  meta: {
    meta_title: string;
    meta_description: string;
    canonical: string;
    schema_json?: string;
    nav_heading?: string;
    project_number?: number;
    publish_date?: string;
    blog_category?: string;
    service_category?: string;
  },
  body: ReturnType<typeof blok>[],
) {
  const previewPath = meta.canonical ? new URL(meta.canonical).pathname : undefined;
  return {
    component: 'page',
    meta_title: meta.meta_title,
    meta_description: meta.meta_description,
    canonical: meta.canonical,
    ...(previewPath ? { preview_path: previewPath } : {}),
    indexable: true,
    ...(meta.schema_json ? { schema_json: meta.schema_json } : {}),
    ...(meta.nav_heading ? { nav_heading: meta.nav_heading } : {}),
    ...(meta.project_number != null ? { project_number: String(meta.project_number) } : {}),
    ...(meta.publish_date ? { publish_date: meta.publish_date } : {}),
    ...(meta.blog_category ? { blog_category: meta.blog_category } : {}),
    ...(meta.service_category ? { service_category: meta.service_category } : {}),
    body,
  };
}

function walkMdx(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkMdx(p));
    else if (name.endsWith('.mdx')) out.push(p);
  }
  return out;
}

function heroIndustry(
  title: string,
  lead: string,
  image: string,
  imageAlt: string,
) {
  return blok('hero_industry', {
    title,
    lead,
    image_path: image,
    image_alt: imageAlt,
  });
}

function heroServiceDetail(
  heading: string,
  lead: string,
  image: string,
  imageAlt: string,
) {
  return blok('hero_service_detail', {
    badge: '[IT Services]',
    heading: headingText(heading),
    ...introField(lead),
    image_path: image,
    image_alt: imageAlt,
  });
}

function serviceDetailIntro(category: string, title: string, overview: string) {
  return blok('service_detail_intro', {
    service_category: category,
    title,
    ...richtextField('overview', overview),
  });
}

function articleWithSidebar(bodyHtml: string) {
  return blok('article_with_sidebar', bodyField(bodyHtml));
}

function heroBlogPost(opts: {
  title: string;
  lead: string;
  image: string;
  imageAlt: string;
  category: string;
  publishDate: string;
  bodyHtml: string;
}) {
  return blok('hero_blog_post', {
    title: opts.title,
    lead: opts.lead,
    image_path: opts.image,
    image_alt: opts.imageAlt,
    category: opts.category,
    publish_date: opts.publishDate,
    ...bodyField(opts.bodyHtml),
  });
}

function contactSection(body?: string) {
  return blok('contact_section', {
    heading: headingText('Ready to transform your IT? Contact us today!'),
    ...(body ? bodyField(body) : {}),
  });
}

const DEFAULT_CTA = `Ready to transform your IT experience? Reach out to our experts to discuss how our tailored solutions can meet your business needs and keep your technology running smoothly.`;

// ── Industries ──────────────────────────────────────────────────────
console.log('\nMigrating industry detail pages…');
const industryDir = join(CONTENT, 'industries');
for (const file of walkMdx(industryDir)) {
  const slug = file.replace(`${industryDir}/`, '').replace(/\.mdx$/, '');
  const { frontmatter: fm, bodyHtml } = parseMdxFile(file);
  if (fm.status === 'draft' || fm.status === 'archived') continue;

  const name = String(fm.name ?? slug);
  const heroLead =
    String(fm.subHeading ?? fm.shortDescriptionForCards ?? `IT services tailored to the ${name} industry.`);
  const canonical = `https://www.allsafeit.com/industries/${slug}`;

  await upsertStory(
    `industries/${slug}`,
    name,
    pageStory(
      {
        meta_title: String(fm.metaTitle ?? `${name} IT Services | AllSafe IT`),
        meta_description: String(fm.metaDescription ?? `${name} — ${heroLead.slice(0, 140)}`),
        canonical,
        nav_heading: String(fm.navHeading ?? name),
        project_number: typeof fm.projectNumber === 'number' ? fm.projectNumber : undefined,
      },
      [
        heroIndustry(name, heroLead, String(fm.featuredImage ?? ''), String(fm.featuredImageAlt ?? '')),
        articleWithSidebar(bodyHtml),
        contactSection(String(fm.buttonLabelText ?? DEFAULT_CTA)),
      ],
    ),
    `industries/${slug}`,
  );
}

// ── Service details ─────────────────────────────────────────────────
console.log('\nMigrating service detail pages…');
const servicesDir = join(CONTENT, 'services');
for (const file of walkMdx(servicesDir)) {
  const rel = file.replace(`${servicesDir}/`, '').replace(/\.mdx$/, '');
  const [category, ...rest] = rel.split('/');
  const slug = rest.join('/');
  const { frontmatter: fm, bodyHtml } = parseMdxFile(file);
  if (fm.status === 'draft' || fm.status === 'archived') continue;

  const name = String(fm.name ?? slug);
  const storyPath = `services/${category}/${slug}`;
  const canonical = `https://www.allsafeit.com/${storyPath}`;

  const body = [
    heroServiceDetail(name, String(fm.subHeading ?? ''), String(fm.featuredImage ?? ''), String(fm.featuredImageAlt ?? '')),
    serviceDetailIntro(category, name, String(fm.overviewOfContent ?? '')),
    articleWithSidebar(bodyHtml),
  ];

  const faqs = fm.faqs as Array<{ q: string; a: string }> | undefined;
  if (faqs?.length) {
    body.push(
      blok('faq_section', {
        heading: headingText('Frequently Asked Questions'),
        items: faqItems(faqs),
      }),
    );
  }

  body.push(contactSection(String(fm.linkDescriptionText ?? DEFAULT_CTA)));

  await upsertStory(
    storyPath,
    name,
    pageStory(
      {
        meta_title: String(fm.metaTitle ?? `${name} | AllSafe IT`),
        meta_description: String(fm.metaDescription ?? `${name} — ${String(fm.subHeading ?? '').slice(0, 140)}`),
        canonical,
        nav_heading: String(fm.navHeading ?? name),
        project_number: typeof fm.projectNumber === 'number' ? fm.projectNumber : undefined,
        service_category: category,
      },
      body,
    ),
    storyPath,
  );
}

// ── Blog posts ──────────────────────────────────────────────────────
console.log('\nMigrating blog posts…');
const blogDir = join(CONTENT, 'blog');
let blogCount = 0;
for (const file of walkMdx(blogDir)) {
  const slug = file.replace(`${blogDir}/`, '').replace(/\.mdx$/, '');
  const { frontmatter: fm, bodyHtml } = parseMdxFile(file);
  if (fm.status === 'draft' || fm.status === 'archived') continue;

  const name = String(fm.name ?? slug);
  const pubDate = fm.firstPublishedDate ? new Date(String(fm.firstPublishedDate)) : new Date();
  const storyPath = `blog/${slug}`;
  const canonical = `https://www.allsafeit.com/${storyPath}`;

  await upsertStory(
    storyPath,
    name,
    pageStory(
      {
        meta_title: String(fm.metaTitleForBlogs ?? `${name} | AllSafe IT Blog`),
        meta_description: String(
          fm.metaDescriptionForBlogs ?? String(fm.introductionParagraph ?? name).slice(0, 160),
        ),
        canonical,
        publish_date: pubDate.toISOString(),
        blog_category: fm.category ? String(fm.category) : undefined,
      },
      [
        heroBlogPost({
          title: name,
          lead: String(fm.introductionParagraph ?? ''),
          image: String(fm.mainImage ?? ''),
          imageAlt: String(fm.mainImageAlt ?? name),
          category: String(fm.category ?? ''),
          publishDate: pubDate.toISOString(),
          bodyHtml,
        }),
        blok('related_posts', { count: '3' }),
        contactSection(),
      ],
    ),
    storyPath,
  );
  blogCount++;
}
console.log(`  ${blogCount} blog posts`);

// ── Blog index ──────────────────────────────────────────────────────
console.log('\nMigrating blog index…');
await upsertStory(
  'blog',
  'Blog',
  pageStory(
    {
      meta_title: 'Stay Informed with AllSafe IT Blog | Technology Insights',
      meta_description:
        'Explore the latest in technology trends, insights, and updates on the AllSafe IT Blog.',
      canonical: 'https://www.allsafeit.com/blog',
    },
    [blok('blog_listing', {}), contactSection()],
  ),
  'blog',
);

// ── Blog categories ─────────────────────────────────────────────────
console.log('\nMigrating blog categories…');
const catDir = join(CONTENT, 'blog-category');
for (const file of readdirSync(catDir).filter((f) => f.endsWith('.json'))) {
  const slug = file.replace(/\.json$/, '');
  const raw = JSON.parse(readFileSync(join(catDir, file), 'utf8')) as Record<string, unknown>;
  if (raw.status === 'draft' || raw.status === 'archived') continue;

  const name = String(raw.name ?? slug);
  const storyPath = `blog-categories/${slug}`;
  await upsertStory(
    storyPath,
    name,
    pageStory(
      {
        meta_title: String(raw.seoTitle ?? `${name} | AllSafe IT Blog`),
        meta_description: String(raw.seoDescription ?? `${name} articles from AllSafe IT.`),
        canonical: `https://www.allsafeit.com/${storyPath}`,
        blog_category: slug,
      },
      [blok('blog_category_listing', { category_slug: slug }), contactSection()],
    ),
    storyPath,
  );
}

// ── Authors ─────────────────────────────────────────────────────────
console.log('\nMigrating authors…');
const authorDir = join(CONTENT, 'author');
for (const file of readdirSync(authorDir).filter((f) => f.endsWith('.md'))) {
  const slug = file.replace(/\.md$/, '');
  const { frontmatter: fm, bodyHtml } = parseMdxFile(join(authorDir, file));
  if (fm.status === 'draft' || fm.status === 'archived') continue;

  const name = String(fm.name ?? slug);
  const storyPath = `author/${slug}`;
  await upsertStory(
    storyPath,
    name,
    pageStory(
      {
        meta_title: String(fm.metaTitle ?? `${name} | AllSafe IT`),
        meta_description: String(fm.metaDescription ?? `Articles by ${name} on the AllSafe IT blog.`),
        canonical: `https://www.allsafeit.com/${storyPath}`,
      },
      [
        blok('author_profile', {
          name,
          position: String(fm.position ?? ''),
          picture_path: String(fm.picture ?? ''),
          ...richtextField('bio', bodyHtml),
        }),
        contactSection(),
      ],
    ),
    storyPath,
  );
}

console.log('\nContent migration complete.');
