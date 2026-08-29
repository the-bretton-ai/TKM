import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: "node",
    coverage: {
      reporter: ["text", "json-summary"],
    },
  },
});
