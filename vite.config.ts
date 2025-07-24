import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const timestamp = Date.now()

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `[name].${timestamp}.js`,
        chunkFileNames: `[name].${timestamp}.js`,
        assetFileNames: `[name].${timestamp}.[ext]`
      }
    }
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __VERSION__: JSON.stringify('1.0.0-ssl-fix')
  }
})