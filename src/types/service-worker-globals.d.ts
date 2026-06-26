// Minimal worker globals used by Serwist without loading lib.webworker alongside lib.dom.
interface TrustedScriptURL { readonly __trustedScriptUrlBrand?: never }
interface ExtendableEvent extends Event { waitUntil(promise: PromiseLike<unknown>): void }
interface ExtendableMessageEvent extends ExtendableEvent { data: unknown }
interface FetchEvent extends ExtendableEvent { request: Request; respondWith(response: Response | PromiseLike<Response>): void }
interface ServiceWorkerGlobalScope extends EventTarget {
  readonly __SW_MANIFEST: (import('serwist').PrecacheEntry | string)[] | undefined;
  readonly clients: unknown;
  readonly registration: unknown;
  readonly location: WorkerLocation;
  skipWaiting(): Promise<void>;
}
interface WorkerLocation { readonly href: string; readonly origin: string }
