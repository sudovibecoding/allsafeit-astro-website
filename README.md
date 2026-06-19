# allsafeit-astro-website

Source for [allsafeit.com](https://allsafeit.com). Astro + TinaCMS + Cloudflare Pages.

Migration from Webflow — see vault project [allsafeit-website-migration](https://github.com/boneslax/vault/blob/main/projects/marketing/allsafeit-website-migration/allsafeit-website-migration.md) for phased plan.

## Stack

- **Framework:** [Astro](https://astro.build) 6 (TypeScript strict, static output)
- **Styling:** [Tailwind CSS](https://tailwindcss.com) 4 (via `@tailwindcss/vite`)
- **Content:** MDX + Astro content collections, edited via [TinaCMS](https://tina.io) Cloud
- **Hosting:** [Cloudflare Pages](https://pages.cloudflare.com) (production: `allsafeit.com`, previews: `<branch>.allsafeit-astro-website.pages.dev`)
- **Forms:** ActiveCampaign + usebasin (replicating Webflow setup)
- **Analytics:** GTM container `GTM-*****` → GA4

## Local dev

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # static output to ./dist
npm run preview      # serve built site
```

Node 22.12+ required.

## Project structure

```
src/
  content/
    pages/           # static pages (Home, About, Contact...)
    services/        # service pages (IT Support, Cybersecurity, Cloud...)
    locations/       # local-SEO city pages (LA, Pasadena, OC)
    blog/            # MDX blog posts
    case-studies/    # client case studies
    testimonials/    # testimonial entries
  layouts/           # shared layouts (Layout.astro is the base)
  components/        # reusable Astro components
  pages/             # route-emitting pages
  styles/            # global CSS (Tailwind entry)
```

Content collections are schema-validated via `src/content.config.ts`. Edit field shapes there before adding new frontmatter keys to content files.

## Deployment

- Push to `main` → Cloudflare Pages production deploy → `allsafeit.com`
- Push to any other branch → Cloudflare Pages preview deploy → unique URL per branch
- DNS bind for production happens at cutover (Phase 7 of migration plan)

## TinaCMS

Editor UI configured under `tina/` (added in a follow-up commit). TinaCloud-backed auth — credentials in 1Password.

## Contributors

- [@bonesasit](https://github.com/bonesasit) — owner
- [@Giddytwg](https://github.com/Giddytwg) (Tope Gideon Oyenpemi) — frontend / Webflow → Astro port
- Nadeem Nazar — SEO (redirect map, schema, GSC) — invited separately
- Raquel Redulla — content editor (TinaCMS) — invited separately

## License

Proprietary — AllSafeIT internal.
