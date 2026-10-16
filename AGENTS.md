# Agent guidance

Perfect Shot is an on-device photography PWA built with the Next.js App Router, React, TypeScript, Tailwind CSS, Jotai, and MediaPipe running in a Web Worker.

Keep camera frames and pose processing on the device. Preserve clear camera permission flows, accessible controls, keyboard support, and reduced-motion behavior.

Use a minimum text size of 1rem, including navigation, buttons, captions, and small print. Reflow narrow layouts instead of shrinking text. Keep the camera guide a translucent white body contour, without visible tracking joints.

Carry the landing page identity through camera permission, live controls, settings, and photo review. Check the whole journey at phone and desktop widths. Keep calibration in the background so manual capture remains usable; keep pose hints clear of the shutter and restore keyboard focus after photo review closes.

ElevenLabs voice coaching is opt-in and sends only allowlisted instruction text. Keep provider credentials on the server and verify paid access with Stripe; never trust a client-supplied plan.

Ground landing-page claims in verified app behavior. Avoid unmeasured latency or capture-speed promises; pose matching requires a held pose, and performance varies by device. Label proposed brand choices separately from verified reference material.

Use the ECC workflow: understand the affected code and callers, make the smallest complete change, review it, and verify it. Use pnpm; the selected version is declared in `package.json`. Node.js 24 LTS is selected by `.node-version`.

Keep the MediaPipe WASM runtime in `public/wasm` and the pose model at `public/models/pose_landmarker_lite.task`. The install script copies WASM from the installed `@mediapipe/tasks-vision` package. Check `package.json` for current dependency versions and `node_modules/next/dist/docs` for version-matched Next.js documentation.

`pnpm typecheck` runs Next.js type generation before TypeScript checks. Useful checks:

Keep checks local: pre-commit runs lint and formatting on staged files; pre-push runs lint and unit tests. Do not add GitHub Actions CI/CD workflows. Run type checks, browser tests, and production builds manually when the change warrants them, and deploy through EasyPanel after pushing.

```sh
pnpm typecheck
pnpm lint
pnpm test --runInBand
pnpm test:e2e
pnpm validate
```

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
