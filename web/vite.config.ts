import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "web/dist",
    emptyOutDir: true,
    rollupOptions: {
      input: "web/src/main.tsx",
      output: {
        entryFileNames: "greenbridge-widget.js",
        assetFileNames: "greenbridge-widget.css"
      }
    }
  }
});
