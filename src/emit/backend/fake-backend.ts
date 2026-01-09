import fs from "node:fs";
import path from "node:path";
import { emitterEngine } from "../engine.js";
import { registerTargetEmitter } from "../registry.js";

// Fake backend emitter is meant for registry tests or explicit overrides.
// Register the emitter, but only override the backend mapping when asked.
try {
  emitterEngine.registerEmitter("fake-backend", async (_ir: any, outDir: string) => {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "FAKE_EMITTER.txt"), "fake emitter run", "utf-8");
  }, { force: true });

  if (process.env.USE_FAKE_EMITTER === "1") {
    registerTargetEmitter("backend", "fake-backend", { force: true });
  }
} catch (e) {
  // ignore double registration in test loops
}
