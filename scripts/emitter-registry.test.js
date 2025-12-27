import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";

const execFileP = promisify(execFile);

async function main() {
  try {
    const outBase = path.resolve(process.cwd(), "generated-emitter-registry");
    if (fs.existsSync(outBase)) fs.rmSync(outBase, { recursive: true, force: true });

    // run CLI and override backend emitter to use fake-backend (which writes FAKE_EMITTER.txt)
    await execFileP("npx", ["tsx", "src/cli.ts", "examples/app.dsl.ts", outBase, "--targets=backend", `--emitter-map=${JSON.stringify({ backend: 'fake-backend' })}`], { cwd: process.cwd() });

    const marker = path.join(outBase, "backend", "FAKE_EMITTER.txt");
    if (!fs.existsSync(marker)) throw new Error("fake emitter was not executed via emitter map override");

    console.log("Emitter registry override test passed");
    process.exit(0);
  } catch (err) {
    console.error("Emitter registry override test failed:", err);
    process.exit(1);
  }
}

main();
