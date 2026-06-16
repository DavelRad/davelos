/**
 * One-time helper to get a Spotify REFRESH TOKEN for the portfolio's /api/spotify function.
 *
 * It opens Spotify's consent page, captures the auth code on a local loopback server,
 * exchanges it for tokens, and prints your refresh token. Nothing is written to disk.
 *
 * RUN THIS IN YOUR OWN TERMINAL (not inside the Claude session) so the token stays private:
 *
 *   cd ~/portfolio
 *   SPOTIFY_CLIENT_ID=xxxx SPOTIFY_CLIENT_SECRET=yyyy node scripts/spotify-auth.mjs
 *
 * Prereqs:
 *   - Node 18+ (uses global fetch).
 *   - In your Spotify app dashboard, add this EXACT Redirect URI:
 *       http://127.0.0.1:8888/callback
 *
 * Scopes requested: user-read-currently-playing, user-read-recently-played, user-top-read
 */

import http from "node:http";
import crypto from "node:crypto";
import { exec } from "node:child_process";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const PORT = 8888;
const REDIRECT_URI =
  process.env.SPOTIFY_REDIRECT_URI || `http://127.0.0.1:${PORT}/callback`;
const SCOPES = [
  "user-read-currently-playing",
  "user-read-recently-played",
  "user-top-read",
].join(" ");

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "\n✖ Missing credentials.\n  Run:  SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... node scripts/spotify-auth.mjs\n",
  );
  process.exit(1);
}

const state = crypto.randomBytes(8).toString("hex");
const authUrl =
  "https://accounts.spotify.com/authorize?" +
  new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state,
  }).toString();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }

  const error = url.searchParams.get("error");
  if (error) {
    res.writeHead(400, { "Content-Type": "text/html" }).end(`<h2>Denied: ${error}</h2>`);
    console.error("\n✖ Authorization denied:", error);
    server.close();
    process.exit(1);
  }

  if (url.searchParams.get("state") !== state) {
    res.writeHead(400).end("State mismatch — try again.");
    return;
  }

  const code = url.searchParams.get("code");
  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });
    const data = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(JSON.stringify(data));

    res.writeHead(200, { "Content-Type": "text/html" }).end(
      `<body style="font-family:system-ui;background:#121212;color:#fff;display:grid;place-items:center;height:100vh;margin:0">
         <div style="text-align:center">
           <h2 style="color:#1DB954">✓ Connected</h2>
           <p>Close this tab and return to your terminal.</p>
         </div>
       </body>`,
    );

    console.log("\n==================================================");
    console.log("✓ SUCCESS — copy your REFRESH TOKEN:");
    console.log("==================================================\n");
    console.log(data.refresh_token);
    console.log("\nThen set these env vars (in Vercel, and in ~/portfolio/.env.local for local dev):");
    console.log("  SPOTIFY_CLIENT_ID=" + CLIENT_ID);
    console.log("  SPOTIFY_CLIENT_SECRET=<your secret>");
    console.log("  SPOTIFY_REFRESH_TOKEN=<the token above>");
    console.log("\n⚠  Keep these secret. Never commit them.\n");

    server.close();
    process.exit(0);
  } catch (e) {
    res.writeHead(500).end("Token exchange failed — see terminal.");
    console.error("\n✖ Token exchange failed:", e.message);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n▶ Listening on ${REDIRECT_URI}`);
  console.log("▶ Opening Spotify consent page…");
  console.log("  (If it doesn't open, paste this URL into your browser:)\n");
  console.log("  " + authUrl + "\n");
  exec(`open "${authUrl}"`); // macOS
});
