# Building Cloud-Native CI/CD Pipelines

Modern software teams ship fast—sometimes dozens of times per day. But speed without reliability is chaos. In this post I'll walk through how I design **cloud-native CI/CD pipelines** that are fast, reproducible, and resilient.

## Why "Cloud-Native" Matters

Traditional CI/CD (Jenkins on a VM, anyone?) works, but it doesn't *scale*. Cloud-native pipelines treat infrastructure as code, run inside containers, and leverage managed services so you spend time on features, not firefighting.

Key principles:

- **Immutable artifacts** — Build once, deploy the same image everywhere.
- **Ephemeral runners** — No snowflake build servers.
- **Declarative config** — Pipeline-as-code, versioned alongside your app.

## The Stack

| Layer | Tool | Why |
|-------|------|-----|
| Source Control | GitHub | Branch protection, CODEOWNERS, PR checks |
| CI Engine | GitHub Actions | Native integration, matrix builds, reusable workflows |
| Container Runtime | Docker | Reproducible builds with multi-stage Dockerfiles |
| Orchestration | Kubernetes (AKS) | Rolling deployments, health checks, auto-scaling |
| Registry | Azure Container Registry | Geo-replicated, integrated with AKS |

## A Minimal Pipeline

Here's a stripped-down GitHub Actions workflow that builds, tests, and deploys a containerised app:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --coverage

  docker-publish:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: myregistry.azurecr.io/app:${{ github.sha }}
```

## Multi-Stage Dockerfiles

The key to small, secure images is a multi-stage build:

```dockerfile
# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Production stage ---
FROM nginx:alpine
COPY --from=build /app/dist/app /usr/share/nginx/html
EXPOSE 80
```

This gives you an image under 30 MB instead of 1 GB+.

## Zero-Downtime Deployments

Kubernetes rolling updates ensure users never see downtime:

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
        - name: app
          readinessProbe:
            httpGet:
              path: /health
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 10
```

The `readinessProbe` prevents traffic from routing to a pod that isn't ready yet.

## Lessons Learned

1. **Cache aggressively** — `npm ci` with a cache layer saves minutes per build.
2. **Fail fast** — Run linting and unit tests before expensive Docker builds.
3. **Pin versions** — Use exact tags for base images (`node:20.11-alpine`, not `node:latest`).
4. **Secrets management** — Never bake secrets into images. Use Kubernetes Secrets or Azure Key Vault.

## What's Next

In a future post I'll cover **GitOps with Flux** — where the cluster itself watches your Git repo and reconciles state automatically. Stay tuned.

---

*Thanks for reading. If you have questions or want to discuss CI/CD patterns, hit me up on the [Contact](/contact) page.*
