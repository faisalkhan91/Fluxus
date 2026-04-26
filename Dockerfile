# syntax=docker/dockerfile:1

# Stage 1: Build the Angular SSG application.
# `--platform=$BUILDPLATFORM` keeps the Node build native to the runner
# (e.g. amd64) even when the final image is requested for arm64 — the
# output is static HTML/JS/CSS so it's arch-independent and we'd otherwise
# be running `npm` under QEMU emulation, which adds many minutes per build.
FROM --platform=$BUILDPLATFORM node:24-alpine@sha256:01743339035a5c3c11a373cd7c83aeab6ed1457b55da6a69e014a95ac4e4700b AS build
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
# build:prod = ng build --configuration production && node scripts/inject-blog-meta.mjs
RUN npm run build:prod

# Stage 2: Serve with non-root NGINX (UID 101, listens on 8080)
FROM nginxinc/nginx-unprivileged:1.29-alpine@sha256:f99cc61bf1719f30230602036314ff6ba5dcede8965c5ed3ded71b8bbced3723
LABEL org.opencontainers.image.title="Fluxus" \
      org.opencontainers.image.description="Angular 21 SSG portfolio — static site served by NGINX" \
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
