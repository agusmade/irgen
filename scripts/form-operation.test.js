import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";

const execFileP = promisify(execFile);

async function main() {
  try {
    const outDir = path.resolve(process.cwd(), "generated-form-operation");
    if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });

    await execFileP(
      "npx",
      ["tsx", "src/cli.ts", "examples/form-operation.dsl.ts", outDir, "--mode=frontend"],
      { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 },
    );

    const formComponent = path.join(outDir, "src", "components", "signup-form.tsx");
    if (!fs.existsSync(formComponent)) {
      throw new Error("generated component not found: signup-form.tsx");
    }

    const content = fs.readFileSync(formComponent, "utf-8");
    if (!content.includes('useOperation("signup")')) {
      throw new Error("form submit does not bind to operationId");
    }
    if (!content.includes("Full Name")) {
      throw new Error("form fields not rendered (expected label missing)");
    }

    console.log("Form operation test passed");
    process.exit(0);
  } catch (err) {
    console.error("Form operation test failed:", err);
    process.exit(1);
  }
}

main();
