# Email service — usage examples

The actual production caller is `src/pages/api/contact.ts`. This file
is a reference for how to use the service in other contexts (new API
routes, Astro Actions, scheduled jobs, etc.).

---

## 1. In an Astro API route (the pattern we use today)

```ts
// src/pages/api/some-other-form.ts
import type { APIContext } from 'astro';
import {
  loadEmailConfig,
  mergeEnvSources,
  sendContactFormEmail,
} from '../../lib/email';

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  // 1. Read env from BOTH Cloudflare runtime AND import.meta.env
  //    (so the same code works under `astro dev` and on the Worker).
  const cfEnv = (context.locals as any).runtime?.env;
  const config = loadEmailConfig(
    mergeEnvSources(import.meta.env as Record<string, unknown>, cfEnv),
  );

  // 2. Parse + validate the form data (your own logic).
  const form = await context.request.formData();

  // 3. Send. Never throws — always returns a Result.
  const result = await sendContactFormEmail(config, {
    to: 'leads@yourdomain.com',
    data: {
      firstName: String(form.get('firstName') ?? ''),
      lastName: String(form.get('lastName') ?? ''),
      email: String(form.get('email') ?? ''),
      phone: String(form.get('phone') ?? ''),
      company: String(form.get('company') ?? ''),
      services: form.getAll('services').map(String),
      sourceUrl: String(form.get('source_url') ?? ''),
      submissionId: crypto.randomUUID(),
    },
  });

  // 4. Branch on the Result. Logs include the Resend message ID on
  //    success and a stable error code on failure.
  if (!result.ok) {
    console.error('email_failed', result.code, result.message);
    return new Response(
      JSON.stringify({ ok: false, error: 'email_failed' }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({ ok: true, messageId: result.id }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}
```

---

## 2. In an Astro Action (Astro 5 native form pattern)

```ts
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import {
  loadEmailConfig,
  mergeEnvSources,
  sendContactFormEmail,
} from '../lib/email';

export const server = {
  submitContactForm: defineAction({
    accept: 'form',
    input: z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
      company: z.string().optional(),
      services: z.array(z.string()).optional().default([]),
      sourceUrl: z.string().url().optional().default(''),
    }),
    handler: async (input, context) => {
      const cfEnv = (context.locals as any).runtime?.env;
      const config = loadEmailConfig(
        mergeEnvSources(import.meta.env as Record<string, unknown>, cfEnv),
      );

      const result = await sendContactFormEmail(config, {
        to: 'leads@yourdomain.com',
        data: { ...input, submissionId: crypto.randomUUID() },
      });

      if (!result.ok) {
        throw new Error(`email_failed: ${result.code} — ${result.message}`);
      }
      return { messageId: result.id };
    },
  }),
};
```

```astro
---
// src/pages/contact.astro
import { actions } from 'astro:actions';
---

<form method="POST" action={actions.submitContactForm}>
  <input name="firstName" required />
  <input name="lastName" required />
  <input name="email" type="email" required />
  <input name="phone" required />
  <input name="company" />
  <button type="submit">Send</button>
</form>
```

---

## 3. Ad-hoc transactional notification (no template needed)

```ts
import {
  loadEmailConfig,
  mergeEnvSources,
  sendNotificationEmail,
} from '../lib/email';

const config = loadEmailConfig(
  mergeEnvSources(import.meta.env as Record<string, unknown>, cfEnv),
);

await sendNotificationEmail(config, {
  to: 'ops@yourdomain.com',
  subject: 'Build deployment succeeded',
  body: 'Production deploy of commit abc1234 finished in 87s.\nNo errors.',
});
```

---

## 4. Low-level `sendEmail` (for fully custom rendering)

```ts
import { loadEmailConfig, mergeEnvSources, sendEmail } from '../lib/email';

const config = loadEmailConfig(
  mergeEnvSources(import.meta.env as Record<string, unknown>, cfEnv),
);

await sendEmail(config, {
  to: 'user@example.com',
  subject: 'Welcome to AllSafe IT',
  html: '<h1>Welcome</h1><p>Thanks for signing up.</p>',
  text: 'Welcome\n\nThanks for signing up.',
  tags: [{ name: 'category', value: 'onboarding' }],
});
```

---

## Adding a new email type (recommended pattern)

Every domain email type should follow the same shape:

### Step 1 — Add a template

`src/lib/email/templates.ts`:

```ts
export interface PasswordResetData {
  userEmail: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export const passwordResetTemplate: EmailTemplate<PasswordResetData> = (data) => {
  const subject = 'Reset your AllSafe IT password';
  const html = shell(subject, `
    <h1 style="margin:0 0 16px;font-size:20px;">Password reset</h1>
    <p>Click the link below to reset your password. Expires in ${data.expiresInMinutes} minutes.</p>
    <p><a href="${esc(data.resetUrl)}">Reset password</a></p>
  `);
  const text = `Reset your password: ${data.resetUrl} (expires in ${data.expiresInMinutes} min)`;
  return { subject, html, text };
};
```

### Step 2 — Add a helper in `service.ts`

```ts
import { passwordResetTemplate } from './templates';
import type { PasswordResetData } from './templates';

export async function sendPasswordResetEmail(
  config: EmailConfig,
  input: { to: string } & PasswordResetData,
): Promise<EmailResult> {
  const rendered = passwordResetTemplate(input);
  return sendEmail(config, {
    to: input.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    tags: [
      { name: 'category', value: 'password_reset' },
      { name: 'env', value: config.appEnv },
    ],
  });
}
```

### Step 3 — Export it from `index.ts`

```ts
export { sendPasswordResetEmail } from './service';
```

That's it. Staging override, subject prefixing, and error handling are
inherited from `sendEmail` automatically.

---

## Migrating to React Email later

When the inline-styled HTML gets unwieldy, swap templates one at a time:

```bash
npm install @react-email/components @react-email/render
```

```tsx
// src/lib/email/templates/contactForm.tsx
import { Html, Body, Container, Text } from '@react-email/components';

export function ContactFormEmail({ data }: { data: ContactFormPayload }) {
  return (
    <Html>
      <Body>
        <Container>
          <Text>New contact form from {data.email}</Text>
          {/* ... */}
        </Container>
      </Body>
    </Html>
  );
}
```

```ts
// templates.ts
import { render } from '@react-email/render';
import { ContactFormEmail } from './templates/contactForm';

export const contactFormTemplate: EmailTemplate<ContactFormPayload> = (data) => ({
  subject: `New contact form: ${data.firstName} ${data.lastName}`,
  html: render(<ContactFormEmail data={data} />),
  text: render(<ContactFormEmail data={data} />, { plainText: true }),
});
```

Service layer is unchanged.
