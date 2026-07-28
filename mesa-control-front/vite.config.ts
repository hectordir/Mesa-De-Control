/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on 0.0.0.0 so the dev server is reachable from outside this machine
    // (ngrok, phones on the LAN), not only from localhost.
    host: true,
    // Vite rejects requests whose Host header it does not know ("Blocked request").
    // A leading dot matches any subdomain, which is what the tunnel providers hand
    // out on each run (trycloudflare = Cloudflare quick tunnels, the default here).
    allowedHosts: [
      ".trycloudflare.com",
      ".ngrok-free.app",
      ".ngrok.app",
      ".ngrok-free.dev",
      ".ngrok.io",
    ],
    proxy: {
      // Tunnel mode ships the whole app through a SINGLE public URL: the front is
      // served by Vite and every /api/* call is forwarded to the NestJS backend.
      // Same-origin from the browser's point of view => no CORS, no second tunnel.
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        // The backend has no global prefix (routes live at the root: /auth/login,
        // /products, /rates), so the /api marker is stripped before forwarding.
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
    // Playwright e2e specs live in ./e2e and must not be picked up by Vitest.
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
  },
});
