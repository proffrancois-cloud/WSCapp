import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173
  },
  preview: {
    host: "127.0.0.1",
    port: 4174
  },
  build: {
    outDir: "dist-3d",
    emptyOutDir: true,
    modulePreload: {
      resolveDependencies() {
        return [];
      }
    },
    rollupOptions: {
      input: {
        "alpaca-campus-3d": resolve(__dirname, "alpaca-campus-3d/index.html")
      },
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("/zustand/")) {
            return "react-vendor";
          }

          if (
            id.includes("/three/") ||
            id.includes("/@react-three/") ||
            id.includes("/@dimforge/") ||
            id.includes("/@mediapipe/") ||
            id.includes("/troika-")
          ) {
            return "three-vendor";
          }

          return "vendor";
        }
      }
    }
  }
});
