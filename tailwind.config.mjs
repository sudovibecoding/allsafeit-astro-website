// Tailwind CSS v4 compat config — loaded via @config in global.css.
// All color/size values reference CSS custom properties from :root so
// that a single source of truth (global.css) drives both raw CSS and
// Tailwind utilities. Never override base theme keys — extend only.

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'brand-primary':  'var(--color-brand-primary)',
        'brand-dark':     'var(--color-brand-dark)',
        'accent':         'var(--color-accent)',
        'light-1':        'var(--color-light-1)',
        'light-2':        'var(--color-light-2)',
        'light-1-faded':  'var(--color-light-1-faded)',
        'dark-faded':     'var(--color-dark-faded)',
        'dark-border':    'var(--color-dark-border)',
        'navbar-bg':      'var(--color-navbar-bg)',
        'text-dark':      'var(--color-text-dark)',
        'text-dark-body': 'var(--color-text-dark-body)',
        'text-light':     'var(--color-text-light)',
        'icon-green':     'var(--color-icon-green)',
        'icon-cyan':      'var(--color-icon-cyan)',
        'icon-blue':      'var(--color-icon-blue)',
        'icon-yellow':    'var(--color-icon-yellow)',
      },
      fontFamily: {
        body:    ['"Funnelsans Font"', 'Arial', 'sans-serif'],
        heading: ['"Funnelsans Font"', 'Arial', 'sans-serif'],
        badge:   ['"Geistmono Font"',  'Arial', 'sans-serif'],
      },
      fontSize: {
        'small': ['var(--text-small)', { lineHeight: 'var(--leading-small)' }],
        'lead':  ['var(--text-lead)',  { lineHeight: 'var(--leading-lead)' }],
        'h6':    ['var(--text-h6)',    {}],
        'h5':    ['var(--text-h5)',    { lineHeight: 'var(--leading-h5)' }],
        'h4':    ['var(--text-h4)',    { lineHeight: 'var(--leading-h4)' }],
        'h3':    ['var(--text-h3)',    { lineHeight: 'var(--leading-h3)', letterSpacing: 'var(--tracking-h3)' }],
        'h2':    ['var(--text-h2)',    { lineHeight: 'var(--leading-h2)', letterSpacing: 'var(--tracking-h2)' }],
        'h1':    ['var(--text-h1)',    { lineHeight: 'var(--leading-h1)', letterSpacing: 'var(--tracking-h1)' }],
      },
      spacing: {
        'section-xs':  'var(--spacing-section-xs)',
        'section-sm':  'var(--spacing-section-sm)',
        'section':     'var(--spacing-section-default)',
        'section-lg':  'var(--spacing-section-lg)',
        'gutter':      'var(--container-gutter)',
        'navbar':      'var(--navbar-height)',
        'btn-px':      'var(--btn-px)',
        'btn-px-sm':   'var(--btn-px-sm)',
      },
      maxWidth: {
        'container': 'var(--container-main)',
        '2col':      'var(--container-2col)',
        '3col':      'var(--container-3col)',
        '4col':      'var(--container-4col)',
        '5col':      'var(--container-5col)',
        '6col':      'var(--container-6col)',
        '8col':      'var(--container-8col)',
        '10col':     'var(--container-10col)',
      },
      height: {
        'navbar': 'var(--navbar-height)',
        'btn':    'var(--btn-height)',
        'btn-sm': 'var(--btn-height-sm)',
        'input':  'var(--input-height)',
      },
      borderRadius: {
        'site':    'var(--radius-default)',
        'site-lg': 'var(--radius-large)',
      },
      boxShadow: {
        'dropdown': '0 4px 36px #00000014',
      },
    },
  },
  plugins: [],
};
