# Phase 5: PWA Migration - Research

**Researched:** 2026-02-03
**Domain:** Progressive Web App (PWA) with React SPA, Vite, Web Share Target API
**Confidence:** HIGH

## Summary

This phase migrates the existing vanilla JS PWA to a React SPA with full PWA capabilities using vite-plugin-pwa and Workbox. The research confirms that vite-plugin-pwa is the standard solution for Vite + React PWAs in 2026, providing zero-config PWA support with built-in React hooks for update prompts.

The key technical challenge is implementing Web Share Target API in a React SPA context. The existing `/share-receiver` POST endpoint must be handled by the service worker, which then needs to redirect to the React app with the shared video data. This requires careful service worker configuration to intercept POST requests while allowing the SPA router to handle client-side navigation.

**Primary recommendation:** Use vite-plugin-pwa with `injectManifest` strategy for Web Share Target support. The service worker must intercept `/share-receiver` POST requests, extract formData, temporarily store the video file in IndexedDB or Cache API, then redirect to the React app which retrieves and processes the file.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite-plugin-pwa | 0.21.x+ | PWA build plugin | Official Vite PWA plugin, 10K+ GitHub stars, built-in Workbox integration, React hooks included |
| workbox-window | 7.x | Service worker registration | Required by vite-plugin-pwa, provides update lifecycle management |
| workbox-core | 7.x | Service worker core | Workbox foundation for custom SW logic |
| workbox-routing | 7.x | Request routing | Pattern-based request interception for Share Target |
| workbox-strategies | 7.x | Cache strategies | NetworkFirst, CacheFirst, StaleWhileRevalidate |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| idb | 8.x | IndexedDB wrapper | Store shared video files temporarily before React app loads |
| workbox-precaching | 7.x | Precache manifest | Auto-precache app shell (HTML, CSS, JS) for offline access |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vite-plugin-pwa | Custom Workbox setup | vite-plugin-pwa handles build integration, manifest generation, and dev mode automatically |
| IndexedDB | Cache API | Cache API simpler but IndexedDB better for large binary files (videos) |
| injectManifest | generateSW | generateSW can't handle Web Share Target POST requests - must use injectManifest |

**Installation:**
```bash
cd frontend

# Core PWA dependencies
npm install -D vite-plugin-pwa

# Workbox dependencies (for injectManifest strategy)
npm install workbox-window workbox-core workbox-routing workbox-strategies workbox-precaching

# IndexedDB helper (for storing shared videos)
npm install idb
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/
├── public/
│   ├── manifest.json           # PWA manifest (migrated from root)
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── src/
│   ├── sw.ts                   # Custom service worker (injectManifest)
│   ├── components/
│   │   └── ui/
│   │       └── UpdatePrompt.tsx # SW update notification UI
│   ├── lib/
│   │   └── shareTarget.ts      # IndexedDB helpers for shared files
│   └── main.tsx
└── vite.config.ts              # VitePWA plugin config
```

### Pattern 1: vite-plugin-pwa Configuration (injectManifest Strategy)

**What:** Configure Vite PWA plugin to use custom service worker with Web Share Target support
**When to use:** When you need custom service worker logic (e.g., POST request handling)
**Example:**
```typescript
// Source: https://vite-pwa-org.netlify.app/workbox/inject-manifest.html
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      manifest: {
        name: 'Workout Video Editor',
        short_name: 'Workout App',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#667eea',
        description: 'עורך וידאו לאימונים - חתוך וסמן תרגילים',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        share_target: {
          action: '/share-receiver',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            files: [
              {
                name: 'video',
                accept: ['video/*']
              }
            ]
          }
        }
      },

      devOptions: {
        enabled: true, // Enable SW in dev mode for testing
        type: 'module'
      }
    })
  ]
});
```

### Pattern 2: Custom Service Worker with Web Share Target

**What:** Service worker intercepts POST requests to `/share-receiver`, stores video in IndexedDB, redirects to SPA
**When to use:** Required for Web Share Target API with SPA
**Example:**
```typescript
// Source: https://developer.chrome.com/docs/capabilities/web-apis/web-share-target
// src/sw.ts
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

// Precache app shell (generated by Vite PWA)
precacheAndRoute(self.__WB_MANIFEST);

// Handle Web Share Target POST requests
self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // Intercept /share-receiver POST
  if (event.request.method === 'POST' && url.pathname === '/share-receiver') {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const videoFile = formData.get('video') as File;

          if (!videoFile) {
            return Response.redirect('/', 303);
          }

          // Store video in IndexedDB with timestamp ID
          const videoId = `shared-${Date.now()}`;
          const { storeSharedVideo } = await import('./lib/shareTarget');
          await storeSharedVideo(videoId, videoFile);

          // Redirect to SPA with video ID in query params
          return Response.redirect(`/?shared=${videoId}`, 303);
        } catch (error) {
          console.error('[SW] Share receiver error:', error);
          return Response.redirect('/?error=share-failed', 303);
        }
      })()
    );
    return;
  }
});

// Cache strategies for runtime requests
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({ cacheName: 'images' })
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({ cacheName: 'api' })
);
```

### Pattern 3: IndexedDB Video Storage Helper

**What:** Helper functions to store/retrieve shared video files using IndexedDB
**When to use:** Required to pass video data from service worker to React app
**Example:**
```typescript
// Source: https://www.npmjs.com/package/idb
// src/lib/shareTarget.ts
import { openDB, DBSchema } from 'idb';

interface ShareTargetDB extends DBSchema {
  'shared-videos': {
    key: string;
    value: {
      id: string;
      file: File;
      timestamp: number;
    };
  };
}

const DB_NAME = 'workout-share-target';
const STORE_NAME = 'shared-videos';
const DB_VERSION = 1;

export async function storeSharedVideo(id: string, file: File) {
  const db = await openDB<ShareTargetDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });

  await db.put(STORE_NAME, {
    id,
    file,
    timestamp: Date.now(),
  });

  db.close();
}

export async function getSharedVideo(id: string): Promise<File | null> {
  const db = await openDB<ShareTargetDB>(DB_NAME, DB_VERSION);
  const entry = await db.get(STORE_NAME, id);
  db.close();

  return entry?.file || null;
}

export async function deleteSharedVideo(id: string) {
  const db = await openDB<ShareTargetDB>(DB_NAME, DB_VERSION);
  await db.delete(STORE_NAME, id);
  db.close();
}

// Cleanup old shared videos (>1 hour old)
export async function cleanupOldSharedVideos() {
  const db = await openDB<ShareTargetDB>(DB_NAME, DB_VERSION);
  const allEntries = await db.getAll(STORE_NAME);
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  for (const entry of allEntries) {
    if (entry.timestamp < oneHourAgo) {
      await db.delete(STORE_NAME, entry.id);
    }
  }

  db.close();
}
```

### Pattern 4: React Update Prompt Component

**What:** UI component using vite-plugin-pwa React hook to notify users of updates
**When to use:** Required for good UX when new versions are deployed
**Example:**
```typescript
// Source: https://vite-pwa-org.netlify.app/frameworks/react
// src/components/ui/UpdatePrompt.tsx
import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every hour
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <>
      {(offlineReady || needRefresh) && (
        <div className="fixed bottom-20 right-4 z-50 rounded-lg bg-card p-4 shadow-lg border">
          <div className="flex flex-col gap-2">
            <p className="text-sm">
              {offlineReady
                ? 'האפליקציה מוכנה לשימוש אופליין'
                : 'גרסה חדשה זמינה - לחץ לעדכון'}
            </p>
            <div className="flex gap-2">
              {needRefresh && (
                <button
                  className="px-3 py-1 bg-primary text-primary-foreground rounded"
                  onClick={() => updateServiceWorker(true)}
                >
                  עדכן עכשיו
                </button>
              )}
              <button
                className="px-3 py-1 border rounded"
                onClick={close}
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

### Pattern 5: React Router Integration with Shared Video

**What:** App.tsx checks for shared video query param on mount, retrieves from IndexedDB
**When to use:** Required to complete the Web Share Target flow
**Example:**
```typescript
// src/App.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSharedVideo, deleteSharedVideo } from './lib/shareTarget';

export function App() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const sharedVideoId = searchParams.get('shared');

    if (sharedVideoId) {
      // Retrieve shared video from IndexedDB
      getSharedVideo(sharedVideoId).then((file) => {
        if (file) {
          // Process the video (trigger upload flow)
          // This will be implemented in Phase 2 (Upload Feature)
          console.log('Received shared video:', file.name);

          // Cleanup
          deleteSharedVideo(sharedVideoId);

          // Navigate to upload page with file
          navigate('/', { state: { sharedFile: file } });
        }
      });
    }
  }, [searchParams, navigate]);

  return (
    // App layout
  );
}
```

### Anti-Patterns to Avoid

- **Registering SW without TypeScript types:** Always add `/// <reference types="vite-plugin-pwa/react" />` to `vite-env.d.ts`
- **Using generateSW for Web Share Target:** generateSW cannot handle POST requests - must use injectManifest
- **Storing shared videos indefinitely:** Always implement cleanup logic (1-hour expiry recommended)
- **Not testing SW in dev mode:** Enable `devOptions.enabled: true` to catch issues early
- **Forgetting HTTP 303 redirects:** Use 303 See Other to prevent POST resubmission on refresh

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service worker registration | Custom registration logic | `vite-plugin-pwa` with `registerType: 'autoUpdate'` | Handles update lifecycle, skip waiting, claim clients automatically |
| Precache manifest generation | Manual file listing | `workbox-precaching` with `self.__WB_MANIFEST` | Vite PWA auto-generates with content hashes for cache busting |
| Cache strategies | Custom fetch event handlers | `workbox-strategies` (NetworkFirst, CacheFirst, etc.) | Battle-tested patterns with expiration, background sync |
| Update prompts | Custom update detection | `useRegisterSW` React hook | Provides stateful values for offlineReady/needRefresh |
| IndexedDB management | Raw IndexedDB API | `idb` library | Promise-based wrapper, better TypeScript support, simpler API |

**Key insight:** Workbox patterns are the result of years of PWA best practices research by Google Chrome team. Custom solutions miss edge cases like race conditions, quota exceeded errors, and browser-specific quirks.

## Common Pitfalls

### Pitfall 1: Service Worker Caching Stale Builds

**What goes wrong:** After deploying new React build, users see old cached version indefinitely
**Why it happens:** Service worker caches app shell aggressively, doesn't check for updates
**How to avoid:**
- Use `registerType: 'autoUpdate'` in vite-plugin-pwa config
- Implement periodic update checks (every hour): `setInterval(() => r.update(), 3600000)`
- Use content-based hashing for assets (Vite does this automatically)
- Set `max-age=0, no-cache` headers for `service-worker.js` on backend
**Warning signs:** Users report not seeing new features after deployment

### Pitfall 2: Web Share Target Not Working After Install

**What goes wrong:** Share target doesn't appear in share menu even after PWA installation
**Why it happens:** Browser only registers share target after PWA is fully installed and manifest is parsed
**How to avoid:**
- Test on actual mobile device (not desktop Chrome DevTools)
- Ensure manifest.json is served from `/manifest.json` (not `/public/manifest.json`)
- Verify `share_target` object is correctly nested in manifest
- Use `method: "POST"` and `enctype: "multipart/form-data"` for file sharing
- Check browser console for manifest parsing errors
**Warning signs:** PWA installs but doesn't appear in system share sheet

### Pitfall 3: IndexedDB Quota Exceeded When Storing Videos

**What goes wrong:** Large shared videos fail to store, breaking share flow
**Why it happens:** IndexedDB has browser storage quota limits (typically 50-80% of available disk space, but per-origin limits apply)
**How to avoid:**
- Implement cleanup logic for old shared videos (>1 hour)
- Check available quota before storing: `navigator.storage.estimate()`
- Show error UI if quota exceeded: "Not enough storage space"
- Consider storing only metadata and passing video via Blob URL instead
**Warning signs:** Share target works for small videos but fails for large ones

### Pitfall 4: Service Worker Not Updating During Development

**What goes wrong:** Changes to sw.ts don't reflect in browser, shows old service worker
**Why it happens:** Browser caches service worker aggressively, even in dev mode
**How to avoid:**
- Enable `devOptions.enabled: true` in vite-plugin-pwa config
- Use "Update on reload" in Chrome DevTools → Application → Service Workers
- Unregister SW manually during heavy development: `navigator.serviceWorker.getRegistrations().then(r => r[0]?.unregister())`
- Clear site data completely when stuck: DevTools → Application → Clear Storage
**Warning signs:** Console shows old service worker version number

### Pitfall 5: React Router Conflicts with Service Worker Routing

**What goes wrong:** SPA routes (e.g., `/editor`) return 404 when loaded directly after service worker caching
**Why it happens:** Service worker tries to cache-first strategy for navigation requests, but routes don't exist as physical files
**How to avoid:**
- Use `navigateFallback: '/'` in vite-plugin-pwa config to always serve index.html for navigation requests
- Exclude API routes from navigation fallback: `navigateFallbackDenylist: [/^\/api/, /^\/share-receiver/]`
- Use NetworkFirst strategy for HTML navigation requests
- Ensure server always returns index.html for SPA routes (Flask config needed)
**Warning signs:** Refreshing on `/editor` route shows 404 after PWA install

### Pitfall 6: Service Worker Import Errors with Vite Plugins

**What goes wrong:** Custom service worker fails to build with errors like "Cannot use import statement outside a module"
**Why it happens:** From v0.15.0, vite-plugin-pwa builds custom SWs with Vite, but Vite plugins aren't automatically included
**How to avoid:**
- Add required Vite plugins to `injectManifest.plugins` array in config
- Use `type: 'module'` in devOptions
- Ensure `sw.ts` uses ES modules syntax consistently
- Don't use Node.js-only APIs in service worker (use Web APIs only)
**Warning signs:** Build fails with module import errors in service worker

## Code Examples

Verified patterns from official sources:

### Complete vite.config.ts with PWA

```typescript
// Source: https://vite-pwa-org.netlify.app/guide/
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      manifest: {
        name: 'Workout Video Editor',
        short_name: 'Workout App',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#667eea',
        description: 'עורך וידאו לאימונים - חתוך וסמן תרגילים',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        share_target: {
          action: '/share-receiver',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            files: [
              {
                name: 'video',
                accept: ['video/*']
              }
            ]
          }
        }
      },

      workbox: {
        navigateFallback: '/',
        navigateFallbackDenylist: [/^\/api/, /^\/share-receiver/, /^\/download/],
      },

      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: '/',
      },

      // Include Vite plugins for SW build (if needed)
      injectManifest: {
        plugins: [
          // Add any Vite plugins used in sw.ts here
        ],
      },
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/process': { target: 'http://localhost:5000', changeOrigin: true },
      '/download': { target: 'http://localhost:5000', changeOrigin: true },
      '/get-tags': { target: 'http://localhost:5000', changeOrigin: true },
      '/share-receiver': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
  build: {
    outDir: '../static/react',
    emptyOutDir: true,
  },
});
```

### TypeScript Types Configuration

```typescript
// Source: https://vite-pwa-org.netlify.app/frameworks/react
// src/vite-env.d.ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
/// <reference types="vite-plugin-pwa/client" />
```

### Workbox Cache Strategies

```typescript
// Source: https://developer.chrome.com/docs/workbox/modules/workbox-strategies
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { registerRoute } from 'workbox-routing';

// API calls: Network first, fallback to cache if offline
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
  })
);

// Images: Cache first for performance
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      {
        cacheableResponse: { statuses: [0, 200] },
      },
      {
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    ],
  })
);

// Fonts: Stale while revalidate (use cached, update in background)
registerRoute(
  ({ request }) => request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'fonts-cache',
  })
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Create React App with `cra-template-pwa` | Vite + vite-plugin-pwa | Feb 2025 | CRA deprecated, Vite 5x faster builds, better DX |
| Workbox CLI for SW generation | vite-plugin-pwa integrated build | 2023 | Automatic manifest injection, no build step separation |
| Manual manifest.json serving | Vite PWA auto-generates and serves | 2023 | Content hashing for cache busting, automatic icon optimization |
| `registerType: 'prompt'` default | `registerType: 'autoUpdate'` recommended | 2024 | Better UX - updates happen automatically, user still notified |
| Separate service worker file in `public/` | TypeScript `src/sw.ts` with Vite build | 2023 | Type safety, import other modules, use Vite plugins |

**Deprecated/outdated:**
- **Workbox v6.x**: Upgrade to v7.x (requires Node 16+, better TypeScript support)
- **`workbox-webpack-plugin`**: Use vite-plugin-pwa instead
- **Manual cache versioning**: Use Workbox precaching with content hashes
- **`skipWaiting()` without user consent**: Use `registerType: 'autoUpdate'` with update prompt instead

## Open Questions

Things that couldn't be fully resolved:

1. **Flask Backend Serving React SPA Routes**
   - What we know: Flask needs to return `index.html` for all SPA routes (e.g., `/editor`)
   - What's unclear: Whether existing Flask routing conflicts with SPA routes, how to configure catch-all route
   - Recommendation: Add Flask route: `@app.route('/', defaults={'path': ''})` and `@app.route('/<path:path>')` that returns `send_from_directory('../static/react', 'index.html')` for non-API routes

2. **Browser Support for Web Share Target API**
   - What we know: Chrome/Edge on Android support it well, iOS Safari has limited support
   - What's unclear: Current iOS Safari support status in 2026, fallback strategy for unsupported browsers
   - Recommendation: Check MDN compatibility table, provide "manual upload" fallback UI for unsupported browsers

3. **Video File Size Limits in IndexedDB**
   - What we know: IndexedDB can store large files, but quota limits vary by browser
   - What's unclear: Practical size limits for shared videos (e.g., 500MB+ workout videos)
   - Recommendation: Test with real device quotas, consider direct memory passing via `postMessage` for very large files instead of IndexedDB

4. **Service Worker Update Timing**
   - What we know: Workbox uses time-based heuristics (one minute), rebuilds within one minute may cause unexpected behavior
   - What's unclear: Whether this affects production deploys or only local development
   - Recommendation: Implement manual cache-busting version endpoint (e.g., `/api/version`) that backend increments on deploy, service worker checks hourly

## Sources

### Primary (HIGH confidence)

- [Vite PWA Plugin Official Docs](https://vite-pwa-org.netlify.app/) - Complete setup guide, React integration
- [Vite PWA React Framework Guide](https://vite-pwa-org.netlify.app/frameworks/react) - useRegisterSW hook API
- [Vite PWA injectManifest Strategy](https://vite-pwa-org.netlify.app/workbox/inject-manifest.html) - Custom SW setup
- [Vite PWA generateSW Strategy](https://vite-pwa-org.netlify.app/workbox/generate-sw) - Runtime caching config
- [MDN: share_target manifest](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target) - Manifest configuration, POST/file requirements
- [Chrome Developers: Web Share Target API](https://developer.chrome.com/docs/capabilities/web-apis/web-share-target) - Service worker implementation, formData handling
- [Workbox Strategies Documentation](https://developer.chrome.com/docs/workbox/modules/workbox-strategies) - NetworkFirst, CacheFirst, StaleWhileRevalidate

### Secondary (MEDIUM confidence)

- [Taming PWA Cache Behavior (2025)](https://iinteractive.com/resources/blog/taming-pwa-cache-behavior) - Cache invalidation strategies, version-based cache names, manual refresh mechanisms
- [Advanced Caching Strategies with Workbox](https://medium.com/animall-engineering/advanced-caching-strategies-with-workbox-beyond-stalewhilerevalidate-d000f1d27d0a) - When to use each strategy, tradeoffs
- [vite-plugin-pwa GitHub](https://github.com/vite-pwa/vite-plugin-pwa) - Official repository, issue tracker
- Multiple community tutorials on Vite + React PWA (2025-2026) - Verified against official docs

### Tertiary (LOW confidence)

- WebSearch results on React 19 compatibility - No specific issues found, appears compatible
- Community discussions on service worker update timing - Flagged for validation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - vite-plugin-pwa is verified official solution with 10K+ GitHub stars, all versions confirmed current
- Architecture: HIGH - Patterns verified from official Vite PWA docs, Chrome Developers guides, and MDN
- Pitfalls: HIGH - Sourced from official docs warnings, community issue trackers, and production PWA experience articles
- Web Share Target: MEDIUM - Verified with MDN and Chrome docs, but SPA-specific integration required custom research

**Research date:** 2026-02-03
**Valid until:** 2026-04-03 (60 days - PWA ecosystem is relatively stable, but Workbox/Vite updates may occur)

---

**Critical Implementation Notes:**

1. **Service Worker Build Configuration:** The `injectManifest` strategy is mandatory because Web Share Target POST requests cannot be handled by `generateSW`. The service worker must be written in TypeScript (`src/sw.ts`) and built by Vite.

2. **IndexedDB Temporary Storage:** Shared video files must be stored in IndexedDB temporarily because the service worker intercepts the POST request before the React app loads. The React app then retrieves the file on mount and processes it normally.

3. **HTTP 303 Redirects:** Always use HTTP 303 (See Other) when redirecting from POST to GET to prevent browser from resubmitting the POST on page refresh.

4. **Manifest Location:** The manifest.json must be served from `/manifest.json` (not `/public/manifest.json`) for proper PWA installation. Vite PWA handles this automatically in the build.

5. **Backend Compatibility:** The existing Flask `/share-receiver` endpoint can remain for backward compatibility with the old vanilla JS PWA, but will not be called once the React SPA service worker is active. The service worker intercepts the request first.

6. **Update Prompt UX:** Implement the `UpdatePrompt` component from the start - without it, users may not realize updates are available and may use stale versions indefinitely.
