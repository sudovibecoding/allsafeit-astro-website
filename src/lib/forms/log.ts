/**
 * Structured logging — every line a single-line JSON object.
 *
 * Cloudflare Workers observability auto-parses JSON logs, so you can
 * filter the dashboard by any field:
 *   - `submissionId:"<uuid>"`           → trace one submission end-to-end
 *   - `event:"webhook_complete" ok:false` → all failed webhook calls
 *   - `event:"recaptcha_verified" ok:false` → captcha rejections (spam signal)
 *   - `level:"error"`                   → all errors site-wide
 *
 * Console levels map to Cloudflare's severity tagging.
 */

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  /** Snake-cased event name — pick from a small vocabulary so dashboards stay scannable. */
  event: string;
  /** Always include for any form-related event so traces are filterable. */
  submissionId?: string;
  /** Arbitrary structured context. */
  [key: string]: unknown;
}

export function log(entry: LogEntry): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    ...entry,
  });

  if (entry.level === 'error') console.error(line);
  else if (entry.level === 'warn') console.warn(line);
  else console.log(line);
}
