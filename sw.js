const CACHE_NAME = "yll-pos-latest-product-alignment-20260726-01";
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {});
