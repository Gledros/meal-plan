const CACHE_NAME = "meal-plan-v2";
const PRECACHE_URLS = [
	"/",
	"/offline.html",
	"/manifest.webmanifest",
	"/icons/icon-192.png",
	"/icons/icon-512.png",
	"/icons/apple-touch-icon.png",
	"/favicon.svg",
];

const isSameOrigin = (url) => url.origin === self.location.origin;

const extractAssetUrls = (htmlText) => {
	const assetUrls = new Set();
	const attributeRegex = /(?:href|src)=["']([^"']+)["']/g;

	for (const match of htmlText.matchAll(attributeRegex)) {
		const assetPath = match[1];

		if (
			!assetPath ||
			assetPath.startsWith("#") ||
			assetPath.startsWith("data:") ||
			assetPath.startsWith("mailto:")
		) {
			continue;
		}

		const fullAssetUrl = new URL(assetPath, self.location.origin);

		if (!isSameOrigin(fullAssetUrl)) {
			continue;
		}

		assetUrls.add(fullAssetUrl.pathname + fullAssetUrl.search);
	}

	return [...assetUrls];
};

const precacheAppShellFromRoot = async (cache) => {
	try {
		const rootResponse = await fetch("/", { cache: "no-cache" });

		if (!rootResponse.ok) {
			return;
		}

		const rootHtml = await rootResponse.text();
		const assetUrls = extractAssetUrls(rootHtml);

		if (assetUrls.length > 0) {
			await cache.addAll(assetUrls);
		}
	} catch {
		// Use static precache fallback when app-shell extraction fails.
	}
};

const cacheResponse = async (cache, request, response) => {
	if (!response || response.status !== 200 || response.type === "opaque") {
		return;
	}

	await cache.put(request, response.clone());
};

self.addEventListener("install", (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE_NAME);
			await cache.addAll(PRECACHE_URLS);
			await precacheAppShellFromRoot(cache);
			await self.skipWaiting();
		})(),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames
					.filter((cacheName) => cacheName !== CACHE_NAME)
					.map((cacheName) => caches.delete(cacheName)),
			);
			await self.clients.claim();
		})(),
	);
});

const handleNavigationRequest = async (request) => {
	const cache = await caches.open(CACHE_NAME);
	const cachedResponse = await cache.match(request);

	if (cachedResponse) {
		fetch(request)
			.then((networkResponse) => cacheResponse(cache, request, networkResponse))
			.catch(() => {
				// Keep cached page when the network is unavailable.
			});

		return cachedResponse;
	}

	try {
		const networkResponse = await fetch(request);
		await cacheResponse(cache, request, networkResponse);
		return networkResponse;
	} catch {
		const offlineResponse = await cache.match("/offline.html");
		return offlineResponse || Response.error();
	}
};

const handleAssetRequest = async (request) => {
	const cache = await caches.open(CACHE_NAME);
	const cachedResponse = await cache.match(request);

	if (cachedResponse) {
		fetch(request)
			.then((networkResponse) => cacheResponse(cache, request, networkResponse))
			.catch(() => {
				// Keep cached content when the network is unavailable.
			});

		return cachedResponse;
	}

	try {
		const networkResponse = await fetch(request);
		await cacheResponse(cache, request, networkResponse);
		return networkResponse;
	} catch {
		if (request.destination === "document") {
			const offlineResponse = await cache.match("/offline.html");
			return offlineResponse || Response.error();
		}

		return Response.error();
	}
};

self.addEventListener("fetch", (event) => {
	const { request } = event;

	if (request.method !== "GET") {
		return;
	}

	const requestUrl = new URL(request.url);

	if (!isSameOrigin(requestUrl)) {
		return;
	}

	if (request.mode === "navigate") {
		event.respondWith(handleNavigationRequest(request));
		return;
	}

	event.respondWith(handleAssetRequest(request));
});