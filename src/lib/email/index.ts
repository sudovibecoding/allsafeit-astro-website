/**
 * Public email-service surface.
 *
 * Callers MUST import from this barrel, not from individual files.
 * The internal split (config / client / templates / service) can change
 * without affecting consumers.
 */

// ── Config ──────────────────────────────────────────────────────────
export { loadEmailConfig, mergeEnvSources } from './config';

// ── Send functions ─────────────────────────────────────────────────
export {
  sendEmail,
  sendContactFormEmail,
  sendNotificationEmail,
  sendEbookDownloadEmail,
  sendAssetTagReportEmail,
} from './service';

// ── Types ───────────────────────────────────────────────────────────
export type {
  EmailConfig,
  AppEnv,
  EmailResult,
  EmailSuccess,
  EmailFailure,
  SendEmailInput,
  ContactFormPayload,
  ContactFormEmailInput,
  NotificationEmailInput,
  EbookDownloadPayload,
  EbookDownloadEmailInput,
  AssetTagReportPayload,
  AssetTagReportEmailInput,
  RenderedEmail,
  EmailTemplate,
} from './types';
