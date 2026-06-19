// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnv } from 'vite';
import { storyblok } from '@storyblok/astro';
import { storyblokComponents } from './src/storyblok/register.ts';

import cloudflare from "@astrojs/cloudflare";

const storyblokEnv = loadEnv('', process.cwd(), 'STORYBLOK');

const sslCertPath = resolve('./localhost.pem');
const sslKeyPath = resolve('./localhost-key.pem');
const hasLocalSsl = existsSync(sslCertPath) && existsSync(sslKeyPath);

// https://astro.build/config
export default defineConfig({
  output: 'server',
  site: process.env.SITE_URL || `https://${process.env.VERCEL_URL || 'www.allsafeit.com'}`,
  redirects: {},
  integrations: [
    mdx(),
    sitemap(),
    react(),
    ...(storyblokEnv.STORYBLOK_TOKEN
      ? [
          storyblok({
            accessToken: storyblokEnv.STORYBLOK_TOKEN,
            bridge: true,
            livePreview: true,
            apiOptions: { region: 'eu' },
            components: storyblokComponents,
          }),
        ]
      : []),
  ],

  vite: {
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    plugins: [tailwindcss()],
    server: hasLocalSsl
      ? {
          https: {
            key: readFileSync(sslKeyPath),
            cert: readFileSync(sslCertPath),
          },
        }
      : undefined,
  },

  adapter: cloudflare()
});
