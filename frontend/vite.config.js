import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Fail loudly in production builds when the API URL is missing.
  // Vite inlines VITE_* vars at build time — a build without VITE_API_URL
  // would silently ship a frontend that calls /api on its own origin and 404s.
  if (mode === 'production' && !process.env.VITE_API_URL) {
    console.warn(
      '\n⚠️  VITE_API_URL is NOT set — API calls will hit this origin and 404 in production.\n' +
        '   Set it in Vercel → Project → Settings → Environment Variables, e.g.\n' +
        '   VITE_API_URL=https://interviewsense-api.onrender.com  (no trailing slash)\n'
    )
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
  }
})
