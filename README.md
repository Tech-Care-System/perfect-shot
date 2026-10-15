# AI Perfect Shot

AI Perfect Shot is a photography PWA that uses the device camera and on-device pose detection to guide composition and capture. MediaPipe runs locally in a Web Worker; camera frames and photos are not uploaded by the app. Captured photos can be saved to the device.

## Requirements

- Node.js 24 LTS, selected by `.node-version`
- The pnpm version declared by the `packageManager` field in `package.json`

## Local development

```sh
corepack enable
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Camera access requires a secure context such as localhost and permission from the browser.

After dependency changes, keep the MediaPipe runtime and model aligned with the installed `@mediapipe/tasks-vision` package. `pnpm install` copies its WASM files into `public/wasm`; the pose model is stored at `public/models/pose_landmarker_lite.task`.

## Checks

```sh
pnpm typecheck
pnpm lint
pnpm test --runInBand
pnpm test:e2e
pnpm validate
```

`pnpm typecheck` runs Next.js type generation first. `pnpm validate` runs the project validation script, including type checking, linting, unit tests, and a production build. Install Playwright browsers with `pnpm exec playwright install` if the end-to-end tests report a missing browser.

## Project layout

- `src/app` — App Router pages, layout, styles, and manifest
- `src/components` — camera, screen, control, and shared UI components
- `src/lib` — camera and pose hooks, AI worker, state, and utilities
- `src/data/poses` — local pose library
- `public/models` and `public/wasm` — local MediaPipe assets
- `tests/e2e` — Playwright browser tests

## Docker deployment

The Dockerfile builds the Next.js standalone output and runs it on port 3000:

```sh
docker build -t ai-perfect-shot .
docker run --rm -p 3000:3000 ai-perfect-shot
```

EasyPanel deployment is optional. The GitHub Actions CD workflow triggers an EasyPanel deployment after CI succeeds on `main`; configure the repository Actions secret `EASYPANEL_DEPLOY_WEBHOOK_URL` with the deployment webhook URL to enable it.
