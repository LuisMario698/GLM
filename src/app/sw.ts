import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from 'serwist';
import { CacheFirst, ExpirationPlugin, NetworkOnly, Serwist } from 'serwist';

declare global { interface WorkerGlobalScope extends SerwistGlobalConfig { __SW_MANIFEST: (PrecacheEntry | string)[] | undefined } }
declare const self: ServiceWorkerGlobalScope;

const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ request, sameOrigin }) => sameOrigin && ['font', 'image', 'script', 'style'].includes(request.destination),
    handler: new CacheFirst({ cacheName: 'glm-static-v2', plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 30 * 86400 })] }),
  },
  { matcher: () => true, handler: new NetworkOnly() },
];
const serwist = new Serwist({ precacheEntries: self.__SW_MANIFEST, skipWaiting: true, clientsClaim: true, navigationPreload: true, runtimeCaching, fallbacks: { entries: [{ url: '/offline', matcher: ({ request }) => request.destination === 'document' }] } });
serwist.addEventListeners();
