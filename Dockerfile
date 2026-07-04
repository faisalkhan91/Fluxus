# syntax=docker/dockerfile:1

# Stage 1: Build the Angular SSG application.
# `--platform=$BUILDPLATFORM` keeps the Node build native to the runner
# (e.g. amd64) even when the final image is requested for arm64 — the
# output is static HTML/JS/CSS so it's arch-independent and we'd otherwise
# be running `npm` under QEMU emulation, which adds many minutes per build.
#
# Pin an explicit minor (>= 24.15.0): Angular CLI 22 requires Node
# >=24.15.0 (also enforced by engines.node in package.json). The previous
# `node:24-alpine` digest had drifted to 24.14.1, which is BELOW that floor,
# so `ng build` aborted with exit 3 inside the container. Keep this at a
# pinned 24.1x-alpine >= 24.15.0; Dependabot bumps the digest.
FROM --platform=$BUILDPLATFORM node:24.18-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS build
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
# build:prod runs the full SSG pipeline (image dims/variants, version stamp,
# ng build --configuration production, inject-meta, sitemap/feed/OG cards, CSP
# + audits) — see the "build:prod" script in package.json for the exact chain.
RUN npm run build:prod

# Stage 2: Serve with non-root NGINX (UID 101, listens on 8080)
FROM nginxinc/nginx-unprivileged:1.31-alpine@sha256:a8d5564c3354241473c1e152d5dd3281ab4224edb61b23c291e0bfd9854687a1
LABEL org.opencontainers.image.title="Fluxus" \
      org.opencontainers.image.description="Angular 22 SSG portfolio — static site served by NGINX" \
      org.opencontainers.image.source="https://github.com/faisalkhan91/Fluxus" \
      org.opencontainers.image.authors="Faisal Khan"

# Update packages to fix high-severity vulnerabilities
USER root
RUN apk add --no-cache --upgrade musl musl-utils zlib && apk upgrade --no-cache
USER 101

COPY --link --from=build /app/dist/fluxus/browser /usr/share/nginx/html
# index.csr.html is the Angular CSR bootstrap shell — when served as 404.html,
# Angular boots client-side and the router renders the glitch NotFoundComponent.
COPY --link --from=build /app/dist/fluxus/browser/index.csr.html /usr/share/nginx/html/404.html
COPY --link nginx.conf /etc/nginx/conf.d/default.conf
# Prefer the build-time-generated security headers (script-src hashes are
# computed from every inline <script> the prerender emitted). The file falls
# back to the hand-maintained source if the build step somehow skipped it.
COPY --link --from=build /app/dist/fluxus/security-headers.conf /etc/nginx/conf.d/security-headers.conf
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO /dev/null http://localhost:8080/healthz || exit 1
EXPOSE 8080
