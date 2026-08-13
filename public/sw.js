/*
 * Kill-switch service worker.
 *
 * davelradindra.com used to be a Gatsby site whose `gatsby-plugin-offline`
 * registered a service worker at /sw.js. The site is now a plain Vite SPA that
 * registers NO service worker — but that old worker is still installed in the
 * browser of anyone who visited the Gatsby version. It intercepts navigations
 * and serves the dead Gatsby app shell from its own cache, which then fails to
 * load Gatsby "page resources" and renders a blank white page. (A hard refresh
 * or an incognito window bypasses the worker, which is why those look fine.)
 *
 * Serving THIS file at the same /sw.js URL lets the browser's normal update
 * check replace the stale worker with one that deletes every cache, unregisters
 * itself, and reloads open tabs — so returning visitors self-heal on their next
 * visit and the site is served straight from the network from then on. The
 * current app never calls navigator.serviceWorker.register(), so new visitors
 * never run this; it exists purely to evict the old Gatsby worker.
 */
self.addEventListener("install", () => {
  // Activate immediately rather than waiting for existing tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 1) Drop every cache the old Gatsby worker precached.
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {
        /* best-effort */
      }
      // 2) Remove this registration entirely.
      try {
        await self.registration.unregister();
      } catch {
        /* best-effort */
      }
      // 3) Reload open tabs so they load fresh from the network (no worker).
      try {
        const clients = await self.clients.matchAll({ type: "window" });
        for (const client of clients) {
          client.navigate(client.url);
        }
      } catch {
        /* best-effort */
      }
    })(),
  );
});
