import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    // `server-only` throws outside React Server Components; unit tests import
    // server modules directly, so it's stubbed here.
    alias: { "server-only": new URL("./tests/stubs/empty.ts", import.meta.url).pathname.replace(/^\/(\w:)/, "$1") },
  },
  test: {
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
