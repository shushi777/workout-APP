# Phase 4: Exercise Library - Research

**Researched:** 2026-02-03
**Domain:** React 19 grid-based exercise library with search/filter, video playback, and CRUD operations
**Confidence:** HIGH

## Summary

Phase 4 implements a comprehensive exercise library page in React 19 with TypeScript and Tailwind CSS 4. The library displays saved exercises in a responsive grid, supports real-time search/filter by name/muscle groups/equipment, enables video playback with autoplay-on-scroll, and provides edit/delete functionality through modal dialogs.

The existing HTML/JS implementation (exercise-library.html/js) provides a working reference, but the React implementation will leverage modern patterns: `useDeferredValue` for non-blocking search, Intersection Observer for scroll-triggered video autoplay, shadcn/ui Dialog components for edit/delete modals, and Tailwind CSS responsive grid with mobile-first breakpoints.

Backend API endpoints already exist (`GET /api/exercises`, `PUT /api/exercises/:id`, `DELETE /api/exercises/:id`), so this phase focuses purely on frontend implementation.

**Primary recommendation:** Use native HTML5 `<video>` elements with Intersection Observer for scroll-triggered autoplay, `useDeferredValue` for search filtering, shadcn/ui Dialog for modals, and Tailwind grid with mobile-first breakpoints. Avoid heavy video player libraries since we only need simple muted loop playback.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | UI framework | Already in project, latest stable |
| TypeScript | ~5.9.3 | Type safety | Already configured |
| Tailwind CSS | 4.1.18 | Styling with grid utilities | Already in project with v4 features |
| Zustand | 5.0.11 | State management | Already used for timeline/upload stores |
| React Router | 7.13.0 | Navigation | Already in project for routing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-dialog | Latest | Accessible modal dialogs | Edit/delete confirmation modals (via shadcn/ui pattern) |
| clsx + tailwind-merge | Already installed | className utilities | Conditional styling (cn() pattern already established) |
| lucide-react | 0.563.0 | Icon library | UI icons (already in project) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<video>` | react-player | react-player adds 50KB+ for features we don't need (YouTube, Vimeo, etc.). Native video sufficient for muted loop playback |
| `useDeferredValue` | Lodash debounce | useDeferredValue is React-native, respects concurrent rendering, no external dependency |
| Tailwind grid | react-grid-layout | react-grid-layout for drag-drop repositioning (not needed). Tailwind grid simpler for static responsive layout |
| Intersection Observer | react-intersection-observer | Library adds abstraction layer. Native API is simple enough for our use case |

**Installation:**
```bash
# No new dependencies needed - all libraries already installed
# Only need to add shadcn/ui Dialog component via CLI:
npx shadcn@latest add dialog
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── pages/
│   └── LibraryPage.tsx          # Main exercise library page
├── components/
│   ├── library/                 # NEW: Exercise library components
│   │   ├── ExerciseCard.tsx     # Individual exercise card with video
│   │   ├── ExerciseGrid.tsx     # Grid layout container
│   │   ├── SearchFilters.tsx    # Search bar + filter chips
│   │   ├── EditExerciseDialog.tsx   # Edit modal
│   │   └── DeleteConfirmDialog.tsx  # Delete confirmation
│   └── ui/
│       ├── dialog.tsx            # shadcn/ui Dialog (ADD)
│       └── card.tsx              # shadcn/ui Card (ADD)
├── stores/
│   └── exerciseStore.ts          # NEW: Exercise library state
├── hooks/
│   └── useExercises.ts           # NEW: Exercise data fetching
└── lib/
    └── api.ts                    # ADD: Exercise API functions
```

### Pattern 1: Deferred Search Filtering (React 19 Concurrent Feature)
**What:** Use `useDeferredValue` to defer expensive filter operations without blocking input
**When to use:** Search/filter operations on large lists (100+ exercises)
**Example:**
```typescript
// Source: https://react.dev/reference/react/useDeferredValue
function SearchFilters({ exercises }) {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);

  // Expensive filtering uses deferred value
  const filtered = useMemo(() =>
    exercises.filter(ex => ex.name.includes(deferredSearch)),
    [exercises, deferredSearch]
  );

  // Input updates immediately (non-blocking)
  return <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />;
}
```

**Why this works:** Typing updates `searchTerm` immediately (urgent update), but filtering uses `deferredSearch` (deferred update). React prioritizes input responsiveness over filter recalculation. Combine with `useMemo` to prevent unnecessary recalculations.

**Confidence:** HIGH - React 19 official pattern, verified in official docs.

### Pattern 2: Intersection Observer Video Autoplay
**What:** Play video when scrolled into view, pause when scrolled out
**When to use:** Grid of videos where only visible videos should play
**Example:**
```typescript
// Source: https://blog.logrocket.com/build-custom-tiktok-autoplay-react-hook-intersection-observer/
function ExerciseCard({ videoUrl }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play();
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 } // 50% visible triggers play
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return <video ref={videoRef} muted loop playsInline src={videoUrl} />;
}
```

**Key attributes:**
- `muted` — Required for autoplay in modern browsers
- `loop` — Video repeats when finished
- `playsInline` — Prevents fullscreen on iOS
- `threshold: 0.5` — Trigger when 50% of video is visible

**Confidence:** HIGH - Standard pattern for TikTok-style autoplay, widely used.

### Pattern 3: Shadcn/UI Dialog for Modals
**What:** Accessible modal dialogs built on Radix UI with Tailwind styling
**When to use:** Edit exercise form, delete confirmation
**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/dialog
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function EditExerciseDialog({ exercise, open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ערוך תרגיל</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {/* Form fields */}
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Key features:**
- Focus trap and keyboard navigation (Esc to close)
- Backdrop click closes dialog
- Accessible ARIA attributes
- Tailwind CSS styling with custom classes

**Confidence:** HIGH - Official shadcn/ui pattern, already used in project for drawer.

### Pattern 4: Tailwind Responsive Grid (Mobile-First)
**What:** CSS Grid with Tailwind breakpoint modifiers for responsive layouts
**When to use:** Exercise card grid that adapts from 1 column (mobile) to 4 columns (desktop)
**Example:**
```typescript
// Source: https://tailwindcss.com/docs/responsive-design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {exercises.map(ex => <ExerciseCard key={ex.id} exercise={ex} />)}
</div>
```

**Breakpoints (mobile-first):**
- Default (no prefix): All screen sizes (mobile)
- `md:` — 768px and up (tablet)
- `lg:` — 1024px and up (laptop)
- `xl:` — 1280px and up (desktop)
- `2xl:` — 1536px and up (large desktop)

**Matches existing HTML implementation:**
```css
/* exercise-library.css lines 258-281 */
.exercise-grid {
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); /* Default */
}
@media (max-width: 768px) { grid-template-columns: 1fr; }
@media (min-width: 1200px) { grid-template-columns: repeat(3, 1fr); }
@media (min-width: 1600px) { grid-template-columns: repeat(4, 1fr); }
```

**Confidence:** HIGH - Standard Tailwind pattern, matches existing design.

### Pattern 5: Zustand Store for Exercise State
**What:** Centralized state management for exercises with async actions
**When to use:** Manage exercises list, loading states, filter state
**Example:**
```typescript
// Source: Project pattern from timelineStore.ts and uploadStore.ts
import { create } from 'zustand';

interface ExerciseStore {
  // State
  exercises: Exercise[];
  isLoading: boolean;
  searchTerm: string;
  selectedMuscles: Set<string>;
  selectedEquipment: Set<string>;

  // Actions
  fetchExercises: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  toggleMuscleFilter: (muscle: string) => void;
  updateExercise: (id: number, data: UpdateData) => Promise<void>;
  deleteExercise: (id: number) => Promise<void>;
}

export const useExerciseStore = create<ExerciseStore>((set, get) => ({
  exercises: [],
  isLoading: false,
  searchTerm: '',
  selectedMuscles: new Set(),
  selectedEquipment: new Set(),

  fetchExercises: async () => {
    set({ isLoading: true });
    const data = await fetchExercisesAPI();
    set({ exercises: data.exercises, isLoading: false });
  },

  setSearchTerm: (term) => set({ searchTerm: term }),

  toggleMuscleFilter: (muscle) => {
    const muscles = new Set(get().selectedMuscles);
    muscles.has(muscle) ? muscles.delete(muscle) : muscles.add(muscle);
    set({ selectedMuscles: muscles });
  },

  updateExercise: async (id, data) => {
    await updateExerciseAPI(id, data);
    await get().fetchExercises(); // Refresh list
  },

  deleteExercise: async (id) => {
    await deleteExerciseAPI(id);
    set(state => ({ exercises: state.exercises.filter(ex => ex.id !== id) }));
  },
}));
```

**Confidence:** HIGH - Established pattern in project (timelineStore, uploadStore).

### Anti-Patterns to Avoid

- **Don't use `useState` for search with immediate filtering** — Causes UI lag on large lists. Use `useDeferredValue` instead.
- **Don't render all videos with `autoPlay` attribute** — Browsers throttle/block multiple autoplay videos. Use Intersection Observer to play only visible ones.
- **Don't use inline `filter()` in render** — Recalculates on every render. Wrap in `useMemo` with dependencies.
- **Don't forget `muted` on autoplay videos** — Modern browsers require muted for autoplay to work.
- **Don't use CSS `@media` queries directly** — Use Tailwind breakpoint modifiers for consistency with project patterns.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal dialogs | Custom modal with backdrop/focus trap | shadcn/ui Dialog (Radix UI) | Accessibility (focus trap, keyboard nav, ARIA), browser compatibility, mobile touch handling |
| Video lazy loading | Custom scroll listeners | Intersection Observer API | Native browser API, better performance, automatic cleanup |
| Responsive grid | Custom breakpoint calculations | Tailwind grid + breakpoints | Consistent with project, less code, mobile-first |
| Search debouncing | Custom setTimeout logic | `useDeferredValue` hook | React-native concurrent feature, respects React lifecycle, no cleanup needed |
| Form validation | Custom validation logic | Existing AutocompleteChips pattern | Already tested in timeline editor, consistent UX |

**Key insight:** The existing HTML/JS implementation (exercise-library.js) provides a working reference for features and UX patterns, but don't copy its vanilla JS patterns. Use React 19 concurrent features (`useDeferredValue`), native browser APIs (Intersection Observer), and project-established patterns (Zustand stores, shadcn/ui components).

## Common Pitfalls

### Pitfall 1: Video Memory Leaks with Multiple Players
**What goes wrong:** Creating many video elements without cleanup causes memory leaks and browser crashes
**Why it happens:** Video elements hold references to media buffers that aren't garbage collected until explicitly released
**How to avoid:**
- Use Intersection Observer to pause off-screen videos
- Limit number of simultaneously playing videos (one at a time pattern)
- Clean up observers in `useEffect` return function
```typescript
useEffect(() => {
  const observer = new IntersectionObserver(/* ... */);
  observer.observe(videoRef.current);
  return () => observer.disconnect(); // CRITICAL: cleanup
}, []);
```
**Warning signs:** Browser DevTools shows increasing memory usage, videos stutter or fail to play

### Pitfall 2: Filter State Update Causes Input Lag
**What goes wrong:** Typing in search box feels laggy or drops characters
**Why it happens:** Expensive filter operation runs synchronously on every keystroke, blocking input updates
**How to avoid:**
- Use `useDeferredValue` to defer filter calculations
- Wrap filtered results in `useMemo` to prevent unnecessary recalculation
- **Don't use Lodash debounce** — it delays the input update itself, creating perceived lag
```typescript
// BAD: Input feels delayed
const debouncedSearch = useMemo(() => debounce(setSearchTerm, 300), []);

// GOOD: Input updates immediately, filtering is deferred
const deferredSearch = useDeferredValue(searchTerm);
const filtered = useMemo(() => filter(exercises, deferredSearch), [exercises, deferredSearch]);
```
**Warning signs:** Input feels unresponsive, characters appear delayed, typing feels "heavy"

### Pitfall 3: Video Autoplay Blocked by Browser
**What goes wrong:** Videos don't autoplay even when scrolled into view
**Why it happens:** Browsers block autoplay for unmuted videos (anti-annoyance policy)
**How to avoid:**
- Always set `muted` attribute on video elements
- Add `playsInline` for iOS compatibility
- Check browser console for autoplay policy errors
```typescript
<video
  ref={videoRef}
  muted          // REQUIRED for autoplay
  loop
  playsInline    // REQUIRED for iOS
  src={videoUrl}
/>
```
**Warning signs:** Videos show play button overlay but don't start, console shows "play() blocked" errors

### Pitfall 4: Grid Layout Shifts During Load
**What goes wrong:** Exercise cards jump around as images/videos load, causing poor UX
**Why it happens:** Cards don't have explicit height before content loads
**How to avoid:**
- Set explicit `aspect-ratio` on video containers
- Use CSS `min-height` on cards
- Show skeleton/placeholder until content loads
```typescript
// Video container with fixed aspect ratio
<div className="aspect-video w-full bg-gray-900">
  <video className="w-full h-full object-cover" src={videoUrl} />
</div>
```
**Warning signs:** Cards "pop" into place, scrollbar jumps, layout feels unstable

### Pitfall 5: Stale Closure in Intersection Observer
**What goes wrong:** Observer callback references old state/props values
**Why it happens:** Callback function captures values at creation time (closure)
**How to avoid:**
- Use refs for latest values in callbacks
- Recreate observer when dependencies change (via useEffect deps)
```typescript
// BAD: callback captures initial playingCards value
useEffect(() => {
  const observer = new IntersectionObserver(() => {
    console.log(playingCards); // Stale value!
  });
  // ...
}, []); // Empty deps - observer never recreates

// GOOD: Use ref for mutable value
const playingCardsRef = useRef(playingCards);
playingCardsRef.current = playingCards;

useEffect(() => {
  const observer = new IntersectionObserver(() => {
    console.log(playingCardsRef.current); // Always latest!
  });
  // ...
}, []);
```
**Warning signs:** State updates don't reflect in observer callbacks, videos don't stop playing when expected

## Code Examples

Verified patterns from official sources:

### Fetching and Displaying Exercises
```typescript
// Source: Existing backend API pattern from server.py
// GET /api/exercises endpoint returns Exercise[] with muscle_groups and equipment arrays

interface Exercise {
  id: number;
  exercise_name: string;
  duration: number;
  video_url: string;
  thumbnail_url: string;
  muscle_groups: string[];
  equipment: string[];
  created_at: string;
}

// API function in lib/api.ts
export async function fetchExercises(params?: {
  search?: string;
  muscle_groups?: string[];
  equipment?: string[];
  page?: number;
  per_page?: number;
}): Promise<{ exercises: Exercise[]; muscle_groups: string[]; equipment: string[] }> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.muscle_groups) query.append('muscle_groups', params.muscle_groups.join(','));
  if (params?.equipment) query.append('equipment', params.equipment.join(','));
  if (params?.page) query.append('page', params.page.toString());
  if (params?.per_page) query.append('per_page', params.per_page.toString());

  const response = await fetch(`/api/exercises?${query.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch exercises');
  return response.json();
}

// Usage in component
const { data, isLoading } = useQuery({
  queryKey: ['exercises', searchTerm, selectedMuscles],
  queryFn: () => fetchExercises({
    search: searchTerm,
    muscle_groups: Array.from(selectedMuscles)
  }),
});
```

### Exercise Card with Video Autoplay
```typescript
// Source: Intersection Observer pattern from existing HTML implementation
// exercise-library.js lines 334-358

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

function ExerciseCard({ exercise, onEdit, onDelete }: ExerciseCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().then(() => setIsPlaying(true));
        } else if (!video.paused) {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all">
      {/* Video Container */}
      <div className="relative aspect-video bg-gray-900 cursor-pointer" onClick={() => videoRef.current?.play()}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
          src={exercise.video_url}
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="text-5xl">▶️</div>
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold">{exercise.exercise_name}</h3>
          <div className="flex gap-2">
            <button onClick={() => onEdit(exercise.id)} className="text-blue-500 hover:text-blue-600">
              ✏️
            </button>
            <button onClick={() => onDelete(exercise.id)} className="text-red-500 hover:text-red-600">
              🗑️
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-3">
          ⏱️ {formatDuration(exercise.duration)}
        </div>

        <div className="flex flex-wrap gap-2">
          {exercise.muscle_groups.map(mg => (
            <span key={mg} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              {mg}
            </span>
          ))}
          {exercise.equipment.map(eq => (
            <span key={eq} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
              {eq}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Search and Filter with useDeferredValue
```typescript
// Source: React 19 concurrent features
// https://react.dev/reference/react/useDeferredValue

function ExerciseLibrary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState<Set<string>>(new Set());
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set());

  const { exercises, muscleGroups, equipment } = useExerciseStore();

  // Defer expensive filter operations
  const deferredSearch = useDeferredValue(searchTerm);
  const deferredMuscles = useDeferredValue(selectedMuscles);
  const deferredEquipment = useDeferredValue(selectedEquipment);

  // Filter exercises (runs with deferred values)
  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const nameMatch = deferredSearch === '' ||
        ex.exercise_name.toLowerCase().includes(deferredSearch.toLowerCase());

      const muscleMatch = deferredMuscles.size === 0 ||
        ex.muscle_groups.some(mg => deferredMuscles.has(mg));

      const equipmentMatch = deferredEquipment.size === 0 ||
        ex.equipment.some(eq => deferredEquipment.has(eq));

      return nameMatch && muscleMatch && equipmentMatch;
    });
  }, [exercises, deferredSearch, deferredMuscles, deferredEquipment]);

  return (
    <div>
      {/* Search input updates immediately (urgent) */}
      <input
        type="text"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        placeholder="חפש תרגיל..."
        className="w-full p-3 border rounded-lg"
      />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mt-4">
        {muscleGroups.map(mg => (
          <button
            key={mg}
            onClick={() => {
              const muscles = new Set(selectedMuscles);
              muscles.has(mg) ? muscles.delete(mg) : muscles.add(mg);
              setSelectedMuscles(muscles);
            }}
            className={`px-3 py-1 rounded-full ${
              selectedMuscles.has(mg)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {mg}
          </button>
        ))}
      </div>

      {/* Grid displays filtered results (deferred) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
        {filteredExercises.map(ex => (
          <ExerciseCard key={ex.id} exercise={ex} />
        ))}
      </div>
    </div>
  );
}
```

### Edit Exercise Dialog
```typescript
// Source: shadcn/ui Dialog pattern + existing AutocompleteChips component

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AutocompleteChips } from "@/components/tagging/AutocompleteChips";

interface EditExerciseDialogProps {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: number, data: UpdateData) => Promise<void>;
}

function EditExerciseDialog({ exercise, open, onOpenChange, onSave }: EditExerciseDialogProps) {
  const [name, setName] = useState('');
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);

  // Populate form when exercise changes
  useEffect(() => {
    if (exercise) {
      setName(exercise.exercise_name);
      setMuscleGroups(exercise.muscle_groups);
      setEquipment(exercise.equipment);
    }
  }, [exercise]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise) return;

    await onSave(exercise.id, {
      exercise_name: name,
      muscle_groups: muscleGroups,
      equipment: equipment,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>ערוך תרגיל</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">שם התרגיל *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full p-3 border rounded-lg"
              placeholder="לדוגמה: סקוואט, שכיבות סמיכה"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">קבוצות שריר *</label>
            <AutocompleteChips
              suggestions={allMuscleGroups}
              selectedTags={muscleGroups}
              onAddTag={tag => setMuscleGroups([...muscleGroups, tag])}
              onRemoveTag={tag => setMuscleGroups(muscleGroups.filter(t => t !== tag))}
              placeholder="הקלד קבוצת שריר והקש Enter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">ציוד נדרש *</label>
            <AutocompleteChips
              suggestions={allEquipment}
              selectedTags={equipment}
              onAddTag={tag => setEquipment([...equipment, tag])}
              onRemoveTag={tag => setEquipment(equipment.filter(t => t !== tag))}
              placeholder="הקלד ציוד והקש Enter"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              שמור שינויים
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Delete Confirmation Dialog
```typescript
// Source: Dialog pattern + existing delete flow from exercise-library.js

function DeleteConfirmDialog({ exercise, open, onOpenChange, onConfirm }: DeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!exercise) return;
    setIsDeleting(true);

    try {
      await onConfirm(exercise.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('שגיאה במחיקת התרגיל');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <DialogTitle className="text-xl font-bold mb-2">
            האם אתה בטוח?
          </DialogTitle>
          <p className="text-gray-600 mb-6">
            התרגיל "<strong>{exercise?.exercise_name}</strong>" יימחק לצמיתות.
            <br />
            לא ניתן לבטל פעולה זו.
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              ביטול
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              {isDeleting ? 'מוחק...' : 'מחק'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Lodash debounce for search | `useDeferredValue` hook | React 18+ (2022) | No external dependency, respects concurrent rendering, better UX |
| `useCallback` + debounce | `useMemo` + `useDeferredValue` | React 18+ | Proper dependency tracking, no ESLint issues |
| Custom scroll listeners | Intersection Observer API | Native since 2016 | Better performance, automatic cleanup, widely supported |
| react-player library | Native `<video>` element | N/A | 50KB+ smaller bundle, simpler for basic playback |
| CSS Grid with media queries | Tailwind breakpoint modifiers | Project standard | Consistency, less custom CSS, mobile-first |
| Redux for state | Zustand | Project standard (2024+) | Simpler API, less boilerplate, TypeScript-first |

**Deprecated/outdated:**
- **react-intersection-observer**: Native Intersection Observer API is simple enough, no wrapper needed
- **Lodash debounce for search**: React 19's `useDeferredValue` is the modern approach
- **Custom modal implementations**: Radix UI (via shadcn/ui) handles accessibility and edge cases

## Open Questions

Things that couldn't be fully resolved:

1. **How many exercises can we display before performance degrades?**
   - What we know: Existing HTML implementation loads 100 exercises per page without issues
   - What's unclear: React render performance with 100+ video elements (even if paused)
   - Recommendation: Start with 100 per page (matching backend default `per_page=100`). Add pagination if performance issues occur. Monitor with React DevTools Profiler.

2. **Should we implement infinite scroll or pagination?**
   - What we know: Backend supports pagination (`page`, `per_page` params). Existing HTML loads all exercises at once.
   - What's unclear: User preference for workout app (infinite scroll vs traditional pagination)
   - Recommendation: Start with "Load More" button pattern (simpler than infinite scroll). Can upgrade to infinite scroll in later phase if needed.

3. **Do we need video thumbnails or can we show first frame?**
   - What we know: Backend returns `thumbnail_url` field. Existing HTML shows thumbnail with play overlay.
   - What's unclear: Video first frame load time vs thumbnail image load time
   - Recommendation: Use `thumbnail_url` if available (matches backend design). Fallback to video `poster` attribute with first frame if thumbnail missing.

4. **Should we debounce API calls for search or use client-side filtering?**
   - What we know: Backend supports `search` query parameter. Existing HTML filters client-side after loading all exercises.
   - What's unclear: Exercise library size (100 exercises? 1000 exercises?)
   - Recommendation: For Phase 4, use client-side filtering (load all exercises once, filter in memory with `useDeferredValue`). Backend search optimization can be added in later phase if library grows large.

## Sources

### Primary (HIGH confidence)
- [React useDeferredValue official docs](https://react.dev/reference/react/useDeferredValue) - Official React 19 API documentation
- [Tailwind CSS Responsive Design docs](https://tailwindcss.com/docs/responsive-design) - Official Tailwind breakpoint system
- [shadcn/ui Dialog component](https://ui.shadcn.com/docs/components/dialog) - Official shadcn/ui pattern
- [Intersection Observer API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) - Web standard API
- Existing codebase patterns: `timelineStore.ts`, `uploadStore.ts`, `AutocompleteChips.tsx`, `drawer.tsx`

### Secondary (MEDIUM confidence)
- [Build a custom TikTok autoplay React Hook with Intersection Observer - LogRocket](https://blog.logrocket.com/build-custom-tiktok-autoplay-react-hook-intersection-observer/)
- [React 19 useDeferredValue Deep Dive - DEV Community](https://dev.to/a1guy/react-19-usedeferredvalue-deep-dive-how-to-keep-your-ui-smooth-when-things-get-heavy-1gdl)
- [Tailwind CSS Responsive Grid - Mastering Responsive Layouts](https://codeparrot.ai/blogs/mastering-responsive-layouts-with-tailwind-grid-in-react)
- [Creating Responsive Layouts with Tailwind's Built-In Breakpoints - DEV Community](https://dev.to/hitesh_developer/creating-responsive-layouts-with-tailwinds-built-in-breakpoints-4e6d)

### Tertiary (LOW confidence)
- [Best React video player libraries of 2026 - Croct Blog](https://blog.croct.com/post/best-react-video-libraries) - Used for understanding landscape, not for implementation decisions
- [react-player GitHub](https://github.com/cookpete/react-player) - Considered but not recommended due to size/complexity

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, versions verified
- Architecture patterns: HIGH - Based on React 19 official docs, established project patterns, and existing HTML implementation
- Pitfalls: MEDIUM-HIGH - Based on common React video/performance issues and web search results
- Code examples: HIGH - Verified against official docs and existing codebase patterns

**Research date:** 2026-02-03
**Valid until:** 30 days (2026-03-05) - React/Tailwind stable, patterns unlikely to change
