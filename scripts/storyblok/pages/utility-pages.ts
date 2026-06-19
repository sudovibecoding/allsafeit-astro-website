import { customHtml, heroCentered, pageStory } from '../page-helpers';

const UTILITY_HTML = {
  'thank-you': {
    name: 'Thank You',
    title: 'Thank You | AllSafe IT',
    description: "Thank you for getting in touch with AllSafe IT. We've received your request.",
    html: `<section class="thankyou-section"><div class="container"><div class="thankyou-wrap">
<h1 class="h2 color__white-shade1">Thank you!</h1>
<p class="lead-text color__white-shade1">We've received your message and will be in touch within one business day. For urgent matters, call us directly:</p>
<a href="tel:+18884002748" class="phone-link">(888) 400-2748</a>
<div class="thankyou-actions">
<a href="/" class="button small">Back to Home</a>
<a href="/contact-us" class="button small ghost">Contact us</a>
</div></div></div></section>`,
  },
  unsubscribed: {
    name: 'Unsubscribed',
    title: 'Unsubscribed | AllSafe IT',
    description: "You've successfully unsubscribed from AllSafe IT communications.",
    html: `<section class="utility-section"><div class="container"><div class="utility-wrap">
<h1 class="h2 color__white-shade1">We're sorry to see you go!</h1>
<p class="lead-text color__white-shade1">We have removed your email address from our list.</p>
<div class="utility-actions">
<a href="/contact-us" class="button small">Contact us</a>
<a href="/" class="button small ghost">Back to Home</a>
</div></div></div></section>`,
  },
  'form-not-received': {
    name: 'Form Not Received',
    title: 'Form Not Received | AllSafe IT',
    description: 'There was an issue receiving your form submission.',
    html: `<section class="utility-section"><div class="container"><div class="utility-wrap">
<h1 class="h2 color__white-shade1">We didn't receive your form</h1>
<p class="lead-text color__white-shade1">Something went wrong with your submission. Please try again or call us directly.</p>
<a href="tel:+18884002748" class="phone-link">(888) 400-2748</a>
<div class="utility-actions">
<a href="/contact-us" class="button small">Try again</a>
<a href="/" class="button small ghost">Back to Home</a>
</div></div></div></section>`,
  },
} as const;

export const utilityPages = Object.entries(UTILITY_HTML).map(([slug, config]) => ({
  slug,
  name: config.name,
  content: pageStory(
    {
      meta_title: config.title,
      meta_description: config.description,
      canonical: `https://www.allsafeit.com/${slug}`,
      indexable: false,
    },
    [customHtml(config.html)],
  ),
}));

export const functionalPages = [
  {
    slug: 'customer-referral-program',
    name: 'Customer Referral Program',
    content: pageStory(
      {
        meta_title: 'Customer Referral Program | AllSafe IT',
        meta_description: 'Refer a business to AllSafe IT and earn rewards.',
        canonical: 'https://www.allsafeit.com/customer-referral-program',
      },
      [
        heroCentered('[Referral program]', 'Refer a business. Earn rewards.'),
        customHtml(
          '<section class="section"><div class="container"><p class="lead-text">Know a business that could benefit from AllSafe IT? Refer them and receive a thank-you reward when they become a client.</p><p class="lead-text"><a href="/contact-us" class="button small">Refer someone today</a></p></div></section>',
        ),
      ],
    ),
  },
];
