import fs from "node:fs";
import path from "node:path";
import type { CliTargetIR } from "../../ir/target/cli.js";
import { emitterEngine } from "../engine.js";
import { registerTargetEmitter } from "../registry.js";

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function emitCliDocs(outDir: string, ir: CliTargetIR) {
  ensureDir(outDir);
  const lines: string[] = [];
  lines.push(`# ${ir.name} CLI`);
  lines.push("");
  lines.push("Commands:");
  for (const cmd of ir.commands) {
    lines.push(`- ${cmd.name}${cmd.description ? ` — ${cmd.description}` : ""}`);
  }
  fs.writeFileSync(path.join(outDir, "CLI.md"), lines.join("\n"), "utf-8");
}

try {
  emitterEngine.registerEmitter("cli-fake", async (ir: CliTargetIR, outDir: string) => {
    emitCliDocs(outDir, ir);
  }, { force: true });
} catch (e) {
  // ignore duplicate registration
}

try {
  registerTargetEmitter("cli", "cli-fake", { force: true });
} catch (e) {
  // ignore
}

