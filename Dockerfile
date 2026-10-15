FROM node:24.22.0-alpine AS base

RUN npm install --global pnpm@12.11.2

# =============================================================================
# Stage 1: deps — install production + dev dependencies
# =============================================================================
FROM base AS deps

WORKDIR /app

# Copy lockfile and manifest first to maximise Docker layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install ALL dependencies (dev deps are needed for the build stage)
RUN pnpm install --frozen-lockfile

# =============================================================================
# Stage 2: builder — compile the Next.js app
# =============================================================================
FROM base AS builder

WORKDIR /app

# Bring in node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the full source tree
COPY . .

# next.config.ts sets output: 'standalone', which produces:
#   .next/standalone  — a self-contained server with only prod node_modules
#   .next/static      — static assets (must be copied manually)
RUN pnpm run build

# =============================================================================
# Stage 3: runner — minimal production image
# =============================================================================
FROM base AS runner

# Security: run as a non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nextjs

WORKDIR /app

ENV NODE_ENV=production
# Disable Next.js telemetry in the container
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the standalone server (includes its own trimmed node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static assets that Next.js standalone doesn't bundle automatically
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy the public directory (icons, models, wasm, sounds, sw.js)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# The standalone output produces server.js at the root of its directory
CMD ["node", "server.js"]
