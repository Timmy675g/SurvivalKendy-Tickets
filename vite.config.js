import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendPort = env.BACKEND_PORT || "5007";

  return {
    plugins: [react(), cloudflare()],
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "src")
      }
    },
    server: {
      host: "0.0.0.0",
      port: Number(env.FRONTEND_PORT || 5006),
      proxy: {
        "/api": {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true
        }
      }
    },
    preview: {
      host: "0.0.0.0",
      port: Number(env.FRONTEND_PORT || 5006)
    }
  };
});