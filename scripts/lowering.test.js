import { engine } from "../src/lowering/engine.js";
import { aggregateDecls } from "../src/decl/aggregator.js";

async function main() {
  try {
    const unified = await aggregateDecls(["examples/app.dsl.ts"]);
    const decl = unified.apps[0];

    // ensure backend lowering module is loaded so it can register its transform
    await import("../src/lowering/backend.js");

    // run backend lowering via engine (default policies)
    const irDefault = await engine.runTransform("backend", decl, undefined);
    if (!irDefault) throw new Error("engine backend lowering returned falsy ir");
    if (irDefault.policies.generateId !== "uuid_v4") throw new Error("default policy not applied via engine");

    // run with explicit shortid
    const irShort = await engine.runTransform("backend", decl, { generateId: "shortid" });
    if (irShort.policies.generateId !== "shortid") throw new Error("shortid policy not applied via engine");

    // invalid policy should throw
    try {
      await engine.runTransform("backend", decl, { generateId: "nonsense" });
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
