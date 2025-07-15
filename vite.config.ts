import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false, // Desabilita overlay de erros para melhor performance
    },
  },
  base: mode === 'production' ? '/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'react-vendor': ['react', 'react-dom'],
          
          // UI Components
          'ui-core': [
            '@radix-ui/react-dialog', 
            '@radix-ui/react-dropdown-menu', 
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip'
          ],
          
          // Charts and Data
          'charts': ['recharts'],
          
          // Backend and Auth
          'backend': ['@supabase/supabase-js'],
          
          // Forms and Validation
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // Routing
          'routing': ['react-router-dom'],
          
          // Utilities
          'utils': ['date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Aumenta limite de warning
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'react-router-dom',
      'recharts',
    ],
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Otimizações de performance
  esbuild: {
    target: 'es2020',
  },
  css: {
    devSourcemap: mode === 'development',
  },
}));
