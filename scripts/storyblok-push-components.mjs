#!/usr/bin/env node
/**
 * Push AllSafe section bloks to Storyblok (Management API).
 *
 * Requires in .env:
 *   STORYBLOK_MANAGEMENT_TOKEN  — Personal access token with Component scope
 *   STORYBLOK_SPACE_ID          — Space ID (Settings → General)
 *
 * Usage: npm run storyblok:push-components
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const COMPONENTS_PATH = resolve(ROOT, 'storyblok/components.json');
const PRESETS_PATH = resolve(ROOT, 'storyblok/field-presets.json');

function applyFieldPresets(component) {
  const presets = JSON.parse(readFileSync(PRESETS_PATH, 'utf8'));
  if (!component.schema) return component;

  for (const [key, field] of Object.entries(component.schema)) {
    const presetKey = field.preset;
    if (presetKey && presets[presetKey]) {
      component.schema[key] = {
        ...presets[presetKey],
        ...field,
        preset: undefined,
      };
      delete component.schema[key].preset;
    }
  }
  return component;
}

function loadEnvFile() {
  try {
    const raw = readFileSync(resolve(ROOT, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* no .env */
  }
}

loadEnvFile();

const spaceId = process.env.STORYBLOK_SPACE_ID;
const token =
  process.env.STORYBLOK_MANAGEMENT_TOKEN ||
  (process.env.STORYBLOK_TOKEN?.startsWith('sb_pat_') ? process.env.STORYBLOK_TOKEN : null);

if (!token || !spaceId) {
  console.error(
    'Missing Storyblok credentials in .env\n\n' +
      'Required:\n' +
      '  STORYBLOK_SPACE_ID=293167023778841\n' +
      '  STORYBLOK_MANAGEMENT_TOKEN=sb_pat_...  (Personal access token)\n\n' +
      'Optional (for local dev / visual editor):\n' +
      '  STORYBLOK_TOKEN=...  (Space → Settings → Access Tokens → Preview)\n\n' +
      'Note: Preview and Management tokens are different — do not use the same variable for both.\n',
  );
  process.exit(1);
}

const desired = JSON.parse(readFileSync(COMPONENTS_PATH, 'utf8'));
const base = `https://mapi.storyblok.com/v1/spaces/${spaceId}`;

async function api(path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  if (!res.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} → ${res.status}: ${text}`);
  }
  return json;
}

const { components: existing } = await api('/components');
const byName = new Map(existing.map((c) => [c.name, c]));

for (const component of desired) {
  const current = byName.get(component.name);
  const payload = { component: applyFieldPresets(structuredClone(component)) };

  if (current) {
    await api(`/components/${current.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    console.log(`Updated  ${component.name}`);
  } else {
    await api('/components', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    console.log(`Created  ${component.name}`);
  }
}

console.log('\nDone. Open Home in Storyblok → add sections to the body field.');
