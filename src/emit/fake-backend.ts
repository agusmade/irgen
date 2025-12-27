import { emitterEngine } from "./engine.js";
import { registerTargetEmitter } from "./registry.js";
import fs from "node:fs";
import path from "node:path";

try {
  emitterEngine.registerEmitter("fake-backend", async (_ir: any, outDir: string) => {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "FAKE_EMITTER.txt"), "fake emitter run", "utf-8");
  }, { force: true });

  registerTargetEmitter("backend", "fake-backend", { force: true });
} catch (e) {}
