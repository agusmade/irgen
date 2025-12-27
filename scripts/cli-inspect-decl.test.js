import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

async function main() {
  try {
    const { stdout } = await execFileP("npx", ["tsx", "src/cli.ts", "examples/app.dsl.ts", "generated-inspect-decl", "--targets=backend", "--inspect-decl"], { cwd: process.cwd() });
    if (!stdout.includes('"apps":')) throw new Error("inspect-decl did not print DeclUnified");
    if (!stdout.includes('DemoApp')) throw new Error("inspect-decl output missing app name");

    console.log("CLI inspect-decl test passed");
    process.exit(0);
  } catch (err) {
    console.error("CLI inspect-decl test failed:", err);
    process.exit(1);
  }
}

main();
