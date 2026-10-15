# Story 7.5: Production Deployment to Vercel

Status: done

## Story

As a developer,
I want the app deployed to Vercel with automatic deploys,
so that updates are published automatically on push.

## Acceptance Criteria

1. **AC1: Vercel Project Connected** — The GitHub repository is connected to a Vercel project. Vercel auto-detects the Next.js framework and uses the correct build command (`next build`) and output directory.

2. **AC2: Automatic Production Deploys** — When code is pushed to the `main` branch, Vercel automatically builds and deploys to production. No manual deployment steps required.

3. **AC3: Preview Deployments** — When a pull request is opened, Vercel creates a preview deployment with a unique URL. The preview is accessible for testing before merge.

4. **AC4: HTTPS** — The production URL is served over HTTPS. This is automatic on Vercel — no custom certificate configuration needed. HTTPS is required for service worker registration (Story 7.4, now implemented) and camera access (`getUserMedia`).

5. **AC5: CSP Headers Tightened** — Content Security Policy headers in `next.config.ts` are reviewed and tightened. Remove CDN origins (`cdn.jsdelivr.net`, `storage.googleapis.com`) that are no longer needed since MediaPipe WASM and models are served locally from `/wasm` and `/models`. The tightened CSP:
   - `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:` — remove `https://cdn.jsdelivr.net`
   - `connect-src 'self'` — remove `https://cdn.jsdelivr.net https://storage.googleapis.com`
   - All other directives unchanged

6. **AC6: Mobile Browser Access** — The production URL is accessible and functional on iOS Safari (16.4+) and Android Chrome (108+). Camera access, pose detection, and photo capture work on mobile. Verified via manual testing post-deployment.

7. **AC7: Standalone Output Compatible** — The `output: 'standalone'` setting in `next.config.ts` is preserved. Vercel natively supports standalone output — no `vercel.json` overrides needed unless custom configuration is required.

## Tasks / Subtasks

- [x] Task 1: Tighten CSP headers (AC: #5)
  - [x] 1.1 Remove `https://cdn.jsdelivr.net` from `script-src` in `next.config.ts`
  - [x] 1.2 Remove `https://cdn.jsdelivr.net https://storage.googleapis.com` from `connect-src` in `next.config.ts`
  - [x] 1.3 Verify app still loads correctly with tightened CSP (local dev test)
- [x] Task 2: Vercel platform setup (AC: #1, #2, #3, #4) — MANUAL
  - [x] 2.1 Connect GitHub repository to Vercel project
  - [x] 2.2 Verify auto-detection of Next.js framework settings
  - [x] 2.3 Trigger initial production deployment from `main` branch
  - [x] 2.4 Verify HTTPS is active on production URL
  - [x] 2.5 Open a test PR to verify preview deployment creation
- [x] Task 3: Mobile verification (AC: #6) — MANUAL
  - [x] 3.1 Test on iOS Safari — camera access, pose detection, photo capture
  - [x] 3.2 Test on Android Chrome — camera access, pose detection, photo capture
  - [x] 3.3 Verify service worker registers successfully (from Story 7.4)
  - [x] 3.4 Verify PWA installability ("Add to Home Screen")

## Dev Notes

### This Is Primarily a Platform Story

Unlike most stories in this project, Story 7.5 is mostly platform setup (Vercel dashboard) rather than code changes. **The only code change is tightening CSP headers in `next.config.ts`.** Tasks 2 and 3 are manual processes performed by the developer in the Vercel dashboard and on physical devices.

### CSP Header Review

Current CSP in `next.config.ts:16`:

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net;
worker-src 'self' blob:;
connect-src 'self' https://cdn.jsdelivr.net https://storage.googleapis.com;
img-src 'self' blob: data:;
style-src 'self' 'unsafe-inline';
```

**Why `cdn.jsdelivr.net` and `storage.googleapis.com` can be removed:**

Commit `6be4a8a` ("chore(mediapipe): switch WASM runtime and model to local assets") moved MediaPipe WASM and models from CDN to local serving. The CDN origins are now unused. Verified: `grep` for `cdn.jsdelivr.net` and `storage.googleapis.com` across `src/` returns zero matches.

Evidence:

- `MEDIAPIPE_CDN_URL = '/wasm'` (local) in `src/constants/app.constants.ts:2`
- `POSE_MODEL_URL = '/models/pose_landmarker_lite.task'` (local) in `src/constants/app.constants.ts:3`

**Tightened CSP:**

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:;
worker-src 'self' blob:;
connect-src 'self';
img-src 'self' blob: data:;
style-src 'self' 'unsafe-inline';
```

**Why `'unsafe-eval'` is still needed:** MediaPipe's WASM runtime uses `eval()` internally for dynamic code generation. Removing `'unsafe-eval'` breaks pose detection. This is a known constraint documented in Story 2.2.

**Why `blob:` is still needed in `script-src` and `worker-src`:** The web worker is created via `new Worker(new URL(...), { type: 'module' })` which Next.js compiles to a blob URL. Removing `blob:` breaks the worker.

### Updated `next.config.ts`

Preserve existing comments. Only modify the CSP value string:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: { unoptimized: true }, // PWA compatibility

  // CSP Headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; worker-src 'self' blob:; connect-src 'self'; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### Vercel Platform Setup — MANUAL

This is performed in the Vercel dashboard, not automated via code:

1. **Import Project:** Vercel dashboard → "Add New" → "Project" → Import from GitHub
2. **Framework Detection:** Vercel auto-detects Next.js from `next.config.ts` and `package.json`
3. **Build Settings:** Default (`next build`) — no overrides needed
4. **Output Directory:** Auto-detected (`.next`) — no overrides needed
5. **Environment Variables:** None required — the app has no secrets or API keys
6. **Domain:** Vercel assigns a `.vercel.app` domain automatically. Custom domain is out of scope.

**`output: 'standalone'` on Vercel:** Vercel's Next.js integration natively supports standalone output. The build produces a self-contained Node.js server in `.next/standalone/`. Vercel deploys this as a serverless function. No `vercel.json` or custom build configuration needed.

### `vercel.json` — Likely NOT Needed

A `vercel.json` file is only needed for custom routing, redirects, headers (already in `next.config.ts`), or function configuration. Since:

- Headers are in `next.config.ts`
- No custom routes or redirects
- No serverless function configuration
- No custom build commands

...a `vercel.json` is unnecessary. Only create one if a specific deployment issue requires it.

### Mobile Testing Checklist

After deployment, verify on real devices:

| Feature                    | iOS Safari                       | Android Chrome                   |
| -------------------------- | -------------------------------- | -------------------------------- |
| Camera access prompt       | Shows permission dialog          | Shows permission dialog          |
| Back camera default        | Opens rear camera                | Opens rear camera                |
| Pose detection overlay     | Wireframe renders on body        | Wireframe renders on body        |
| Auto-capture               | Photo taken on pose match        | Photo taken on pose match        |
| Manual shutter             | Captures photo on tap            | Captures photo on tap            |
| Photo preview              | Full-screen preview renders      | Full-screen preview renders      |
| Save to device             | Download triggers                | Download triggers                |
| PWA install                | "Add to Home Screen" available   | "Add to Home Screen" available   |
| Service worker             | Registers without error          | Registers without error          |
| Unsupported device warning | Shows if FPS < 10 (low-end only) | Shows if FPS < 10 (low-end only) |
| Lite mode                  | Auto-enables if FPS < 15         | Auto-enables if FPS < 15         |

### Existing Infrastructure (Do NOT Recreate)

| Component              | Location                           | Status                                                          |
| ---------------------- | ---------------------------------- | --------------------------------------------------------------- |
| `next.config.ts`       | `next.config.ts`                   | Exists — tighten CSP only                                       |
| `output: 'standalone'` | `next.config.ts:4`                 | Exists — do NOT change                                          |
| CSP headers            | `next.config.ts:8-22`              | Exists — remove unused CDN origins from value string on line 16 |
| MediaPipe local assets | `public/wasm/`, `public/models/`   | Exists — confirms CDN no longer needed                          |
| `MEDIAPIPE_CDN_URL`    | `src/constants/app.constants.ts:2` | Points to `/wasm` (local)                                       |
| `POSE_MODEL_URL`       | `src/constants/app.constants.ts:3` | Points to `/models/` (local)                                    |
| `manifest.ts`          | `src/app/manifest.ts`              | Exists — do NOT modify (completed in 7.4)                       |
| `sw.js`                | `public/sw.js`                     | Exists — do NOT modify (completed in 7.4)                       |
| `RegisterSW`           | `src/components/register-sw.tsx`   | Exists — do NOT modify (completed in 7.4)                       |
| `layout.tsx`           | `src/app/layout.tsx`               | Exists with `<RegisterSW />` — do NOT modify (completed in 7.4) |

### What NOT to Do

- Do NOT change `output: 'standalone'` — it's correct for Vercel
- Do NOT add a custom server — Next.js on Vercel handles everything
- Do NOT add CI/CD pipeline config (GitHub Actions) — Vercel's GitHub integration replaces this
- Do NOT modify build scripts — Vercel auto-detects Next.js
- Do NOT add monitoring or analytics — out of scope
- Do NOT add a custom domain — out of scope (use default `.vercel.app`)
- Do NOT remove `'unsafe-eval'` from `script-src` — MediaPipe WASM requires it
- Do NOT remove `blob:` from `script-src` or `worker-src` — web worker creation requires it
- Do NOT add `vercel.json` unless a specific deployment issue requires it
- Do NOT add environment variables — the app has no secrets
- Do NOT modify `manifest.ts`, `sw.js`, `register-sw.tsx`, or `layout.tsx` — all completed in Story 7.4
- Do NOT strip existing comments from `next.config.ts` — preserve `// PWA compatibility` and `// CSP Headers`

### Project Structure Notes

| File             | Action   | Location Rationale                                     |
| ---------------- | -------- | ------------------------------------------------------ |
| `next.config.ts` | Modified | Remove unused CDN origins from CSP header value string |

No new files expected. `vercel.json` only if deployment issues arise.

### References

- [Source: next.config.ts:4] `output: 'standalone'` — Vercel-compatible
- [Source: next.config.ts:16] Current CSP string with CDN origins to remove
- [Source: src/constants/app.constants.ts:2-3] MediaPipe URLs confirm local serving (`/wasm`, `/models/`)
- [Source: commit 6be4a8a] "chore(mediapipe): switch WASM runtime and model to local assets" — confirms CDN origins are stale
- [Source: public/sw.js] Service worker from Story 7.4 — verify it registers on production HTTPS
- [Source: src/app/manifest.ts:8] Manifest `id: '/'` field added in 7.4 code review — stable app identity
- [Source: _bmad-output/implementation-artifacts/epic-6-retro.md] Epic 6 retro — action items to enforce
- [Source: _bmad-output/planning-artifacts/epics/epic-7-device-compatibility-performance.md#Story 7.5]

### Previous Story Intelligence (Story 7.4)

- Story 7.4 added `orientation: 'portrait'` to `manifest.ts` and an `id: '/'` field (added during code review for stable app identity).
- Created `public/sw.js` (minimal pass-through, no caching) and `src/components/register-sw.tsx` (registers on mount, silent failure).
- `<RegisterSW />` integrated into `src/app/layout.tsx` before `{children}`.
- Code review noted that JSDOM always has `serviceWorker` on the navigator prototype, making the `'serviceWorker' in navigator` false-branch untestable. One test was removed; remaining 3 tests provide solid coverage.
- Test suite at Story 7.4 completion: 42 suites, 402 tests, 0 failures.
- Story 7.4 explicitly noted "Do not modify `next.config.ts`" — separating CSP changes for this story (7.5).
- The service worker requires HTTPS to register. This works on Vercel automatically. On local dev (`localhost`), service workers work on `localhost` without HTTPS.

### Retro Action Items Enforcement

| Retro Item                                  | Enforcement in This Story                                                                                                                                                                                                        |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI-1 (E6)**: Retro Enforcement Table      | This table. Present in story.                                                                                                                                                                                                    |
| **AI-2 (E6)**: Timer/Closure Safety         | No timers in this story. CSP header change is static configuration.                                                                                                                                                              |
| **AI-3 (E6)**: Ref-based Guard Pattern      | No click handlers or async atom state in this story.                                                                                                                                                                             |
| **AI-4 (E5 carry)**: Test File Completeness | Modified `next.config.ts` is a configuration file — no associated test file. CSP changes are verified via manual testing (browser DevTools console for CSP violations) and Lighthouse audit. No new components or hooks created. |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (anthropic/claude-opus-4.6)

### Debug Log References

No issues encountered. Single-line CSP string edit, no regressions.

### Completion Notes List

- Task 1: Removed `https://cdn.jsdelivr.net` from `script-src` and `https://cdn.jsdelivr.net https://storage.googleapis.com` from `connect-src` in `next.config.ts`. These CDN origins were stale since commit `6be4a8a` moved MediaPipe WASM/models to local serving. All other CSP directives preserved unchanged (`'unsafe-eval'` and `blob:` still required for MediaPipe WASM and worker creation). Full test suite passes (42 suites, 402 tests, 0 regressions).
- Tasks 2 and 3 are MANUAL tasks requiring Vercel dashboard setup and physical device testing. These remain unchecked and must be completed by the developer post-deployment.

### Change Log

- Tightened CSP headers: removed unused CDN origins (`cdn.jsdelivr.net`, `storage.googleapis.com`) from `script-src` and `connect-src`

### File List

- `next.config.ts` (modified)
