import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',   // paksa host
    port: 5173,          // paksa port Vite dev server
    strictPort: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      clientPort: 5173
    }
  },
  define: {
    // small shim so legacy code referencing process.env won't crash in browser
    "process.env": {}
  },
  optimizeDeps: {
    include: ['process']
  }
});
