# UX Consistency Patterns

## Button Hierarchy

| Level         | Visual                         | Usage                  |
| ------------- | ------------------------------ | ---------------------- |
| **Primary**   | 64px White circle              | Shutter button         |
| **Secondary** | 44px #3f3f46 circle, icon-only | Next Pose, Flip Camera |
| **Tertiary**  | Text button, #a1a1aa           | Settings link          |

**Button States:**

- Default: Normal appearance
- Hover: Slight brightness increase (desktop)
- Pressed: Scale 0.95 + slight darken
- Disabled: Opacity 0.5, no interaction
- Loading: Spinner replaces icon

**Touch Targets:** Min 44x44px, Primary 64x64px, spacing ≥16px

## Feedback Patterns

**Pose Match Feedback:**

| State          | Visual                   | Audio      | Haptic          |
| -------------- | ------------------------ | ---------- | --------------- |
| Far (Red)      | Red glow, low opacity    | -          | -               |
| Close (Yellow) | Yellow glow, pulsing     | -          | -               |
| Match (Green)  | Green glow + white flash | "Ding!" 🔔 | Short vibration |

**Inline Prompts:**

- Guidance: #a1a1aa text ("Lean back, arm on armrest")
- Correction: #f59e0b text ("Tilt head slightly left")
- Encouragement: #f59e0b text ("Almost there!")
- Success: #10b981 text, brief ("Perfect!")

## Loading States

| Scenario          | Visual                          | Duration        |
| ----------------- | ------------------------------- | --------------- |
| App startup       | Dark screen → Camera fade in    | < 1s            |
| AI models loading | Camera + "Preparing AI..." text | 2-3s first load |
| Pose analysis     | Subtle wireframe flicker        | < 500ms         |
| Saving photo      | Button shows spinner            | < 500ms         |

## Error States

| Error             | Message                                 | Recovery Action        |
| ----------------- | --------------------------------------- | ---------------------- |
| Camera denied     | "Camera access needed to take photos"   | "Open Settings" button |
| Pose not detected | "Step closer to the camera"             | Inline guidance        |
| Save failed       | "Couldn't save. Try again?"             | Retry button           |
| Low light         | "Turn on more light for better results" | Inline hint            |

**Error Rules:**

- Never block camera with full-screen errors
- Use friendly language, not technical jargon
- Always provide recovery action
- Errors appear as overlays, not modals

## Modal Patterns

| Type              | Usage               | Behavior                          |
| ----------------- | ------------------- | --------------------------------- |
| Permission Dialog | First camera access | System dialog + custom fallback   |
| Preview Screen    | After capture       | Full-screen overlay, ESC to close |
| Settings Sheet    | App settings        | Bottom sheet (Shadcn Sheet)       |

**Modal Rules:**

- Focus trap (Tab stays within modal)
- ESC to close (keyboard dismissal)
- Backdrop click closes (except Preview)
- No modal stacking (max 1 at a time)

## Navigation Patterns

- **Single-screen app:** No global navigation bar
- **Mode switching:** Front/Back camera via button
- **Back action:** Preview → Camera (swipe or button)
- **Settings access:** Icon → Sheet slide up

---
