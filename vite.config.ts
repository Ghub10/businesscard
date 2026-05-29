import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Preferred dev port for this repo only (not Vite’s default 5173, so CDL-Drivers / other apps can keep 5173).
 * strictPort: false — if this port is busy, Vite picks the next free one; use the “Local” URL Vite prints.
 */
const DEV_PORT = 5626;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: DEV_PORT,
    strictPort: false,
  },
});
