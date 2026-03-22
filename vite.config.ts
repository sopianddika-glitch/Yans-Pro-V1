import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Allow overriding base path for GitHub Pages via env (e.g., repository name or custom domain)
const basePath = process.env.VITE_BASE_PATH || '/Yans-Pro-V1/';

export default defineConfig({
  plugins: [react()],
  base: basePath,
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      mangle: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'charts': ['recharts'],
          'qrcode': ['html5-qrcode'],
          'google-ai': ['@google/genai'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    reportCompressedSize: false,
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      clientPort: 5173
    }
  },
  preview: {
    port: 5174,
  },
  define: {
    "process.env": {},
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
  optimizeDeps: {
    include: ['process', 'react', 'react-dom', 'recharts'],
  }
});
