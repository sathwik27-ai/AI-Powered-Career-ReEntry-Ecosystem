import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // "@/x" → "<root>/src/x" (root-relative, so no Node path helpers are needed)
  resolve: { alias: { "@": "/src" } },
  server: { port: 5173, strictPort: true },
});
