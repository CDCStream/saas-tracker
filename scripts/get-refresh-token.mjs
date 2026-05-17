/**
 * One-time helper: mints a Google OAuth refresh token for the
 * dashboard's GA4 + Search Console reads.
 *
 * Why: avoids the GCP project-quota mess that comes with creating a
 * Service Account. The token is bound to whichever Google account you
 * sign in with during the consent flow — pick the account that's
 * already admin on the GA4 property and the GSC site.
 *
 * Usage:
 *   1. Create an OAuth client of type "Desktop app" in any GCP project
 *      you already own:
 *      https://console.cloud.google.com/apis/credentials
 *   2. Enable on that project:
 *        - Google Analytics Data API
 *        - Search Console API
 *   3. Run:
 *        node scripts/get-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>
 *   4. The script opens a browser. Sign in with the *admin* Gmail,
 *      grant the two scopes.
 *   5. Browser redirects to localhost:3210 and the script prints the
 *      refresh token. Copy it.
 *   6. In Vercel set:
 *        GOOGLE_OAUTH_CLIENT_ID
 *        GOOGLE_OAUTH_CLIENT_SECRET
 *        GOOGLE_OAUTH_REFRESH_TOKEN
 *      and redeploy.
 *
 * The refresh token doesn't expire as long as you don't revoke
 * https://myaccount.google.com/permissions on that Google account.
 */

import http from "node:http";
import { URL } from "node:url";

const SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
];
const REDIRECT_PORT = 3210;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/oauth2callback`;

const [, , clientId, clientSecret] = process.argv;
if (!clientId || !clientSecret) {
  console.error(
    "Usage: node scripts/get-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>"
  );
  process.exit(1);
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPES.join(" "));
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent"); // forces refresh_token even on re-auth

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "", `http://localhost:${REDIRECT_PORT}`);
  if (url.pathname !== "/oauth2callback") {
    res.statusCode = 404;
    res.end("not found");
    return;
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.statusCode = 400;
    res.end(`Auth failed: ${error}`);
    console.error("OAuth error:", error);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.statusCode = 400;
    res.end("Missing code");
    server.close();
    process.exit(1);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const json = await tokenRes.json();
    if (!tokenRes.ok) {
      res.statusCode = 500;
      res.end("Token exchange failed — see terminal");
      console.error("Token exchange failed:", json);
      server.close();
      process.exit(1);
    }

    const refreshToken = json.refresh_token;
    if (!refreshToken) {
      res.statusCode = 500;
      res.end(
        "No refresh_token returned. Revoke the previous grant at " +
          "https://myaccount.google.com/permissions and rerun."
      );
      console.error("Response:", json);
      server.close();
      process.exit(1);
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");
    res.end(
      "<h1>Done</h1><p>Refresh token captured. Check your terminal. " +
        "You can close this tab.</p>"
    );

    console.log("\n=== REFRESH TOKEN ===");
    console.log(refreshToken);
    console.log("=====================\n");
    console.log("Add to Vercel as GOOGLE_OAUTH_REFRESH_TOKEN and redeploy.");
    server.close();
    process.exit(0);
  } catch (err) {
    res.statusCode = 500;
    res.end("Token exchange threw — see terminal");
    console.error(err);
    server.close();
    process.exit(1);
  }
});

server.listen(REDIRECT_PORT, async () => {
  console.log(
    `\nLocal callback server up at ${REDIRECT_URI}\n\nOpen this URL in the browser of your choice:\n\n${authUrl}\n\n` +
      "Sign in with the Google account that's already admin on the GA4 " +
      "property and the GSC site. Grant both scopes when asked.\n"
  );

  // Best-effort: open the URL in the default browser. Falls back to
  // the printed URL above if `open` isn't available.
  const cmd =
    process.platform === "win32"
      ? "start"
      : process.platform === "darwin"
        ? "open"
        : "xdg-open";
  try {
    const { spawn } = await import("node:child_process");
    spawn(cmd, [authUrl.toString()], {
      stdio: "ignore",
      detached: true,
      shell: true,
    }).unref();
  } catch {
    /* user can copy-paste the URL manually */
  }
});
