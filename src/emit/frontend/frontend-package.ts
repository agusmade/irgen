import fs from "node:fs";
import path from "node:path";
import type { FrontendTargetIR } from "../../ir/target/frontend.js";
import { hasMarkdownCodeBlocks, hasMarkdownMermaid } from "./frontend-helpers.js";

export function emitFrontendPackageJson(outDir: string, ir: FrontendTargetIR) {
  const policy = ir.policies.frontend;
  const mode = policy.framework.rendering.mode;
  const isSsg = mode === "ssg" || mode === "hybrid";
  const hasMarkdownCode = hasMarkdownCodeBlocks(ir);
  const hasMermaid = hasMarkdownMermaid(ir);

  const pkg: any = {
    name: ir?.appName ? `${ir.appName.toLowerCase()}-frontend` : "generated-frontend",
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      format: "prettier --write .",
      "build:css": "tailwindcss -i src/index.css -o dist/index.css --minify",
      dev: "vite",
      build: isSsg ? "npm run build:ssg" : "vite build",
      preview: "vite preview",
    },
    dependencies: {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      "lucide-react": "^0.263.1",
      "react-router-dom": "^6.14.0",
    },
    devDependencies: {
      "@types/react": "^18.0.0",
      "@types/react-dom": "^18.0.0",
      tailwindcss: "^3.3.0",
      postcss: "^8.4.0",
      autoprefixer: "^10.4.0",
      "@tailwindcss/forms": "^0.5.0",
      prettier: "^2.8.8",
      typescript: "^5.6.3",
      tsx: "^4.19.2",
      vite: "^5.4.8",
      "@vitejs/plugin-react": "^4.3.2",
    },
  };

  if (isSsg) {
    pkg.scripts["build:ssg"] = "vite build && npm run build:ssr && npm run prerender";
    pkg.scripts["build:ssr"] = "vite build --ssr src/entry-server.tsx --outDir .ssg";
    pkg.scripts["prerender"] = "node scripts/prerender.mjs";
  }

  const hasCode = ir.pages.some(p => p.components.some(c => c.codeBlock)) || ir.components.some(c => c.codeBlock);
  if (hasCode) {
    pkg.dependencies["react-syntax-highlighter"] = "^15.5.0";
    pkg.devDependencies["@types/react-syntax-highlighter"] = "^15.5.0";
  }
  if (hasMarkdownCode) {
    pkg.dependencies["prismjs"] = "^1.29.0";
  }
  if (hasMermaid) {
    pkg.dependencies["mermaid"] = "^10.9.1";
  }

  const buildPolicy = ir.policies.frontend.build ?? {};
  const copyCfg = buildPolicy.copyTo ?? buildPolicy.copyToPublic;
  if (copyCfg?.enabled) {
    const scriptDir = path.join(outDir, "scripts");
    fs.mkdirSync(scriptDir, { recursive: true });
    const basePath = copyCfg.basePath ?? policy.framework.rendering.basePath ?? "/";
    const scriptContent = `import fs from "node:fs";
import path from "node:path";

const fromDir = path.resolve(process.cwd(), ${JSON.stringify(copyCfg.fromDir ?? "dist")});
const targetRoot = path.resolve(process.cwd(), ${JSON.stringify(copyCfg.targetRoot ?? "../php-shared-hosting/public")});
const basePath = ${JSON.stringify(basePath)};
const subPath = basePath.replace(/^\\/|\\/$/g, "");
const destDir = subPath ? path.join(targetRoot, subPath) : targetRoot;

if (!fs.existsSync(fromDir)) {
  console.error(\`postbuild copy failed: missing \${fromDir}\`);
  process.exit(1);
}

const relToRoot = path.relative(targetRoot, destDir);
const withinRoot = relToRoot && !relToRoot.startsWith("..") && !path.isAbsolute(relToRoot);
const shouldWipe = destDir !== targetRoot && withinRoot;

if (shouldWipe) {
  fs.rmSync(destDir, { recursive: true, force: true });
}
fs.mkdirSync(destDir, { recursive: true });
fs.cpSync(fromDir, destDir, { recursive: true });

console.log(\`postbuild copy: \${fromDir} -> \${destDir}\`);
`;
    fs.writeFileSync(path.join(scriptDir, "irgen-copy-public.mjs"), scriptContent, "utf-8");
    pkg.scripts["postbuild:copy"] = "node scripts/irgen-copy-public.mjs";
  }

  if (buildPolicy.postbuild) {
    pkg.scripts["postbuild:custom"] = buildPolicy.postbuild;
  }

  if (pkg.scripts["postbuild:copy"] || pkg.scripts["postbuild:custom"]) {
    const parts = [];
    if (pkg.scripts["postbuild:copy"]) parts.push("npm run postbuild:copy");
    if (pkg.scripts["postbuild:custom"]) parts.push("npm run postbuild:custom");
    pkg.scripts.postbuild = parts.join(" && ");
  }

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "package.json"), JSON.stringify(pkg, null, 2), "utf-8");
}
