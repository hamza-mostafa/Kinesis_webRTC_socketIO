import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/login": "http://backend:4000",
      "/webrtc-config": "http://backend:4000",
      // Add other API routes as needed
    },
  },
});
