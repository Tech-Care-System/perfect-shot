# Responsive Design & Accessibility

## Responsive Strategy

**Approach:** Mobile-first (camera app = primarily mobile)

| Device      | Strategy                                      | Priority   |
| ----------- | --------------------------------------------- | ---------- |
| **Mobile**  | Primary — Portrait locked, full-screen camera | ⭐⭐⭐⭐⭐ |
| **Tablet**  | Same as mobile, larger touch targets          | ⭐⭐⭐     |
| **Desktop** | Centered container, webcam support (future)   | ⭐⭐       |

## Breakpoint Strategy

| Size        | Breakpoint     | Description            |
| ----------- | -------------- | ---------------------- |
| **Mobile**  | < 640px        | Primary target, phones |
| **Tablet**  | 640px - 1023px | Large phones, tablets  |
| **Desktop** | ≥ 1024px       | Webcam mode (future)   |

**Responsive Behaviors:**

- Mobile: Full viewport camera, 80px control bar
- Tablet: Full viewport, 88px control bar (larger buttons)
- Desktop: Centered container (max 500px width)

## Accessibility Strategy

**Target:** WCAG 2.1 Level AA

**Visual Accessibility:**

- All text meets 4.5:1 contrast ratio (most AAA)
- Multimodal feedback (color + audio + haptic)
- Supports 200% text scaling (rem units)
- Focus indicators visible on all interactive elements

**Motor Accessibility:**

- Touch targets: min 44x44px, primary 64x64px
- No timeout on pose matching
- Manual shutter always available (override)
- Spacing ≥16px between targets

**Screen Reader Accessibility:**

- Pose hints use `aria-live="polite"`
- All buttons have ARIA labels
- Match status announced
- Semantic HTML structure

**Cognitive Accessibility:**

- Clear, friendly language (no jargon)
- Gradient feedback (forgiving, not binary fail)
- Consistent patterns throughout
- "Step closer" not "Landmarks not detected"

## Motion Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  .feedback-glow {
    animation: none;
  }
  .pose-hint {
    transition: none;
  }
  .match-indicator {
    opacity: 1;
  }
}
```

## Testing Strategy

**Device Testing:**

- iPhone SE (smallest target)
- iPhone 14 Pro (modern standard)
- Pixel 7 (Android)
- iPad (tablet)
- Desktop Chrome DevTools

**Accessibility Testing:**

- axe DevTools (automated audit)
- Lighthouse (a11y score)
- VoiceOver (iOS/Mac screen reader)
- TalkBack (Android screen reader)
- Sim Daltonism (color blindness simulation)

**Checklist:**

- [ ] All touch targets ≥ 44x44px
- [ ] All text meets contrast ratio
- [ ] Keyboard navigation works (Tab, Enter, ESC)
- [ ] Screen reader announces pose hints
- [ ] Reduced motion preference respected
- [ ] Tested on real devices (not just simulator)
