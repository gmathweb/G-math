import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const proxyTarget = env.VITE_PROXY_TARGET ?? 'http://localhost:8000'
  return {
    // In production the admin build is served by FastAPI under /admin/.
    base: command === 'build' ? '/admin/' : '/',
    plugins: [react(), tailwindcss()],
    resolve: { dedupe: ['react', 'react-dom'] },
    define: {
      'import.meta.env.VITE_PRESENTATION_ORIGIN': JSON.stringify(
        env.VITE_PRESENTATION_ORIGIN ?? (command === 'serve' ? proxyTarget : ''),
      ),
    },
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
