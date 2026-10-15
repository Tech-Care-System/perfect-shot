# Design Direction

## Chosen Direction: Hybrid Modern

**Philosophy:** Balance of professionalism and friendliness — modern, approachable, clear.

**Key Design Decisions:**

- Full-screen camera with no chrome
- Floating semi-transparent pose hint card (bottom center)
- Docked control bar with glass effect
- Medium wireframe strokes (3px) with animated color transitions
- Soft gradient glow effects, not harsh

## Layout Specification

**Camera Preview:** 100% viewport, no borders

**Pose Hint Card:** Semi-transparent (#1a1a1a/80), rounded-2xl, centered bottom

**Control Bar:** Fixed bottom, 80px height, blur backdrop

**Control Layout:**

```
┌─────────────────────────────────────┐
│         [CAMERA PREVIEW]            │
│     ┌───────────────────────┐       │
│     │ 🎭 Confident Sit       │       │
│     │ Lean back, arm on...  │       │
│     └───────────────────────┘       │
├─────────────────────────────────────┤
│  [⟳]      ⬤ SHUTTER        [📷]  │
│  Next        (64px)       Flip   │
└─────────────────────────────────────┘
```

## Component Styles

| Component             | Specification                                            |
| --------------------- | -------------------------------------------------------- |
| **Shutter Button**    | 64px white circle, scale 0.95 on press                   |
| **Secondary Buttons** | 44px, icon-only, rounded-full, #3f3f46                   |
| **Pose Name**         | Inter 600, 20px, white                                   |
| **Action Hint**       | Inter 400, 14px, #a1a1aa                                 |
| **Pose Card**         | Semi-transparent (#1a1a1a/80), rounded-2xl, 16px padding |

## Animation Specifications

| Animation        | Duration   | Effect                               |
| ---------------- | ---------- | ------------------------------------ |
| Color transition | 300ms      | ease-in-out between Red/Yellow/Green |
| Glow pulse       | continuous | Subtle when Yellow                   |
| Match flash      | 150ms      | White overlay on Green               |
| Shutter press    | 100ms      | Scale 0.95 → 1.0                     |
| Pose hint appear | 200ms      | Fade + slide up                      |

## Design Rationale

**Why Hybrid Modern:**

1. **Gen Z Appeal** — Modern aesthetic without being boring
2. **First-time Clarity** — Visible controls and pose hints
3. **Pro Feel** — Dark theme, clean, uncluttered
4. **Balanced Feedback** — Visible but not overwhelming
5. **Event-ready** — Suitable for professional booth/stage context

---
