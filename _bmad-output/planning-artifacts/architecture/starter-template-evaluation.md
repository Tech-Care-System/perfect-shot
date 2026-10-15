# Starter Template Evaluation

## Primary Technology Domain

**Mobile Web PWA (Camera-centric Real-time AI Application)**

Project requirements analysis indicates:

- Real-time camera feed processing with AI overlay
- Client-side AI inference (MediaPipe WASM)
- PWA with offline shell caching
- Portrait-locked mobile experience optimized for iOS Safari and Android Chrome

## Starter Options Considered

| Option                  | Description                                              | Assessment                                                   |
| ----------------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| **Next.js + Shadcn/UI** | Manual compose with latest Next.js and component library | ✅ Selected — Perfect PRD alignment                          |
| **T3 Stack**            | Full-stack with tRPC, Prisma, NextAuth                   | ❌ Overkill — Backend-focused, zero-backend MVP doesn't need |
| **Vite + React**        | Lighter SPA alternative                                  | ❌ Missing SSR, App Router benefits                          |
| **Expo/React Native**   | Cross-platform mobile                                    | ❌ Web-first requirement, PWA focus                          |

## Selected Starter: Next.js + Shadcn/UI (Manual Compose)

**Rationale for Selection:**

- Direct alignment with PRD-specified tech stack (Next.js + Tailwind + Shadcn/UI)
- Next.js (Dec 2024) with stable Turbopack and React support
- Built-in PWA manifest support in App Router (`app/manifest.ts`)
- Flexible project structure for camera-optimized architecture
- No backend overhead for zero-backend MVP

**Initialization Commands:**

```bash
# 1. Create Next.js project
npx create-next-app@latest ai-perfect-shot --typescript --tailwind --eslint --app --src-dir --turbopack --import-alias "@/*"

# 2. Initialize Shadcn/UI
npx shadcn@latest init

# 3. Add required Shadcn components
npx shadcn@latest add button sheet dialog

# 4. Install additional dependencies
npm install jotai @mediapipe/tasks-vision idb
```

## Architectural Decisions Provided by Starter

**Language & Runtime:**

- TypeScript with strict mode
- React (via Next.js)
- Node.js version selected in .node-version

**Styling Solution:**

- Tailwind CSS
- CSS Variables for theming
- Shadcn/UI component patterns
- Dark mode as default (via `class` strategy)

**Build Tooling:**

- Turbopack (stable in Next.js) for development
- Webpack 5 for production builds
- SWC for TypeScript compilation

**Project Structure:**

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with dark mode
│   ├── page.tsx            # Camera screen (entry)
│   ├── manifest.ts         # PWA manifest
│   └── globals.css         # Tailwind + CSS variables
├── components/
│   ├── ui/                 # Shadcn/UI components
│   └── camera/             # Custom camera components
├── lib/
│   ├── ai/                 # MediaPipe integration
│   ├── hooks/              # Custom React hooks
│   └── stores/             # Jotai atoms
└── public/
    └── models/             # AI model files (if needed)
```

**State Management:**

- Jotai for atomic state updates (30 FPS pose score)
- React built-in hooks for local UI state
- No global state library overhead

**Development Experience:**

- Turbopack hot reload (~700ms)
- TypeScript strict mode
- ESLint with Next.js rules
- Path aliases (`@/*`)

**PWA Configuration:**

- Native `app/manifest.ts` support (no next-pwa needed)
- Service Worker via Serwist (optional for offline caching)
- Portrait orientation locked via manifest

**Note:** Project initialization using these commands should be the first implementation story.

---
