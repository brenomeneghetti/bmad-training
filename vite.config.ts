import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const contentSecurityPolicy =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "preview-security-headers",
      configurePreviewServer(server) {
        server.middlewares.use((_request, response, next) => {
          response.setHeader("Content-Security-Policy", contentSecurityPolicy);
          response.setHeader("Referrer-Policy", "no-referrer");
          next();
        });
      },
    },
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
