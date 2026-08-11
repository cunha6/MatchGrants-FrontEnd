import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The Django API runs on http://localhost:8000 and authenticates with a
// session cookie. To keep the browser on a single origin (so the cookie is
// sent and stored without CORS/SameSite headaches) every API call is made to
// the `/api` prefix and this dev proxy forwards it to Django, stripping `/api`.
//
// Why `/api` and not the bare `/avisos`, `/anuncios`, ... prefixes: the SPA has
// client-side routes at those same paths (e.g. the page `/avisos/:id/edit` vs
// the API `/avisos/:id/edit/`). Proxying the bare prefixes would send a hard
// browser reload of an app route to Django. The `/api` prefix keeps app routes
// and API routes cleanly separated while remaining same-origin.
//
// Example: fetch('/api/avisos/list/') -> http://localhost:8000/avisos/list/
//
// The target is overridable via VITE_API_PROXY_TARGET so the dev server can run
// inside Docker (e.g. http://host.docker.internal:8000). In production the app
// is served by nginx, which reverse-proxies /api instead (see nginx template).
const API_TARGET = process.env.VITE_API_PROXY_TARGET || 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})

//cloudflared tunnel --protocol http2 --url http://localhost:5173/