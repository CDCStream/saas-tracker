import { google } from "googleapis";

type JWT = InstanceType<typeof google.auth.JWT>;
let cachedAuth: JWT | null = null;

/**
 * Decodes the base64 service-account JSON from env and returns a
 * googleapis-compatible auth client. Cached per Lambda invocation.
 *
 * Scopes: GA4 Data API + Search Console.
 */
export function googleAuthClient(): JWT {
  if (cachedAuth) return cachedAuth;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const keyB64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64;
  if (!email || !keyB64) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_KEY_B64 missing — set both in Vercel env."
    );
  }

  const decoded = Buffer.from(keyB64, "base64").toString("utf8");
  const parsed = JSON.parse(decoded) as {
    private_key: string;
    client_email: string;
  };

  const auth = new google.auth.JWT({
    email: parsed.client_email,
    key: parsed.private_key,
    scopes: [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/webmasters.readonly",
    ],
  });

  cachedAuth = auth;
  return auth;
}
