# Agent guidance

AI Perfect Shot is an on-device photography PWA built with the Next.js App Router, React, TypeScript, Tailwind CSS, Jotai, and MediaPipe running in a Web Worker.

Keep camera frames and pose processing on the device. Preserve clear camera permission flows, accessible controls, keyboard support, and reduced-motion behavior.

Use the ECC workflow: understand the affected code and callers, make the smallest complete change, review it, and verify it. Use pnpm; the selected version is declared in `package.json`. Node.js 24 LTS is selected by `.node-version`.

Keep the MediaPipe WASM runtime in `public/wasm` and the pose model at `public/models/pose_landmarker_lite.task`. The install script copies WASM from the installed `@mediapipe/tasks-vision` package. Check `package.json` for current dependency versions and `node_modules/next/dist/docs` for version-matched Next.js documentation.

`pnpm typecheck` runs Next.js type generation before TypeScript checks. Useful checks:

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
