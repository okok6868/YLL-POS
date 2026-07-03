const CACHE_NAME = "yll-pos-first-clean-20260630-01";
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {});
