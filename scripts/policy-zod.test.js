import { engine } from "../src/lowering/engine.js";
import { aggregateDecls } from "../src/decl/aggregator.js";

async function main() {
  try {
    await import("../src/lowering/backend.js");
    const unified = await aggregateDecls(["examples/app.dsl.ts"]);
    const decl = unified.apps[0];

    try {
      await engine.runTransform("backend", decl, { generateId: "nonsense" });
      console.error("Expected policy validation to throw but it did not");
      process.exit(2);
    } catch (err) {
      // Ensure it's a zod error (has `issues` array)
      if (!err || !err.issues) {
        console.error("Expected zod validation error, got:", err);
        process.exit(3);
      }
    }

    console.log("Policy zod validation passed (invalid policy rejected with zod error).");
    process.exit(0);
  } catch (err) {
    console.error("Policy zod test failed:", err);
    process.exit(1);
  }
}

main();
