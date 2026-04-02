# syntax=docker/dockerfile:1

# Stage 1: Build the Angular SSG application
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
# build:prod = ng build --configuration production && node scripts/inject-blog-meta.mjs
RUN npm run build:prod

# Stage 2: Serve with non-root NGINX (UID 101, listens on 8080)
FROM nginxinc/nginx-unprivileged:1.27-alpine
LABEL org.opencontainers.image.title="Fluxus" \
      org.opencontainers.image.description="Angular 21 SSG portfolio — static site served by NGINX" \
      org.opencontainers.image.source="https://github.com/faisalkhan91/Fluxus" \
      org.opencontainers.image.authors="Faisal Khan"
COPY --link --from=build /app/dist/fluxus/browser /usr/share/nginx/html
# index.csr.html is the Angular CSR bootstrap shell — when served as 404.html,
# Angular boots client-side and the router renders the glitch NotFoundComponent.
COPY --link --from=build /app/dist/fluxus/browser/index.csr.html /usr/share/nginx/html/404.html
COPY --link nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
