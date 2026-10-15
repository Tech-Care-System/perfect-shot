# Component Strategy

## Design System Components (Shadcn/UI)

| Component | Usage                            |
| --------- | -------------------------------- |
| Button    | Shutter, Next Pose, Save, Retake |
| Sheet     | Settings drawer                  |
| Dialog    | Camera permission modal          |

## Custom Components

**1. CameraPreview**

- Purpose: Real-time camera feed
- Technology: `<video>` + getUserMedia API
- Props: `facingMode`, `onReady`, `onError`
- States: Loading, Active, Permission Denied, No Camera

**2. WireframeCanvas**

- Purpose: AI skeleton overlay on camera
- Technology: Canvas element (WebGL or 2D)
- Props: `landmarks`, `targetPose`, `matchScore`
- Visual: 3px stroke, color from matchScore
- Color Logic: score ≥ 0.9 = Green, ≥ 0.7 = Yellow, else Red

**3. FeedbackGlow**

- Purpose: Screen-edge glow for feedback
- Technology: CSS gradients + animations
- Props: `state: 'none' | 'far' | 'close' | 'match'`
- Animations: Yellow pulse, Green flash

**4. PoseHintCard**

- Purpose: Display pose name + action hint
- Visual: Semi-transparent (#1a1a1a/80), rounded-2xl
- Props: `poseName`, `actionHint`, `visible`
- Accessibility: `aria-live="polite"`

**5. ControlBar**

- Purpose: Bottom control bar with actions
- Layout: `[Next] [Shutter 64px] [Flip]`
- Visual: Fixed bottom, blur backdrop, 80px height
- Props: `onShutter`, `onNextPose`, `onFlipCamera`

**6. PreviewScreen**

- Purpose: Captured photo with Save/Retake
- Technology: Full-screen overlay
- Props: `imageUrl`, `onSave`, `onRetake`
- Accessibility: `role="dialog"`, focus trap

## Component Hierarchy

```
<App>
├── <CameraScreen>
│   ├── <CameraPreview />
│   ├── <WireframeCanvas />
│   ├── <FeedbackGlow />
│   ├── <PoseHintCard />
│   └── <ControlBar />
├── <PreviewScreen />
├── <PermissionDialog />
└── <SettingsSheet />
```

## Component Implementation Strategy

- Build custom components using Tailwind utility classes
- Use CSS variables for design tokens
- Follow Shadcn patterns for consistency
- Use `cva()` for component variants
- All components follow ARIA accessibility patterns

## Implementation Roadmap

| Phase       | Components                                  | Timeline |
| ----------- | ------------------------------------------- | -------- |
| **Phase 1** | CameraPreview, ControlBar, PreviewScreen    | Week 1-2 |
| **Phase 2** | WireframeCanvas, FeedbackGlow, PoseHintCard | Week 2-3 |
| **Phase 3** | PermissionDialog, SettingsSheet, Animations | Week 3-4 |

---
