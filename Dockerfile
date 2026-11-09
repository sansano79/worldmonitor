# =============================================================================
# World Monitor — Docker Image
# =============================================================================
# Multi-stage build:
#   builder       — installs deps, compiles TS handlers, builds Vite frontend
#   runtime-deps  — installs only packages needed by unbundled raw JS handlers
#   final         — nginx (static) + node (API) under supervisord
# =============================================================================

# ── Stage 1: Builder ─────────────────────────────────────────────────────────
# Keep Node/esbuild on the builder's native architecture for reliable
# cross-platform builds; the generated JS and static assets are portable.
FROM --platform=$BUILDPLATFORM node:24-alpine@sha256:feb76650b7195319268c59cb2d419c732d6c499b13bf5296f16ab59eb1f0a4f3 AS builder

WORKDIR /app
ENV npm_config_install_links=true
ARG VITE_CSM_MODE=false

# Install root dependencies (layer-cached until package.json changes)
COPY package.json package-lock.json ./
COPY vendor/braces/ ./vendor/braces/
COPY vendor/stream-json/ ./vendor/stream-json/
COPY vendor/vercel-og/ ./vendor/vercel-og/
RUN npm ci --ignore-scripts

# Copy full source
COPY . .

# The crawlable-corpus step runs the source-attribution drift gate against
# scripts/, server/, api/, and src/. generate-inventory-facts and
# build-handlers write untracked .js into those same roots, so the gate must
# run on the pristine checkout first (#7435). tsc + vite stay later: they
# need the generated inventory assets and compiled handlers.
RUN npm run build:crawlable-corpus && npm run build:sitemap

# Generated inventory modules are intentionally untracked. Recreate them in
# the clean image context before handlers import or bundle them.
RUN node scripts/generate-inventory-facts.mjs

# Compile TypeScript API handlers → self-contained ESM bundles
# Output is api/**/*.js alongside the source .ts files
RUN node docker/build-handlers.mjs

# The CSM image is a complete standalone product and does not include the
# separate WorldMonitor /pro application. General images still build and verify
# those pages as before.
RUN if [ "$VITE_CSM_MODE" != "true" ]; then npm run build:pro; fi

# Build the Vite frontend (outputs to dist/)
# Skip blog build — blog-site has its own deps not installed here
RUN if [ "$VITE_CSM_MODE" = "true" ]; then node scripts/prepare-cesium-assets.mjs; fi && \
    VITE_CSM_MODE="$VITE_CSM_MODE" npx tsc && VITE_CSM_MODE="$VITE_CSM_MODE" npx vite build
# Assert the /pro pages survived the public/ -> dist/ copy for general images.
RUN if [ "$VITE_CSM_MODE" != "true" ]; then test -s dist/pro/index.html && test -s dist/pro/welcome.html; fi

# ── Stage 2: Runtime dependencies ───────────────────────────────────────────
FROM node:24-alpine@sha256:feb76650b7195319268c59cb2d419c732d6c499b13bf5296f16ab59eb1f0a4f3 AS runtime-deps

WORKDIR /app

# Keep the runtime dependency set deliberately smaller than the app's full
# production graph. The raw api/*.js handlers are not bundled by
# docker/build-handlers.mjs, so they still need these package imports at
# runtime, but the frontend/server-only production deps do not belong in the
# final image.
COPY docker/runtime-package.json ./package.json
COPY docker/runtime-package-lock.json ./package-lock.json
RUN npm ci --omit=dev --omit=optional --ignore-scripts

# ── Stage 3: Runtime ─────────────────────────────────────────────────────────
FROM node:24-alpine@sha256:feb76650b7195319268c59cb2d419c732d6c499b13bf5296f16ab59eb1f0a4f3 AS final

# nginx + supervisord
RUN apk add --no-cache nginx supervisor gettext && \
    mkdir -p /tmp/nginx-client-body /tmp/nginx-proxy/osm-cache /tmp/nginx-fastcgi \
             /tmp/nginx-uwsgi /tmp/nginx-scgi /var/log/supervisor && \
    addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# API server
COPY --from=builder /app/src-tauri/sidecar/local-api-server.mjs ./local-api-server.mjs
COPY --from=builder /app/src-tauri/sidecar/package.json ./package.json
COPY --from=builder /app/shared/llm-health-providers.js ./shared/llm-health-providers.js
ENV LOCAL_API_RESOURCE_DIR=/app

# Minimal runtime node_modules — required by raw .js handlers that aren't
# bundled by build-handlers.mjs. Without this the Node sidecar dispatches
# those routes, fails to resolve package imports like @upstash/ratelimit,
# and returns 502 "missing dependency".
COPY --from=runtime-deps /app/node_modules ./node_modules

# API handler modules (JS originals + compiled TS bundles)
COPY --from=builder /app/api ./api

# Static data files used by handlers at runtime
COPY --from=builder /app/data ./data

# Built frontend static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx + supervisord configs
COPY docker/nginx.conf /etc/nginx/nginx.conf.template
COPY docker/supervisord.conf /etc/supervisor/conf.d/worldmonitor.conf
COPY docker/entrypoint.sh /app/entrypoint.sh
COPY docker/render-nginx-realip.mjs /app/render-nginx-realip.mjs
COPY docker/render-csm-runtime-config.mjs /app/render-csm-runtime-config.mjs
COPY docker/validate-session-secret.mjs /app/validate-session-secret.mjs
RUN chmod +x /app/entrypoint.sh

# Ensure writable dirs for non-root
RUN chown -R appuser:appgroup /app /tmp/nginx-client-body /tmp/nginx-proxy \
    /tmp/nginx-fastcgi /tmp/nginx-uwsgi /tmp/nginx-scgi /var/log/supervisor \
    /var/lib/nginx /var/log/nginx /usr/share/nginx/html

USER appuser

EXPOSE 8080

# Healthcheck via nginx. Use 127.0.0.1 (not localhost - that resolves to ::1
# first, where nginx does not listen). Probe /api/sidecar-health, a dedicated
# auth-exempt liveness route in the sidecar (local-api-server.mjs): reaching it
# through nginx's /api/ proxy verifies BOTH nginx and the node sidecar are up,
# unlike a static "/" probe which only proves nginx is serving. Keep this off
# /api/health so the public compact data-health contract still reaches api/health.js.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/sidecar-health >/dev/null 2>&1 || exit 1

CMD ["/app/entrypoint.sh"]
