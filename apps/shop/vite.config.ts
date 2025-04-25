import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api/accounts": {
        target: "http://accounts:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/accounts/, ""),
      },
      "/api/orders": {
        target: "http://orders:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/orders/, ""),
      },
      "/sync/rejot-sync-from-accounts": {
        target: "http://rejot-sync-from-accounts:80",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sync\/rejot-sync-from-accounts/, ""),
      },
      "/sync/rejot-sync-to-orders": {
        target: "http://rejot-sync-to-orders:80",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sync\/rejot-sync-to-orders/, ""),
      },
    },
  },
});
