import { engine } from "../src/lowering/engine.js";
import { aggregateDecls } from "../src/dsl/aggregator.js";

async function main() {
  try {
    const unified = await aggregateDecls(["examples/app.dsl.ts"]);
    const decl = unified.apps[0];

    // load transforms
    await import("../src/lowering/backend.js");
    await import("../src/lowering/backend.to-target.js");

    const domainIr = await engine.runTransform("backend", decl, undefined);
    if (!domainIr) throw new Error("engine backend lowering returned falsy domain ir");

    const irDefault = await engine.runTransform("backend-target", domainIr, undefined);
    if (irDefault.policies.backend.generateId !== "uuid_v4") throw new Error("default policy not applied via engine");

    const irShort = await engine.runTransform("backend-target", domainIr, { generateId: "shortid" });
    if (irShort.policies.backend.generateId !== "shortid") throw new Error("shortid policy not applied via engine");

    // invalid policy should throw at target layer
    try {
      await engine.runTransform("backend-target", domainIr, { generateId: "nonsense" });
      throw new Error("engine did not throw on invalid policy");
    } catch (err) {
      // expected
    }

    console.log("Lowering engine tests passed.");
    process.exit(0);
  } catch (err) {
    console.error("Lowering engine tests failed:", err);
    process.exit(1);
  }
}

main();
