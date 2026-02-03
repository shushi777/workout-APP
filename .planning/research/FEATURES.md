# Feature Landscape: Mobile Video Editing UX Patterns

**Domain:** Mobile Video Editing UI/UX
**Researched:** 2026-02-03
**Focus:** UX patterns that make mobile video editing feel smooth and intuitive
**Context:** React rebuild of workout video editor with timeline, cut points, and segment tagging

## Table Stakes

Features users expect in 2025/2026. Missing = app feels broken or amateurish.

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **44px+ Touch Targets** | iOS/Android HIG requirement; smaller targets cause mis-taps | Low | All interactive elements (buttons, timeline scrubber, cut point handles) must meet minimum |
| **Haptic Feedback on Key Actions** | Users expect tactile confirmation; absence feels "dead" | Low | Use for: cut point placement, segment selection, save confirmation. Keep subtle - avoid overuse |
| **Pinch-to-Zoom on Timeline** | Standard gesture from CapCut/InShot; users will try it instinctively | Medium | Essential for precise cut point adjustment on small screens |
| **Immediate Visual Feedback** | Every tap must show response within 100ms | Low | Button press states, loading indicators, selection highlights |
| **Swipe Gestures for Navigation** | Expected mobile pattern; tab navigation should support swipe | Low | Swipe between tabs (Upload/Editor/Library), swipe to dismiss drawers |
| **Bottom Sheet / Drawer Pattern** | Standard mobile pattern for contextual actions | Medium | Already implemented; ensure smooth animation (spring physics) |
| **Skeleton Loading States** | Perceived performance; prevents layout shift | Low | Show placeholder shapes while video thumbnails/metadata load |
| **Pull-to-Refresh** | Universal mobile pattern for list views | Low | Exercise library should support this |
| **Dark Theme** | Battery savings on OLED, reduced eye strain, user expectation | Low | Already planned; ensure sufficient contrast ratios (WCAG 2.1) |
| **Consistent Visual Language** | Inconsistency is top UX complaint | Medium | Design system with unified spacing, colors, typography, icons |
| **Error State Recovery** | Users need clear path forward when things fail | Low | Toast notifications with retry actions, not just error messages |
| **Progress Indicators for Long Operations** | Video processing can take time; silence = broken | Low | Determinate progress bars for uploads/exports, not spinners |

## Nice-to-Haves

Polish features that improve experience but aren't required for feature parity.

| Feature | Value Proposition | Complexity | Implementation Notes |
|---------|-------------------|------------|---------------------|
| **Optimistic UI Updates** | Instant perceived response; makes app feel faster | Medium | Apply for segment tagging saves, library updates. Rollback on server failure |
| **Undo/Redo with Shake Gesture** | Error recovery without cluttering UI | Medium | iOS pattern: shake to undo. Also provide explicit undo button |
| **Custom Haptic Patterns** | Differentiate actions by feel (cut vs select vs save) | Low | Different vibration patterns for different action types |
| **Micro-animations on State Changes** | Guides attention, confirms actions | Medium | Checkmark animation on save, subtle bounce on selection |
| **Gesture Hints on First Use** | Reduces learning curve for pinch-to-zoom, swipe | Low | One-time overlay or subtle animation showing available gestures |
| **Adaptive Layout for Landscape** | Better timeline editing with more horizontal space | High | Optional: detect orientation, reflow timeline to use full width |
| **Keyboard Avoidance** | Input fields shouldn't be covered by keyboard | Low | React Native handles this; web needs explicit handling |
| **Smooth 60fps Animations** | Professional feel; jank is immediately noticeable | High | Use CSS transforms, avoid layout thrashing, test on low-end devices |
| **Contextual Quick Actions** | Long-press on segment for quick delete/duplicate | Medium | Reduces taps for common operations |
| **Reduced Motion Support** | Accessibility for vestibular disorders | Low | Respect `prefers-reduced-motion` media query |

## Anti-Patterns

Things that hurt mobile UX. Explicitly avoid these.

| Anti-Pattern | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Icons Without Labels** | Users don't universally understand icons; causes confusion | Label all icons, or use icon+text combination. Tooltip on long-press for icon-only |
| **Thin/Light Fonts** | Poor readability on mobile screens, especially outdoors | Use medium/regular weight minimum; test in bright lighting conditions |
| **Nested Navigation (3+ levels)** | Users lose context, can't find their way back | Flat navigation with bottom tabs; drawer for secondary actions only |
| **Custom Gestures Without Hints** | Users won't discover non-standard interactions | Stick to platform conventions; if custom, provide onboarding |
| **Blocking Operations Without Feedback** | User thinks app is frozen | Always show progress; allow cancellation for long operations |
| **Aggressive Haptics** | Annoying, drains battery, users disable all haptics | Subtle, purposeful haptics only; test with real users |
| **Forcing Landscape Mode** | Breaks user's grip, annoying for quick edits | Support both orientations; adapt layout appropriately |
| **Horizontal Scroll Without Indication** | Content gets missed; users don't know to scroll | Use pagination dots, peek effect, or vertical layout instead |
| **Auto-playing Video with Sound** | Startles users, social embarrassment | Always start muted; show clear unmute control |
| **Modal Dialogs for Everything** | Interrupts flow, requires dismissal | Use inline expansion, bottom sheets, or toast notifications |
| **Inconsistent Tap Feedback** | Some buttons respond, others don't; feels broken | Every tappable element needs visual AND haptic feedback |
| **Multi-step Processes Without Progress** | Users don't know how much longer or if they're stuck | Show step indicators (1/3, 2/3, 3/3) or progress percentage |
| **Disabling Back Button/Gesture** | Violates platform expectations; trapped feeling | Always allow back navigation; prompt to save unsaved work |
| **Text Input Without Clear Button** | Tedious to clear long text on mobile | Add X button to clear text fields; especially for search |

## Video Editor Specific Patterns

Patterns specific to video editing apps, learned from CapCut/InShot analysis.

### Timeline Interaction

| Pattern | Description | Priority |
|---------|-------------|----------|
| **Color-coded Tracks** | Different colors for video, audio, effects help visual organization | High |
| **Pinch-to-Zoom Timeline** | Essential for precise frame-level editing on small screens | High |
| **Drag Handles on Cut Points** | Large, visible handles (not just circles) for easy grabbing | High |
| **Time Indicator on Drag** | Show timestamp while dragging cut points | High |
| **Snap to Playhead** | Cut points snap to current playhead position | Medium |
| **Waveform Visualization** | Audio waveform helps identify scene boundaries | Medium |
| **Thumbnail Strip** | Video frame thumbnails on timeline for visual reference | High (complexity: High) |

### Playback Controls

| Pattern | Description | Priority |
|---------|-------------|----------|
| **Large Play/Pause Area** | Tap anywhere on video to toggle, not just small button | High |
| **Scrubbing with Preview** | Show frame preview while scrubbing timeline | High |
| **Frame-by-Frame Controls** | +/- frame buttons for precise positioning | Medium |
| **Playback Speed Control** | 0.5x, 1x, 2x for reviewing content | Low |
| **Loop Segment Playback** | Repeat selected segment for review | Medium |

### Segment Management

| Pattern | Description | Priority |
|---------|-------------|----------|
| **Visual Segment Cards** | Cards with thumbnail, duration, exercise name | High |
| **Completion Indicators** | Clear visual for tagged vs untagged segments | High |
| **Reorder via Drag** | If applicable, drag to reorder segments | Low |
| **Batch Operations** | Select multiple segments for bulk tagging | Low |

## Feature Dependencies

```
Touch Targets (44px+) ─────────────────────────────────────┐
                                                           │
Haptic Feedback ──────────────────────────────────────────┤
                                                           │
Visual Feedback (100ms) ──────────────────────────────────┤
                                                           ├──► Core Touch Experience
Pinch-to-Zoom ────────────────────────────────────────────┤
                                                           │
Swipe Gestures ───────────────────────────────────────────┘

Skeleton Loading ─────────────────────────────────────────┐
                                                           │
Progress Indicators ──────────────────────────────────────┤
                                                           ├──► Perceived Performance
Optimistic UI ────────────────────────────────────────────┤
                                                           │
60fps Animations ─────────────────────────────────────────┘

Bottom Sheet ─────────────────────────────────────────────┐
                                                           │
Consistent Visual Language ───────────────────────────────┼──► Polish & Professionalism
                                                           │
Micro-animations ─────────────────────────────────────────┘
```

## Rebuild Priority Recommendation

For React rebuild with feature parity goal:

### Phase 1: Core Touch Experience (Must Have)
1. **44px+ touch targets** - Foundation; affects all components
2. **Immediate visual feedback** - Button states, selection highlights
3. **Bottom sheet pattern** - Already exists; ensure smooth in React
4. **Consistent visual language** - Establish design tokens early

### Phase 2: Timeline UX (Critical for Editor)
1. **Pinch-to-zoom on timeline** - Essential for usability
2. **Drag handles with time indicator** - Makes cut point editing usable
3. **Color-coded segments** - Visual organization
4. **Large play/pause area** - Touch-friendly video controls

### Phase 3: Polish & Feel
1. **Haptic feedback** - Adds tactile quality
2. **Skeleton loading states** - Perceived performance
3. **Micro-animations** - Professional feel
4. **Error state recovery** - Robust UX

### Defer to Post-Rebuild
- Thumbnail strip on timeline (high complexity)
- Waveform visualization (medium complexity)
- Optimistic UI (requires backend coordination)
- Gesture hints/onboarding (need stable UI first)

## Confidence Assessment

| Area | Confidence | Rationale |
|------|------------|-----------|
| Touch targets/haptics | HIGH | Well-documented in platform guidelines (iOS HIG, Material Design) |
| Timeline patterns | MEDIUM | Based on CapCut/InShot analysis; may need validation with users |
| Anti-patterns | HIGH | Consistent across multiple UX research sources |
| Priority ordering | MEDIUM | Based on complexity estimates; may shift during implementation |

## Sources

### Mobile UX Best Practices (2025-2026)
- [UI UX Best Practices 2025/2026 - WhizzBridge](https://www.whizzbridge.com/blog/ui-ux-best-practices-2025)
- [Mobile App UI/UX Design Trends 2025-2026 - SPDLoad](https://spdload.com/blog/mobile-app-ui-ux-design-trends/)
- [UX Design Trends 2026 - UX Design Institute](https://www.uxdesigninstitute.com/blog/the-top-ux-design-trends-in-2026/)
- [Mobile App Design Best Practices 2025 - Wezom](https://wezom.com/blog/mobile-app-design-best-practices-in-2025)

### Video Editor UX Analysis
- [CapCut UI Analysis - Reviewing CapCut's User Interface](https://cardsrealm.com/en-us/articles/reviewing-capcuts-user-interface-intuitive-design-for-seamless-editing)
- [CapCut vs InShot Comparison 2026 - Filmora](https://filmora.wondershare.com/video-editor-review/inshot-vs-capcut.html)
- [How to Build an App Like CapCut - Banuba](https://www.banuba.com/blog/how-to-build-an-app-like-capcut-with-video-editor-sdk)

### Haptic Feedback
- [2025 Guide to Haptics - Saropa](https://saropa-contacts.medium.com/2025-guide-to-haptics-enhancing-mobile-ux-with-tactile-feedback-676dd5937774)
- [Android Haptics Design Principles](https://developer.android.com/develop/ui/views/haptics/haptics-principles)
- [Haptic Feedback in Mobile Apps - 7T](https://7t.ai/blog/what-is-haptic-feedback-in-a-mobile-app/)

### Optimistic UI
- [Understanding Optimistic UI - LogRocket](https://blog.logrocket.com/understanding-optimistic-ui-react-useoptimistic-hook/)
- [React useOptimistic Hook - Official Docs](https://react.dev/reference/react/useOptimistic)

### UX Anti-Patterns
- [Common UX Mistakes - UX Planet](https://uxplanet.org/common-ux-mistakes-everyone-still-makes-2-0-c320bb07b21d)
- [Top 10 Application Design Mistakes - Nielsen Norman Group](https://www.nngroup.com/articles/top-10-application-design-mistakes/)
- [Top 17 UX Mistakes in Mobile App Design - Cigen](https://www.cigen.io/insights/top-17-ux-mistakes-in-mobile-app-design-and-how-to-dodge-them)
