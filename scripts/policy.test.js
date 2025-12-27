import { declToBackendIR } from "../src/lowering/backend.js";
import { emitBackend } from "../src/emit/backend-tsmorph.js";
import path from "node:path";
import fs from "node:fs";

async function main() {
  try {
    // default policy should default to uuid_v4
    const { aggregateDecls } = await import("../src/decl/aggregator.js");
    const unified = await aggregateDecls(["examples/app.dsl.ts"]);
    const decl = unified.apps[0];
    // call lowering with no explicit policies
    const irDefault = declToBackendIR(decl, undefined);
    if (irDefault.policies.generateId !== "uuid_v4") throw new Error("default generateId policy not applied");

    // call lowering with shortid
    const irShort = declToBackendIR(decl, { generateId: "shortid" });
    if (irShort.policies.generateId !== "shortid") throw new Error("shortid policy not applied");

    // emit with shortid policy and check generated lib/id.ts
    const outDir = path.resolve(process.cwd(), "generated-policy-test");
    emitBackend(irShort, outDir);

    const idFile = path.join(outDir, "lib", "id.ts");
    if (!fs.existsSync(idFile)) throw new Error("id.ts not generated");

    const content = fs.readFileSync(idFile, "utf-8");
    if (!content.includes("crypto") && !content.includes("randomBytes")) throw new Error("shortid implementation not present in generated id.ts");

    console.log("Policy tests passed.");
    process.exit(0);
  } catch (err) {
    console.error("Policy tests failed:", err);
    process.exit(1);
  }
}

main();
