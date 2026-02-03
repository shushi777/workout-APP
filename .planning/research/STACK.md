# Technology Stack: React + Tailwind Mobile PWA Frontend

**Project:** Workout Video Editor - Frontend Rebuild
**Researched:** 2026-02-03
**Focus:** Frontend stack for mobile-only PWA connecting to existing Flask API

---

## Recommended Stack

### Build Tool & Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Vite** | 7.x | Build tool & dev server | Current standard, 5x faster builds than webpack, first-party PWA plugin, excellent HMR. CRA is officially deprecated. | HIGH |
| **React** | 19.x | UI framework | Latest stable (19.2.4 as of Jan 2026). Includes Actions, improved ref handling, document metadata hoisting. | HIGH |
| **TypeScript** | 5.x | Type safety | Industry standard for React projects. Better DX, catches errors early, excellent IDE support. | HIGH |

**Installation:**
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
```

**Source:** [Vite Official Releases](https://vite.dev/releases), [React 19.2 Blog Post](https://react.dev/blog/2025/10/01/react-19-2)

---

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Tailwind CSS** | 4.x | Utility-first CSS | v4.0 released Jan 2025. New CSS-first config, 5x faster builds, automatic content detection. First-party Vite plugin. | HIGH |
| **tailwind-merge** | latest | Class conflict resolution | Prevents Tailwind class conflicts when merging base + custom classes | HIGH |
| **clsx** | latest | Conditional classes | Clean syntax for conditional class application, pairs with tailwind-merge | HIGH |

**The `cn()` Helper Pattern (REQUIRED):**
```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Dark Mode Strategy:**
Use `selector` strategy (not `media`) for manual toggle control:
```css
/* In your main CSS file */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

**Source:** [Tailwind CSS v4.0 Announcement](https://tailwindcss.com/blog/tailwindcss-v4), [Dark Mode Docs](https://tailwindcss.com/docs/dark-mode)

---

### PWA Support

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **vite-plugin-pwa** | 0.21.x+ | PWA generation | Zero-config PWA for Vite. Generates service worker via Workbox, injects manifest, handles updates. | HIGH |
| **Workbox** | 7.x | Service worker | Industry standard for PWA caching strategies. Bundled with vite-plugin-pwa. | HIGH |

**Configuration for Web Share Target (CRITICAL):**
```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Show update prompt to user
      strategies: 'injectManifest', // Required for share target POST handling
      srcDir: 'src',
      filename: 'sw.ts',
      devOptions: {
        enabled: true // Enable PWA in dev for testing
      },
      manifest: {
        name: 'Workout Video Editor',
        short_name: 'Workout Editor',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        share_target: {
          action: '/share-receiver',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            files: [{
              name: 'video',
              accept: ['video/*']
            }]
          }
        },
        icons: [/* ... */]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ]
})
```

**Web Share Target Handling:**
Files shared via POST must be intercepted in the service worker and passed to the app. This requires `injectManifest` strategy.

**Source:** [vite-plugin-pwa Docs](https://vite-pwa-org.netlify.app/guide/), [Web Share Target MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target)

---

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Zustand** | 5.x | Client state | Minimal boilerplate, ~3KB, no providers needed. Perfect for UI state (drawer open, selected segment, zoom level). | HIGH |
| **@tanstack/react-query** | 5.x | Server state | Handles API caching, background refetch, loading/error states. Separates server state from UI state cleanly. | HIGH |

**Why Zustand over Redux:**
- No boilerplate (no actions, reducers, action types)
- No Provider wrapper needed
- 3KB vs 11KB+ for Redux Toolkit
- Simpler mental model for mid-size apps

**Why Zustand over Jotai:**
- Single store model matches your existing state structure
- Simpler for this use case (not highly interconnected atoms)
- Slightly better DevTools support

**Example Store (Timeline Editor):**
```typescript
// src/stores/timelineStore.ts
import { create } from 'zustand';

interface TimelineState {
  cutPoints: CutPoint[];
  selectedSegmentIndex: number | null;
  zoomLevel: number;
  isDrawerOpen: boolean;

  // Actions
  addCutPoint: (time: number, type: 'auto' | 'manual') => void;
  removeCutPoint: (id: string) => void;
  setSelectedSegment: (index: number | null) => void;
  setZoomLevel: (level: number) => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
  cutPoints: [],
  selectedSegmentIndex: null,
  zoomLevel: 1,
  isDrawerOpen: false,

  addCutPoint: (time, type) => set((state) => ({
    cutPoints: [...state.cutPoints, { time, type, id: `${type}_${Date.now()}` }]
      .sort((a, b) => a.time - b.time)
  })),
  // ... other actions
}));
```

**Source:** [Zustand v5 Announcement](https://pmnd.rs/blog/announcing-zustand-v5), [TanStack Query Overview](https://tanstack.com/query/latest)

---

### Routing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **React Router** | 7.x | Client-side routing | Latest version, excellent SPA support, data loading capabilities. Merged with Remix. | HIGH |

**SPA Mode Configuration:**
```typescript
// For simple SPA, use declarative routing (no framework mode needed)
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/editor" element={<TimelineEditor />} />
        <Route path="/library" element={<ExerciseLibrary />} />
        <Route path="/share-receiver" element={<ShareReceiver />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**Source:** [React Router SPA Mode](https://reactrouter.com/how-to/spa)

---

### UI Components

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Headless UI** | 2.x | Unstyled components | By Tailwind team, perfect Tailwind integration. Handles accessibility, keyboard nav, state for dialogs/menus/etc. | HIGH |
| **Lucide React** | 0.562.x | Icons | Tree-shakable, 1000+ icons, clean design. Better than react-icons for bundle size. | MEDIUM |

**Why Headless UI over Radix:**
- Made by Tailwind team = better Tailwind integration
- Radix UI's future uncertain (team shifted to Base UI)
- Simpler API for common patterns
- Used for: Bottom drawer, dialogs, dropdown menus, tabs

**Alternative Considered: shadcn/ui**
- Copy-paste components built on Radix + Tailwind
- Good for rapid prototyping but adds complexity
- Recommendation: Start with Headless UI, add shadcn/ui components if needed later

**Source:** [Headless UI](https://headlessui.com/), [React UI Libraries 2026](https://www.builder.io/blog/react-component-libraries-2026)

---

### Canvas Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Native Canvas + useRef** | N/A | Timeline rendering | No library needed. Your existing Canvas code wraps cleanly in React. | HIGH |

**Canvas Component Pattern:**
```typescript
// src/components/TimelineCanvas.tsx
import { useRef, useEffect, useCallback } from 'react';
import { useTimelineStore } from '@/stores/timelineStore';

interface TimelineCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function TimelineCanvas({ videoRef }: TimelineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { cutPoints, zoomLevel, selectedSegmentIndex } = useTimelineStore();

  // Handle high-DPI displays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  // Draw function - memoize to avoid recreating
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ... your existing drawing logic
  }, [cutPoints, zoomLevel, selectedSegmentIndex]);

  // Redraw on state changes
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-32 touch-none"
      // Touch handlers via onPointerDown/Move/Up
    />
  );
}
```

**Key Points:**
- Use `useRef` to access canvas element
- Handle devicePixelRatio for sharp rendering on retina displays
- Use `touch-none` CSS class to prevent browser scroll interference
- Memoize draw function with `useCallback`

**Source:** [Canvas with React Hooks](https://koenvangilst.nl/lab/react-hooks-with-canvas)

---

### Touch/Gesture Handling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Native Pointer Events** | N/A | Touch/mouse handling | `onPointerDown/Move/Up` works for both touch and mouse. Simpler than gesture libraries for your use case. | HIGH |
| **Motion** (optional) | 12.x | Animations | Formerly Framer Motion. Use for drawer slide-up, segment highlight animations. Has built-in drag support. | MEDIUM |

**Why Native Pointer Events:**
- Your timeline already uses mouse events
- `onPointer*` events unify mouse + touch
- No library overhead for simple drag operations
- Add `touch-action: none` CSS to prevent scroll interference

**When to Add Motion:**
- Bottom drawer slide-up animation
- Segment selection highlight
- Page transitions between routes
- Drag constraints with physics

**Source:** [Motion React Docs](https://motion.dev/docs/react-motion-component)

---

### API Integration with Flask

| Aspect | Approach | Notes |
|--------|----------|-------|
| **Dev Proxy** | Vite proxy config | Avoids CORS during development |
| **Production** | Same-origin or CORS headers | Flask serves React build OR Flask-CORS |
| **Data Fetching** | TanStack Query | Handles caching, refetch, loading states |

**Vite Proxy Configuration:**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/download': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/process': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
```

**Production Options:**
1. **Flask serves React build (simpler):** Build React, copy to Flask `static/` folder
2. **Separate origins with CORS:** Use Flask-CORS, deploy frontend to CDN

**Source:** [Vite Proxy Config](https://vite.dev/config/server-options#server-proxy)

---

## What NOT to Use

| Technology | Why Not | Use Instead |
|------------|---------|-------------|
| **Create React App (CRA)** | Officially deprecated Feb 2025 | Vite |
| **Redux Toolkit** | Overkill for this app size, more boilerplate | Zustand |
| **Axios** | fetch() is sufficient, TanStack Query handles the rest | Native fetch + TanStack Query |
| **CSS Modules** | Tailwind is more maintainable for this project | Tailwind CSS |
| **react-icons** | Larger bundle, includes everything | Lucide React (tree-shakable) |
| **styled-components** | Runtime CSS-in-JS hurts performance | Tailwind CSS |
| **Radix UI directly** | Uncertain maintenance, prefer Headless UI | Headless UI |
| **Next.js** | SSR/RSC overkill for mobile-only SPA with existing Flask backend | Vite + React Router |

---

## Complete Installation

```bash
# Create project
npm create vite@latest frontend -- --template react-ts
cd frontend

# Core dependencies
npm install react-router-dom @tanstack/react-query zustand

# Styling
npm install tailwindcss @tailwindcss/vite clsx tailwind-merge

# UI Components
npm install @headlessui/react lucide-react

# PWA
npm install -D vite-plugin-pwa workbox-precaching workbox-routing

# Optional: Animations
npm install motion

# Dev dependencies
npm install -D @tanstack/react-query-devtools
npm install -D @types/node
```

---

## Project Structure

```
frontend/
├── public/
│   └── icons/              # PWA icons
├── src/
│   ├── components/
│   │   ├── ui/             # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Drawer.tsx
│   │   │   └── Chip.tsx
│   │   ├── timeline/       # Timeline-specific components
│   │   │   ├── TimelineCanvas.tsx
│   │   │   ├── CutPointMarker.tsx
│   │   │   └── SegmentCard.tsx
│   │   └── layout/
│   │       ├── BottomNav.tsx
│   │       └── PageLayout.tsx
│   ├── pages/
│   │   ├── UploadPage.tsx
│   │   ├── TimelineEditor.tsx
│   │   ├── ExerciseLibrary.tsx
│   │   └── ShareReceiver.tsx
│   ├── stores/
│   │   ├── timelineStore.ts
│   │   └── uiStore.ts
│   ├── hooks/
│   │   ├── useExercises.ts     # TanStack Query hooks
│   │   └── useVideoUpload.ts
│   ├── lib/
│   │   ├── utils.ts            # cn() helper
│   │   └── api.ts              # API client
│   ├── sw.ts                   # Service worker (for share target)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── vite.config.ts
├── tailwind.config.ts          # Only if customizing beyond @theme
└── tsconfig.json
```

---

## Confidence Assessment Summary

| Technology | Confidence | Notes |
|------------|------------|-------|
| Vite 7.x | HIGH | Verified via official releases |
| React 19.x | HIGH | Verified via react.dev |
| Tailwind CSS 4.x | HIGH | Verified via official blog |
| Zustand 5.x | HIGH | Verified via npm |
| TanStack Query 5.x | HIGH | Verified via npm |
| React Router 7.x | HIGH | Verified via official docs |
| vite-plugin-pwa | HIGH | Verified via GitHub |
| Headless UI 2.x | HIGH | Verified, active maintenance |
| Lucide React | MEDIUM | Version 0.x but widely used |
| Motion | MEDIUM | Optional, add if animations needed |

---

## Sources

### Official Documentation (HIGH confidence)
- [Vite Releases](https://vite.dev/releases)
- [React 19.2 Announcement](https://react.dev/blog/2025/10/01/react-19-2)
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4)
- [TanStack Query](https://tanstack.com/query/latest)
- [React Router](https://reactrouter.com/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [Zustand](https://zustand.docs.pmnd.rs/)

### npm Registry (HIGH confidence)
- [zustand@5.0.10](https://www.npmjs.com/package/zustand)
- [@tanstack/react-query@5.90.19](https://www.npmjs.com/package/@tanstack/react-query)
- [lucide-react@0.562.0](https://www.npmjs.com/package/lucide-react)

### Community Resources (MEDIUM confidence)
- [State Management 2025/2026](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k)
- [React UI Libraries 2026](https://www.builder.io/blog/react-component-libraries-2026)
- [Canvas with React Hooks](https://koenvangilst.nl/lab/react-hooks-with-canvas)
- [Vite + Flask Integration](https://medium.com/@colinatjku/integrating-flask-and-react-using-vite-for-development-and-nginx-in-production-a-microservices-9df7a21ca8f5)
