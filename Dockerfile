# syntax=docker/dockerfile:1

# ---- Stage 1: build the static SPA ----
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first (better layer caching).
COPY package.json package-lock.json ./
RUN npm ci

# Build (tsc -b && vite build) → /app/dist
COPY . .
RUN npm run build

# ---- Stage 2: serve with nginx ----
FROM nginx:1.27-alpine AS runtime

# nginx reverse-proxies /api to the Django backend. Overridable at run time.
ENV BACKEND_ORIGIN=http://host.docker.internal:8000

# The base image's entrypoint runs envsubst on files in /etc/nginx/templates/,
# substituting ${BACKEND_ORIGIN} into the final /etc/nginx/conf.d/default.conf.
COPY nginx.default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
