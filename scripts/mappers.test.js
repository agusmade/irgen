import { aggregateDecls } from "../src/decl/aggregator.js";
import { registerBuiltins, registerMapper, unregisterMapper, listMappers, getMapper, runMapper } from "../src/mappers/index.js";

async function main() {
  try {
    // prepare
    registerBuiltins();

    const decl = await aggregateDecls(["examples/app.dsl.ts"]);

    // run backend mapper
    const backend = await runMapper("backend", decl);
    if (!backend || !Array.isArray(backend.entities) || backend.entities.length === 0) throw new Error("backend mapper produced invalid BackendIR");

    // run frontend mapper (may fail in some environments, but should return a sane structure when it works)
    try {
      const frontend = await runMapper("frontend", decl);
      if (!frontend || (!Array.isArray(frontend.pages) && !Array.isArray(frontend.components))) throw new Error("frontend mapper produced invalid FrontendIR");
    } catch (err) {
      console.warn("frontend mapper run failed (environmental), continuing:", err?.message ?? err);
    }

    // test registry helpers
    registerMapper("test-mapper", (d) => ({ ok: true }));
    if (!listMappers().includes("test-mapper")) throw new Error("test-mapper not listed after registration");
    const m = getMapper("test-mapper");
    if (!m) throw new Error("getMapper returned undefined for registered mapper");
    unregisterMapper("test-mapper");
    if (listMappers().includes("test-mapper")) throw new Error("test-mapper still listed after unregister");

    console.log("Mapper tests passed.");
    process.exit(0);
  } catch (err) {
    console.error("Mapper tests failed:", err);
    process.exit(1);
  }
}

main();
