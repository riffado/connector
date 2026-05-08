import { crx } from "@crxjs/vite-plugin";
import { defineConfig } from "vite";
import manifest from "./src/manifest";

export default defineConfig({
    plugins: [crx({ manifest })],
    build: {
        rollupOptions: {
            // The page-world bridge is injected via a <script> tag at runtime
            // by content-bridge.ts; ensure it ships as its own asset Vite
            // doesn't try to inline-import. The welcome page is opened by
            // background.ts via chrome.runtime.getURL and must be emitted
            // as a real HTML asset (it isn't referenced from manifest).
            input: {
                "page-bridge": "src/page-bridge.ts",
                welcome: "src/welcome.html",
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
