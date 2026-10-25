import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

function biznesgoBackendPlugin() {
  return {
    name: 'biznesgo-backend-middleware',
    configureServer(server: any) {
      const { app, initDatabase } = require('../backend/server.js')
      initDatabase()
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && (req.url.startsWith('/api') || req.url.startsWith('/v1/admin'))) {
          return app(req, res, next)
        }
        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), biznesgoBackendPlugin()],
  server: {
    port: 3001,
    host: '0.0.0.0'
  }
})
