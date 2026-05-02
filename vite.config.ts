import { crx } from "@crxjs/vite-plugin";
import { defineConfig } from "vite";
import manifest from "./src/manifest";

export default defineConfig({
    plugins: [crx({ manifest })],
    build: {
        rollupOptions: {
            // The page-world bridge is injected via a <script> tag at runtime
            // by content-bridge.ts; ensure it ships as its own asset Vite
            // doesn't try to inline-import.
            input: {
                "page-bridge": "src/page-bridge.ts",
            },
            output: {
                entryFileNames: (chunk) =>
                    chunk.name === "page-bridge"
                        ? "page-bridge.js"
                        : "assets/[name]-[hash].js",
            },
        },
    },
    server: {
        port: 5173,
        strictPort: true,
        hmr: { port: 5173 },
    },
});
