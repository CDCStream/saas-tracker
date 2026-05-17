import { google } from "googleapis";

type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

let cached: OAuth2Client | null = null;

/**
 * OAuth2 user-credential auth, not Service Account. Lets the dashboard
 * read GA4 + GSC under the *owner's* Gmail account (which is already
 * an admin on the property/site) without burning a GCP project slot
 * on a Service Account.
 *
 * One-time setup: see scripts/get-refresh-token.mjs to mint the
 * refresh token. Then drop these three values into Vercel:
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GOOGLE_OAUTH_REFRESH_TOKEN
 *
 * The googleapis SDK swaps the refresh token for a short-lived access
 * token on every request and caches it in-process — no Lambda-edge
 * latency hit beyond the first call per cold start.
 */
export function googleAuthClient(): OAuth2Client {
  if (cached) return cached;

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and " +
        "GOOGLE_OAUTH_REFRESH_TOKEN must all be set in Vercel env. " +
        "Run `node scripts/get-refresh-token.mjs` to mint a refresh token."
    );
  }

  const client = new google.auth.OAuth2(clientId, clientSecret);
  client.setCredentials({ refresh_token: refreshToken });
  cached = client;
  return client;
}
