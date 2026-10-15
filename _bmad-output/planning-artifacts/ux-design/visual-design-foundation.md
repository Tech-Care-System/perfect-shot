# Visual Design Foundation

## Color System

**Theme Philosophy:** "Pro Camera Feel with Playful Feedback"

**Base Colors (Dark Mode):**

| Token                | Hex     | Usage                    |
| -------------------- | ------- | ------------------------ |
| `--background`       | #0a0a0a | Main app background      |
| `--surface`          | #1a1a1a | Cards, panels, settings  |
| `--surface-elevated` | #242424 | Popups, overlays         |
| `--border`           | #2a2a2a | Subtle borders, dividers |

**Text Colors:**

| Token              | Hex     | Usage                |
| ------------------ | ------- | -------------------- |
| `--text-primary`   | #ffffff | Headings, pose names |
| `--text-secondary` | #a1a1aa | Action hints, labels |
| `--text-muted`     | #52525b | Disabled states      |

**Feedback Colors (Core UX):**

| Token                | Hex     | Name          | Usage            |
| -------------------- | ------- | ------------- | ---------------- |
| `--feedback-success` | #10b981 | Emerald Green | Pose match! ✓    |
| `--feedback-warning` | #f59e0b | Amber         | Almost there...  |
| `--feedback-error`   | #ef4444 | Rose Red      | Needs adjustment |

**Glow Effects (Camera Overlay):**

| Token            | CSS                                | Usage                |
| ---------------- | ---------------------------------- | -------------------- |
| `--glow-success` | `0 0 20px rgba(16, 185, 129, 0.5)` | Green match glow     |
| `--glow-warning` | `0 0 20px rgba(245, 158, 11, 0.5)` | Yellow progress glow |
| `--glow-error`   | `0 0 15px rgba(239, 68, 68, 0.4)`  | Subtle red glow      |

## Typography System

**Font:** Inter (Google Fonts) — Clean, modern, highly readable

**Type Scale:**

| Level              | Size            | Weight | Usage                                    |
| ------------------ | --------------- | ------ | ---------------------------------------- |
| `--font-pose-name` | 24px (1.5rem)   | 600    | Pose name: "Confident Sit"               |
| `--font-hint`      | 16px (1rem)     | 400    | Action hint: "Lean back, arm on armrest" |
| `--font-button`    | 14px (0.875rem) | 500    | Button labels                            |
| `--font-label`     | 12px (0.75rem)  | 400    | Small labels, settings                   |

**Font Loading:**

```html
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
  rel="stylesheet"
/>
```

## Spacing & Layout

**Grid:** 8px base unit (all spacing multiples of 8px)

| Token       | Value | Usage            |
| ----------- | ----- | ---------------- |
| `--space-1` | 4px   | Subtle gaps      |
| `--space-2` | 8px   | Icon spacing     |
| `--space-3` | 12px  | Compact padding  |
| `--space-4` | 16px  | Standard padding |
| `--space-6` | 24px  | Section margins  |
| `--space-8` | 32px  | Large gaps       |

**Layout Zones:**

```
┌─────────────────────────────────────┐
│           SAFE AREA TOP             │ 48px
├─────────────────────────────────────┤
│          CAMERA PREVIEW             │ Flex fill
│     ┌───────────────────────┐       │
│     │   POSE HINT OVERLAY   │       │ 80px offset
│     └───────────────────────┘       │
├─────────────────────────────────────┤
│  [Next]    ⬤ SHUTTER      [Flip]   │ 100px controls
└─────────────────────────────────────┘
│         SAFE AREA BOTTOM            │ env(safe-area)
```

**Z-Index Map:**

| Layer         | Z-Index | Content                    |
| ------------- | ------- | -------------------------- |
| Camera Video  | 1       | Background video stream    |
| Wireframe     | 10      | AI skeleton overlay        |
| Feedback Glow | 20      | Color glow effects         |
| Pose Hint     | 50      | Text overlay               |
| Controls      | 100     | Shutter, Next Pose buttons |
| Modal         | 1000    | Settings, permissions      |

**Mobile Constraints:**

- Min touch target: 44x44px (iOS HIG)
- Shutter button: 64x64px (primary action)
- Edge margin: 24px
- Portrait orientation locked

## Accessibility

**Contrast Ratios (WCAG AA):**

| Pair                      | Ratio  | Pass   |
| ------------------------- | ------ | ------ |
| White on #0a0a0a          | 19.6:1 | ✅ AAA |
| #a1a1aa on #0a0a0a        | 7.4:1  | ✅ AAA |
| Green #10b981 on #0a0a0a  | 8.3:1  | ✅ AAA |
| Yellow #f59e0b on #0a0a0a | 6.8:1  | ✅ AA  |

**Multimodal Feedback:**
All critical feedback uses 2+ channels (Visual + Audio + Haptic)
No color-only signals for essential information

**Motion:**

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
  }
}
```

---
