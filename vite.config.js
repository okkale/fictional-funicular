import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("three")) {
              return "three-vendor";
            }
            if (id.includes("motion")) {
              return "motion-vendor";
            }
            if (id.includes("@phosphor-icons")) {
              return "icons-vendor";
            }
            if (id.includes("react") || id.includes("react-dom") || id.includes("scheduler")) {
              return "react-vendor";
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});

