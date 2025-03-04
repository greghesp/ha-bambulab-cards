import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { resolve } from "path";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
    cssInjectedByJsPlugin(),
  ],
  define: {
    // Add process.env polyfill
    "process.env": {},
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/ha-bambulab-cards.ts"),
      name: "HABambulabCards",
      fileName: () => "ha-bambulab-cards.js",
      formats: ["iife"],
    },
    rollupOptions: {
      external: [],
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
    sourcemap: true,
    minify: "terser",
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      // Add any path aliases you might have in your rollup config
    },
  },
});
