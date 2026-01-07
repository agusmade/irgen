import fs from "node:fs";
import path from "node:path";
import { emitterEngine } from "../engine.js";
import { registerTargetEmitter } from "../registry.js";

// Fake backend emitter is only meant for registry tests.
// Avoid registering anything during normal CLI runs.
if (process.env.USE_FAKE_EMITTER === "1" || process.env.NODE_ENV === "test") {
  try {
    emitterEngine.registerEmitter("fake-backend", async (_ir: any, outDir: string) => {
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "FAKE_EMITTER.txt"), "fake emitter run", "utf-8");
    }, { force: true });

    registerTargetEmitter("backend", "fake-backend", { force: true });
  } catch (e) {
    // ignore double registration in test loops
  }
}
