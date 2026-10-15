# Design System Foundation

## Design System Choice — Validated via Comparative Analysis

**Selected:** Tailwind CSS + Shadcn/UI

**Comparative Analysis Results:**

| Option               | Weighted Score |
| -------------------- | -------------- |
| ✅ Tailwind + Shadcn | **9.50/10**    |
| Vanilla CSS          | 8.05/10        |
| Chakra UI            | 7.60/10        |
| Mantine              | 7.55/10        |
| MUI                  | 6.50/10        |

**Scoring Criteria (Weights):**

- Dark Mode Quality (20%) — Essential for Gen Z aesthetic
- Bundle Size (20%) — PWA performance target
- Camera App Flexibility (20%) — Custom overlays on video/canvas
- Development Speed (15%) — 3-5 week timeline
- Learning Curve (10%), Component Quality (10%), Community/Docs (5%)

**Why Tailwind + Shadcn Wins:**

- Perfect scores on Bundle Size, Camera Flexibility, Dark Mode
- Only imports what you use (no bloat)
- No opinionated layout that conflicts with camera UI
- Copy-paste components = fast development

## Component Strategy

**From Shadcn/UI (Pre-built):**

| Component | Usage                           |
| --------- | ------------------------------- |
| Button    | Shutter, Next Pose, Save/Retake |
| Sheet     | Settings drawer                 |
| Toast     | Pose prompts                    |
| Dialog    | Camera permission modal         |

**Custom Components (Build):**

| Component        | Why Custom                              |
| ---------------- | --------------------------------------- |
| Camera Preview   | Core — uses `<video>` + getUserMedia    |
| Wireframe Canvas | Core — WebGL overlay for pose skeleton  |
| Feedback Overlay | Core — Green/Yellow/Red glow animations |
| Pose Hint        | Core — pose name + action hint display  |

## Design Tokens

**Colors (Dark Mode):**

| Token              | Value   | Usage                  |
| ------------------ | ------- | ---------------------- |
| `--background`     | #0a0a0a | Main background        |
| `--surface`        | #1a1a1a | Cards, panels          |
| `--border`         | #2a2a2a | Subtle borders         |
| `--primary`        | #10b981 | Success/match (Green)  |
| `--warning`        | #f59e0b | Almost there (Yellow)  |
| `--destructive`    | #ef4444 | Needs adjustment (Red) |
| `--text-primary`   | #ffffff | Main text              |
| `--text-secondary` | #a1a1aa | Secondary text         |

**Typography:**

- Font: Inter (Google Fonts)
- Prompt text: 18px (1.125rem)
- Labels: 14px (0.875rem)

**Spacing:**

- Safe area: `env(safe-area-inset-bottom)` for iPhone
- Controls: 16px padding
- Screen edge: 24px margin

## Implementation Approach

1. Initialize Next.js with Tailwind CSS
2. Install Shadcn/UI CLI: `npx shadcn-ui@latest init`
3. Add only needed components: `npx shadcn-ui@latest add button sheet toast dialog`
4. Configure dark mode as default in tailwind.config.js
5. Create custom camera/overlay components
6. Define CSS variables in globals.css

## Risk Mitigation (Pre-mortem Analysis)

**Tailwind Hygiene:**

- [ ] Extract reusable components (no class soup)
- [ ] Use CSS variables for design tokens
- [ ] Use `cva()` for component variants

**Shadcn Integration:**

- [ ] Define z-index map (Camera=1, Wireframe=10, Controls=100, Modals=1000)
- [ ] Customize components for camera/dark context
- [ ] Test on real mobile devices before finalizing

**Dark Mode:**

- [ ] Force dark mode globally (`<html class="dark">`)
- [ ] Audit all components for dark variants
- [ ] Use only design token colors, no hardcoded values

**Performance:**

- [ ] Verify Tailwind purge config paths
- [ ] Tree-shake all imports (icons, components)
- [ ] Run bundle analyzer before deploy
- [ ] Only import: Button, Sheet, Toast, Dialog

**iOS Safari:**

- [ ] Test on real iPhone from day 1
- [ ] Avoid CSS transform on video elements
- [ ] Disable Shadcn transitions on camera overlays
- [ ] Add `will-change` hints for animations

---
