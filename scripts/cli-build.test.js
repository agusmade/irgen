import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";

const execFileP = promisify(execFile);

async function main() {
  try {
    const outBase = path.resolve(process.cwd(), "generated-cli-build");
    if (fs.existsSync(outBase)) fs.rmSync(outBase, { recursive: true, force: true });

    const { stdout } = await execFileP("npx", ["tsx", "src/cli.ts", "examples/app.dsl.ts", outBase, "--targets=backend,frontend", "--inspect-ir"], { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 });

    if (!stdout.includes('INSPECT-IR (backend)')) throw new Error("did not print backend IR when --inspect-ir used");
    if (!stdout.includes('INSPECT-IR (frontend)')) throw new Error("did not print frontend IR when --inspect-ir used");

    const backendModel = path.join(outBase, "backend", "lib", "models.ts");
    const frontendExists = fs.existsSync(path.join(outBase, "frontend"));

    if (!fs.existsSync(backendModel)) throw new Error("backend model not generated during orchestration");
    if (!frontendExists) throw new Error("frontend target directory not generated during orchestration");

    console.log("CLI build test passed");
    process.exit(0);
  } catch (err) {
    console.error("CLI build test failed:", err);
    process.exit(1);
  }
}

main();
