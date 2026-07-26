const CACHE_NAME = "yll-pos-latest-boss-performance-20260726-02";
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {});
