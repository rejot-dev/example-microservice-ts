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
      "/sync/sync-a": {
        target: "http://sync-a-service:80",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sync\/sync-a/, ""),
      },
      "/sync/sync-b": {
        target: "http://sync-b-service:80",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sync\/sync-b/, ""),
      },
    },
  },
});
