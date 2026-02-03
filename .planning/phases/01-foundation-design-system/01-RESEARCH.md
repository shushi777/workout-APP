# Phase 1: Foundation & Design System - Research

**Researched:** 2026-02-03
**Domain:** React + Vite + Tailwind CSS + Mobile PWA Foundation
**Confidence:** HIGH

## Summary

This phase establishes the core React application with Vite 7.x as the build tool, Tailwind CSS 4.x for styling with dark theme, React Router 7.x for SPA navigation, and Zustand 5.x for client state. The stack is well-documented and current as of 2026.

The key focus areas are: (1) Vite project scaffolding with TypeScript, (2) Tailwind CSS 4 setup with CSS-first dark mode configuration, (3) mobile-first bottom tab navigation with 44px+ touch targets, (4) RTL support for Hebrew using logical properties, and (5) Vite proxy configuration to connect to the existing Flask backend.

**Primary recommendation:** Use `npm create vite@latest frontend -- --template react-ts` and configure Tailwind CSS 4's `@tailwindcss/vite` plugin with `@custom-variant dark` for selector-based dark mode. Set `dir="rtl"` on the `<html>` element for Hebrew support.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite | 7.3.x | Build tool & dev server | Official Vite releases confirm 7.x is current. 5x faster than webpack, first-party plugins, excellent HMR. CRA deprecated Feb 2025. |
| React | 19.x | UI framework | Latest stable. Includes automatic JSX runtime, Actions, improved ref handling. |
| TypeScript | 5.x | Type safety | Industry standard. Better DX, catches errors at compile time. |
| Tailwind CSS | 4.x | Utility-first CSS | v4.0 uses CSS-first config, 5x faster builds, automatic content detection. First-party Vite plugin. |
| React Router | 7.x | Client routing | Latest stable, SPA mode with `ssr: false`, merged with Remix. |
| Zustand | 5.x | Client state | Minimal boilerplate (3KB), no providers, simpler than Redux for mid-size apps. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | latest | Conditional classes | Clean syntax for conditional Tailwind classes |
| tailwind-merge | latest | Class conflict resolution | Merge base + custom classes without conflicts |
| lucide-react | 0.562.x | Icons | Tree-shakable, 1000+ icons, smaller bundle than react-icons |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand | Jotai | Jotai better for highly interconnected atoms; Zustand's single-store model matches existing state structure |
| Tailwind | CSS Modules | Tailwind faster for mobile-first responsive, CSS Modules more isolated |
| React Router | TanStack Router | TanStack Router newer but React Router 7 is stable and well-documented |

**Installation:**
```bash
# Create project
npm create vite@latest frontend -- --template react-ts
cd frontend

# Core dependencies
npm install react-router-dom zustand

# Styling
npm install tailwindcss @tailwindcss/vite clsx tailwind-merge

# Icons
npm install lucide-react

# Dev types
npm install -D @types/node
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/
├── public/
│   └── icons/              # PWA icons (Phase 5)
├── src/
│   ├── components/
│   │   ├── ui/             # Reusable: Button, Chip, etc.
│   │   └── layout/
│   │       ├── BottomNav.tsx
│   │       └── PageLayout.tsx
│   ├── pages/
│   │   ├── UploadPage.tsx
│   │   ├── EditorPage.tsx
│   │   └── LibraryPage.tsx
│   ├── stores/
│   │   └── uiStore.ts      # Tab state, theme
│   ├── lib/
│   │   ├── utils.ts        # cn() helper
│   │   └── api.ts          # API client (Phase 2+)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css           # Tailwind import + dark variant
├── index.html
├── vite.config.ts
└── tsconfig.json
```

### Pattern 1: cn() Helper for Tailwind Classes
**What:** Utility function combining clsx and tailwind-merge for clean conditional classes
**When to use:** Every component that has conditional or merged Tailwind classes
**Example:**
```typescript
// Source: shadcn/ui pattern, widely adopted
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage in component
<button className={cn(
  "min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg",
  "bg-gray-800 text-white",
  isActive && "bg-blue-600",
  className
)}>
```

### Pattern 2: Bottom Tab Navigation with NavLink
**What:** Fixed bottom navigation using React Router's NavLink with active state styling
**When to use:** Mobile app shell navigation
**Example:**
```typescript
// Source: React Router docs - https://reactrouter.com/api/components/NavLink
// src/components/layout/BottomNav.tsx
import { NavLink } from 'react-router-dom';
import { Upload, Film, Library } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/', icon: Upload, label: 'Upload' },
  { to: '/editor', icon: Film, label: 'Editor' },
  { to: '/library', icon: Library, label: 'Library' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 safe-area-pb">
      <div className="flex justify-around">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center",
              "min-h-[56px] min-w-[64px] px-3 py-2",  // 44px+ touch target
              "text-gray-400 transition-colors",
              isActive && "text-blue-500"
            )}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
```

### Pattern 3: Tailwind CSS 4 Dark Mode with Selector
**What:** CSS-first dark mode using @custom-variant directive
**When to use:** Always-dark app or manual theme toggle
**Example:**
```css
/* Source: Tailwind docs - https://tailwindcss.com/docs/dark-mode */
/* src/index.css */
@import "tailwindcss";

/* Enable selector-based dark mode */
@custom-variant dark (&:where(.dark, .dark *));

/* Safe area for mobile notch/home indicator */
@utility safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

```html
<!-- index.html - always dark -->
<html lang="he" dir="rtl" class="dark">
```

### Pattern 4: Zustand Store with TypeScript
**What:** Type-safe Zustand store for UI state
**When to use:** Global client state (not server data)
**Example:**
```typescript
// Source: Zustand docs - https://zustand.docs.pmnd.rs/guides/beginner-typescript
// src/stores/uiStore.ts
import { create } from 'zustand';

interface UIState {
  activeTab: 'upload' | 'editor' | 'library';
  setActiveTab: (tab: UIState['activeTab']) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  activeTab: 'upload',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
```

### Pattern 5: Vite Proxy for Flask Backend
**What:** Dev server proxy to avoid CORS during development
**When to use:** All API calls during development
**Example:**
```typescript
// Source: Vite docs - https://vite.dev/config/server-options
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/process': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/download': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/get-tags': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../static/react',  // Output to Flask static folder
    emptyOutDir: true,
  },
});
```

### Anti-Patterns to Avoid

- **Using `@tailwind` directives in v4:** Tailwind CSS 4 uses `@import "tailwindcss"` instead of `@tailwind base/components/utilities`
- **Skipping the cn() helper:** Raw string concatenation leads to class conflicts; always use clsx + tailwind-merge
- **Touch targets under 44px:** All interactive elements must be at least 44x44px for WCAG AAA compliance
- **Using `ml-*`/`mr-*` for RTL layouts:** Use logical properties (`ms-*`/`me-*`) for automatic RTL support
- **CRA or webpack:** CRA is deprecated; Vite is the current standard

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Class merging | String concatenation | `cn()` with clsx + tailwind-merge | Handles Tailwind class conflicts automatically |
| Active link styling | Manual class comparison | `NavLink` with `isActive` prop | React Router handles route matching |
| Dark mode toggle | CSS variables manually | Tailwind `@custom-variant dark` | Consistent with Tailwind ecosystem |
| Icon system | Custom SVGs | lucide-react | Tree-shakable, consistent sizing, accessible |
| Touch feedback | Custom hover states | Tailwind `active:` pseudo-class | Works on touch devices |

**Key insight:** Tailwind CSS 4 and React Router 7 provide built-in solutions for most UI patterns. Custom implementations add maintenance burden and often miss edge cases.

## Common Pitfalls

### Pitfall 1: Tailwind CSS 4 Import Syntax
**What goes wrong:** Using old `@tailwind base/components/utilities` directives causes build errors
**Why it happens:** Tailwind CSS 4 changed to CSS-first configuration
**How to avoid:** Use single `@import "tailwindcss"` in your CSS file
**Warning signs:** Build errors mentioning unknown at-rule or missing styles

### Pitfall 2: Dark Mode Not Working in Tailwind v4
**What goes wrong:** `dark:` classes have no effect
**Why it happens:** `@custom-variant` must be explicitly declared in v4; it's not automatic
**How to avoid:** Add `@custom-variant dark (&:where(.dark, .dark *));` to your CSS file
**Warning signs:** Dark mode classes render but have no visual effect

### Pitfall 3: Touch Targets Too Small
**What goes wrong:** Users struggle to tap buttons on mobile
**Why it happens:** Desktop-first design with small click targets
**How to avoid:** Apply `min-h-[44px] min-w-[44px]` to all interactive elements
**Warning signs:** User complaints, rage taps, accessibility audit failures

### Pitfall 4: RTL Layout Issues
**What goes wrong:** Margins/padding appear on wrong side for Hebrew text
**Why it happens:** Using physical properties (`ml-*`, `mr-*`) instead of logical (`ms-*`, `me-*`)
**How to avoid:** Use logical properties throughout; set `dir="rtl"` on `<html>`
**Warning signs:** Spacing looks wrong when viewing in Hebrew

### Pitfall 5: Vite Proxy Not Working for All Routes
**What goes wrong:** Some Flask API calls fail with CORS errors
**Why it happens:** Proxy only matches configured path prefixes
**How to avoid:** Explicitly proxy ALL Flask routes: `/api`, `/process`, `/download`, `/get-tags`, etc.
**Warning signs:** Network errors for specific endpoints, CORS messages in console

### Pitfall 6: Bottom Nav Hidden by Safe Area
**What goes wrong:** Bottom navigation hidden behind iPhone home indicator
**Why it happens:** Not accounting for `safe-area-inset-bottom`
**How to avoid:** Add `padding-bottom: env(safe-area-inset-bottom)` to bottom nav
**Warning signs:** Nav partially visible on iPhone X and newer

### Pitfall 7: Node Version Too Old
**What goes wrong:** Vite fails to start or has unexpected errors
**Why it happens:** Vite 7.x requires Node.js 20.19+ or 22.12+
**How to avoid:** Check Node version before starting; use nvm to manage versions
**Warning signs:** Cryptic Node.js errors during `npm run dev`

## Code Examples

### Complete vite.config.ts
```typescript
// Source: Vite + Tailwind + Flask integration
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/process': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/download': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/get-tags': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/share-receiver': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../static/react',
    emptyOutDir: true,
  },
});
```

### Complete index.css
```css
/* Source: Tailwind CSS 4 docs */
@import "tailwindcss";

/* Selector-based dark mode */
@custom-variant dark (&:where(.dark, .dark *));

/* Safe area utilities for mobile */
@utility safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

@utility safe-area-pt {
  padding-top: env(safe-area-inset-top, 0px);
}

/* Hebrew RTL font stack */
:root {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}
```

### Complete App.tsx with Routing
```typescript
// Source: React Router SPA mode - https://reactrouter.com/how-to/spa
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import { UploadPage } from '@/pages/UploadPage';
import { EditorPage } from '@/pages/EditorPage';
import { LibraryPage } from '@/pages/LibraryPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-gray-100 pb-[72px]">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/library" element={<LibraryPage />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
```

### Complete index.html
```html
<!DOCTYPE html>
<html lang="he" dir="rtl" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#030712" />
    <title>Workout Video Editor</title>
  </head>
  <body class="bg-gray-950 text-gray-100">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Touch-Friendly Button Component
```typescript
// Source: WCAG 2.5.5 Target Size guidelines
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base: minimum 44px touch target
          "inline-flex items-center justify-center rounded-lg font-medium",
          "min-h-[44px] min-w-[44px]",
          "transition-colors focus-visible:outline-none focus-visible:ring-2",
          "disabled:pointer-events-none disabled:opacity-50",
          // Variants
          variant === 'primary' && "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
          variant === 'secondary' && "bg-gray-800 text-gray-100 hover:bg-gray-700 active:bg-gray-600",
          variant === 'ghost' && "bg-transparent hover:bg-gray-800 active:bg-gray-700",
          // Sizes
          size === 'sm' && "px-3 py-2 text-sm",
          size === 'md' && "px-4 py-2",
          size === 'lg' && "px-6 py-3 text-lg",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Create React App | Vite | CRA deprecated Feb 2025 | Use `npm create vite@latest` |
| Tailwind v3 JS config | Tailwind v4 CSS config | Jan 2025 | Use `@import "tailwindcss"` |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` | Tailwind v4 | Single import replaces three directives |
| Redux Toolkit | Zustand (for UI state) | 2024-2025 | Simpler API, less boilerplate |
| `ml-*`/`mr-*` for RTL | Logical properties `ms-*`/`me-*` | Tailwind v3.3+ | Automatic RTL support |
| `darkMode: 'class'` in JS | `@custom-variant dark` in CSS | Tailwind v4 | CSS-first configuration |

**Deprecated/outdated:**
- **Create React App (CRA):** Officially deprecated Feb 2025, use Vite
- **tailwind.config.js:** Tailwind v4 prefers CSS-first config with `@theme` directive
- **`@tailwind` directives:** Replaced by `@import "tailwindcss"`
- **`darkMode` in JS config:** Replaced by `@custom-variant dark` in CSS

## Open Questions

1. **React Router 7 Framework Mode vs Library Mode**
   - What we know: SPA mode with `ssr: false` is documented for framework mode
   - What's unclear: For simple declarative routing, library mode may be simpler
   - Recommendation: Start with library mode (BrowserRouter pattern), upgrade to framework mode if data loading features needed

2. **Production Deployment Strategy**
   - What we know: Vite can output to Flask static folder
   - What's unclear: Whether Flask should serve SPA or use separate hosting
   - Recommendation: Configure `build.outDir` to Flask static folder for simplicity in Phase 1; revisit for PWA deployment in Phase 5

## Sources

### Primary (HIGH confidence)
- [Vite Getting Started](https://vite.dev/guide/) - Current version 7.3.1, Node 20.19+ required
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode) - @custom-variant directive
- [React Router SPA Mode](https://reactrouter.com/how-to/spa) - ssr: false configuration
- [Vite Server Options](https://vite.dev/config/server-options) - Proxy configuration
- [WCAG 2.5.5 Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html) - 44x44px requirement

### Secondary (MEDIUM confidence)
- [Tailwind CSS v4 Migration Issues](https://github.com/tailwindlabs/tailwindcss/discussions/16517) - Common problems
- [React Router NavLink API](https://reactrouter.com/api/components/NavLink) - Active state styling
- [Zustand TypeScript Guide](https://zustand.docs.pmnd.rs/guides/beginner-typescript) - Type-safe stores
- [Vite + Flask Integration](https://medium.com/@colinatjku/integrating-flask-and-react-using-vite-for-development-and-nginx-in-production-a-microservices-9df7a21ca8f5) - Proxy patterns

### Tertiary (LOW confidence)
- [Tailwind CSS RTL Support](https://flowbite.com/docs/customize/rtl/) - Logical properties pattern (community resource)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified via official docs and releases
- Architecture: HIGH - Patterns from official documentation
- Pitfalls: HIGH - Verified via GitHub discussions and official upgrade guides

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stack is stable)
