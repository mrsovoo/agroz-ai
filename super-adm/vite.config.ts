import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

function superAdmBackendPlugin() {
  return {
    name: 'super-adm-backend-middleware',
    configureServer(server: any) {
      const { app, initDatabase } = require('../backend/server.js')
      initDatabase()
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && (req.url.startsWith('/v1/admin') || req.url.startsWith('/api'))) {
          return app(req, res, next)
        }
        next()
      })
    }
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), superAdmBackendPlugin()],
  server: {
    port: 3002,
    host: '0.0.0.0'
  }
})
