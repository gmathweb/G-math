import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const proxyTarget = env.VITE_PROXY_TARGET ?? 'http://localhost:8000'
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_PRESENTATION_ORIGIN': JSON.stringify(
        env.VITE_PRESENTATION_ORIGIN ?? (command === 'serve' ? proxyTarget : ''),
      ),
    },
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
