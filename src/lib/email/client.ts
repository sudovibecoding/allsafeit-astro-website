/**
 * Resend SDK singleton.
 *
 * Initialized lazily on first use, memoized by API key. Cloudflare
 * Workers keep module scope between requests within an isolate, so a
 * typical Worker constructs one Resend client per cold start.
 *
 * If you ever rotate the API key, the next request constructs a fresh
 * instance automatically (we key the cache on the key itself).
 */
import { Resend } from 'resend';

let _instance: Resend | undefined;
let _instanceKey: string | undefined;

/**
 * Get (or lazily create) the Resend client for the given API key.
 *
 * Don't pass an unverified key — let `loadEmailConfig()` validate
 * first. The Resend constructor itself doesn't throw on a bad key;
 * it throws later, on `.emails.send()`.
 */
export function getResendClient(apiKey: string): Resend {
  if (_instance && _instanceKey === apiKey) {
    return _instance;
  }
  _instance = new Resend(apiKey);
  _instanceKey = apiKey;
  return _instance;
}

/** For tests — drop the cached instance. */
export function _resetResendClientForTests(): void {
  _instance = undefined;
  _instanceKey = undefined;
}
