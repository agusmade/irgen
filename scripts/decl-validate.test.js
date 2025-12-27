import { aggregateDecls } from "../src/decl/aggregator.js";

async function main() {
  try {
    const decl = await aggregateDecls(["examples/app.dsl.ts"]);
    console.log("DeclUnified validated and normalized:", JSON.stringify(decl, null, 2));
    // simple assertions
    if (!decl.apps?.length) throw new Error("no apps in decl");
    for (const app of decl.apps) {
      for (const e of app.entities) {
        if (!e.plural) throw new Error(`entity ${e.name} missing plural`);
        if (!e.id) throw new Error(`entity ${e.name} missing id`);
        if (!Array.isArray(e.operations)) throw new Error(`entity ${e.name} missing operations`);
      }
    }

    console.log("Decl validation test passed.");
    process.exit(0);
  } catch (err) {
    console.error("Decl validation test failed:", err);
    process.exit(1);
  }
}

main();
