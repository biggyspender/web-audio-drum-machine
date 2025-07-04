/// <reference types="vitest/config" />
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const localServerConfig = {
  port: 5005,
  host: "0.0.0.0",
  strictPort: true,
};
// https://vite.dev/config/
export default defineConfig({
  base: "/web-audio-drum-machine/",
  build: {
    rollupOptions: {
      treeshake: true,
      output: {
        assetFileNames: "assets/[hash][extname]",
        chunkFileNames: "assets/[hash].js",
        entryFileNames: "assets/entry.[hash].js",
      },
    },
  },
  server: localServerConfig,
  preview: localServerConfig,
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    projects: [
      // Standard unit tests project
      {
        test: {
          name: "unit",
          include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
          exclude: ["src/**/*.stories.{js,ts,jsx,tsx}"],
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
        },
      },
      // Storybook tests project
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: "playwright",
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
    ],
  },
});
