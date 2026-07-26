const CACHE_NAME = "yll-pos-latest-ipad-order-confirm-20260726-03";
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {});
