import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Local dev: proxy /api to the FastAPI bot running on :8080 (run it with
  // `uvicorn main:app --port 8080` from server/). In prod, Firebase Hosting
  // rewrites /api/** to Cloud Run, so the same-origin calls work unchanged.
  server: {
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true },
    },
  },
  build: {
    // Keep the heavy markdown/syntax-highlight stack in its own chunk so it
    // can be cached independently and loaded in parallel with the app shell.
    rollupOptions: {
      output: {
        manualChunks: {
          markdown: [
            "react-markdown",
            "remark-gfm",
            "rehype-highlight",
            "highlight.js",
          ],
          motion: ["framer-motion"],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
});
