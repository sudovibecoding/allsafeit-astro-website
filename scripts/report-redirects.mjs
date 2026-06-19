// One-shot reporter — categorizes the legacy redirects map for the
// migration summary. Safe to delete after the launch report is written.
import { LEGACY_REDIRECTS } from '../src/data/redirects.ts';

const r = LEGACY_REDIRECTS;
const cat = {
  'WP media → Webflow CDN':            0,
  'WP legacy paths → /':               0,
  'Stripe/Oxy builder leftovers → /':  0,
  'Industry detail → /industries':     0,
  'Testimonial detail → /testimonials':0,
  'Service tree restructure':          0,
  'Locations restructure':             0,
  'Blog renames/removals':             0,
  'Phoenix/Chandler not served':       0,
  'Other slug renames':                0,
};
const ext = (v) => v.startsWith('http');
for (const [src, tgt] of Object.entries(r)) {
  if (src.startsWith('/wp-content/uploads/') && ext(tgt)) cat['WP media → Webflow CDN']++;
  else if (src.startsWith('/wp-')) cat['WP legacy paths → /']++;
  else if (src.includes('oxy_user_library') || src.startsWith('/blog/service-block') || src.startsWith('/blog/industries-') || src.startsWith('/blog/related-article') || src.startsWith('/blog/call-to-action-bk') || src.startsWith('/blog/blog-sec-bk') || src.startsWith('/blog/relative-blogs-sec') || src.startsWith('/blog/it-service-bk') || src.startsWith('/blog/service-bullet') || src === '/service-cta' || src === '/widget') cat['Stripe/Oxy builder leftovers → /']++;
  else if (src.startsWith('/industries/')) cat['Industry detail → /industries']++;
  else if (src.startsWith('/testimonials/')) cat['Testimonial detail → /testimonials']++;
  else if (tgt.startsWith('/services/')) cat['Service tree restructure']++;
  else if (tgt.startsWith('/locations/') || src.startsWith('/locations/')) cat['Locations restructure']++;
  else if (src.startsWith('/blog/') || tgt.startsWith('/blog')) cat['Blog renames/removals']++;
  else if (src.includes('phoenix') || src.includes('chandler')) cat['Phoenix/Chandler not served']++;
  else cat['Other slug renames']++;
}

console.log('Category breakdown:');
console.log('─'.repeat(55));
for (const [k, v] of Object.entries(cat)) {
  console.log(k.padEnd(48), String(v).padStart(4));
}
console.log('─'.repeat(55));
const total = Object.values(cat).reduce((a, b) => a + b, 0);
console.log('Total'.padEnd(48), String(total).padStart(4));

// Status-code distribution: how many are internal vs external destinations.
let internal = 0, external = 0;
for (const tgt of Object.values(r)) {
  if (ext(tgt)) external++;
  else internal++;
}
console.log('');
console.log('Destination type:');
console.log('  Internal (same site):', internal);
console.log('  External (other URL):', external);
