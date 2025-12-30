import fs from "node:fs";
import path from "node:path";
import os from "node:os";

async function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cli-target-"));
  const outDir = path.join(tmp, "out");

  try {
    const decl = {
      apps: [{
        type: "cli",
        name: "demo-cli",
        commands: [{ name: "hello", description: "say hello" }],
      }],
    };

    const { registerBuiltins, runMapper } = await import("../src/mappers/index.js");
    registerBuiltins();
    const domainIr = await runMapper("cli", decl);

    await import("../src/lowering/targets/to-cli.js");
    const { engine } = await import("../src/lowering/engine.js");
    const targetIr = await engine.runTransform("cli-target", domainIr);

    await import("../src/emit/cli/cli-fake.js");
    const { emitterEngine } = await import("../src/emit/engine.js");
    await emitterEngine.runEmitter("cli-fake", targetIr, outDir);

    const marker = path.join(outDir, "CLI.md");
    if (!fs.existsSync(marker)) throw new Error("CLI emitter did not produce CLI.md");

    console.log("CLI target test passed");
  } catch (err) {
    console.error("CLI target test failed:", err);
    process.exit(1);
  }
}

main();
