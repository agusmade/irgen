import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";

const execFileP = promisify(execFile);

async function main() {
  try {
    const outBase = path.resolve(process.cwd(), "generated-frontend-test");
    if (fs.existsSync(outBase)) fs.rmSync(outBase, { recursive: true, force: true });

    await execFileP("npx", ["tsx", "src/cli.ts", "--mode=frontend", "examples/frontend.dsl.ts", outBase], { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 });

    const index = path.join(outBase, "frontend", "index.tsx");
    const home = path.join(outBase, "frontend", "pages", "home.tsx");
    const productCard = path.join(outBase, "frontend", "components", "productcard.tsx");

    if (!fs.existsSync(index)) throw new Error("frontend index not generated");
    if (!fs.existsSync(home)) throw new Error("home page not generated");
    if (!fs.existsSync(productCard)) throw new Error("productcard component not generated");

    console.log("Frontend generation test passed");
    process.exit(0);
  } catch (err) {
    console.error("Frontend generation test failed:", err);
    process.exit(1);
  }
}

main();
