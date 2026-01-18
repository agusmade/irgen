import path from "node:path";
import type { Project } from "ts-morph";
import type { FrontendPolicy } from "../../ir/target/frontend.policy.js";

export function emitViteConfig(project: Project, outDir: string, policy: FrontendPolicy) {
  const mode = policy.framework.rendering.mode;
  const isSsg = mode === "ssg" || mode === "hybrid";
  const buildOutDir = policy.framework.rendering.prerender.outDir;

  const config = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "${policy.framework.rendering.basePath}",
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
  },
  server: { port: 5173 },
  preview: { port: 4173 },
  publicDir: "public",${isSsg ? `
  build: {
    outDir: "${buildOutDir}",
    manifest: true,
  },
  ssr: {
    noExternal: ["react", "react-dom", "react-router", "react-router-dom", /react-syntax-highlighter/, /lucide-react/, "prismjs"],
  },` : ""}
});
  `.trim();

  project.createSourceFile(path.join(outDir, "vite.config.ts"), config, { overwrite: true });
}
