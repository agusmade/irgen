import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function run(cmd) {
  return new Promise((resolve, reject) => {
    const p = exec(cmd, { cwd: process.cwd() }, (err, stdout, stderr) => {
      if (err) return reject({ err, stdout, stderr });
      resolve({ stdout, stderr });
    });
    if (p.stdout) p.stdout.pipe(process.stdout);
    if (p.stderr) p.stderr.pipe(process.stderr);
  });
}

async function main() {
  try {
    console.log("Running generator for golden test...");
    // generate both backend and frontend artifacts to validate frontend golden fixtures
    await run("npm run gen");

    const checks = [
      { actual: "generated/backend/lib/models.ts", expected: "test/golden/models.expected.ts", type: "text" },
      { actual: "generated/backend/services/user.service.ts", expected: "test/golden/user.service.expected.ts", type: "text" },
      { actual: "generated/backend/controllers/post.controller.ts", expected: "test/golden/post.controller.expected.ts", type: "text" },
      { actual: "generated/backend/controllers/comment.controller.ts", expected: "test/golden/comment.controller.expected.ts", type: "text" },
      { actual: "generated/backend/lib/id.ts", expected: "test/golden/id.expected.ts", type: "text" },
      { actual: "generated/backend/lib/logger.ts", expected: "test/golden/logger.expected.ts", type: "text" },
      { actual: "generated/backend/lib/http.ts", expected: "test/golden/http.expected.ts", type: "text" },
      { actual: "generated/backend/package.json", expected: "test/golden/package.expected.json", type: "json" },
      // frontend artifacts
      { actual: "generated/frontend/src/index.tsx", expected: "test/golden/frontend/index.expected.tsx", type: "text" },
      { actual: "generated/frontend/src/index.css", expected: "test/golden/frontend/index.css.expected", type: "text" },
      { actual: "generated/frontend/src/lib/logic.ts", expected: "test/golden/frontend/lib/logic.expected.ts", type: "text" },
      { actual: "generated/frontend/src/pages/home.tsx", expected: "test/golden/frontend/pages/home.expected.tsx", type: "text" },
      { actual: "generated/frontend/src/components/productcard.tsx", expected: "test/golden/frontend/components/productcard.expected.tsx", type: "text" },
      { actual: "generated/frontend/src/pages/product.tsx", expected: "test/golden/frontend/pages/product.expected.tsx", type: "text" },
      { actual: "generated/frontend/src/components/productdetail.tsx", expected: "test/golden/frontend/components/productdetail.expected.tsx", type: "text" },
      { actual: "generated/frontend/src/components/productform.tsx", expected: "test/golden/frontend/components/productform.expected.tsx", type: "text" },
    ];

    let failures = 0;

    for (const c of checks) {
      if (!fs.existsSync(c.expected)) {
        console.error(`MISSING GOLDEN: ${c.expected} (run scripts/update-golden.js to create)`);
        failures++;
        continue;
      }

      if (!fs.existsSync(c.actual)) {
        console.error(`MISSING GENERATED: ${c.actual} (generator failed?)`);
        failures++;
        continue;
      }

      if (c.type === "json") {
        const actual = JSON.parse(fs.readFileSync(c.actual, "utf-8"));
        const expected = JSON.parse(fs.readFileSync(c.expected, "utf-8"));
        const aStr = JSON.stringify(actual, Object.keys(actual).sort(), 2);
        const eStr = JSON.stringify(expected, Object.keys(expected).sort(), 2);
        if (aStr !== eStr) {
          console.error(`GOLDEN MISMATCH: ${c.actual} does not match ${c.expected}`);
          console.error("--- expected ---\n" + eStr);
          console.error("--- actual ---\n" + aStr);
          failures++;
        }
      } else {
        const actual = fs.readFileSync(c.actual, "utf-8").trim();
        const expected = fs.readFileSync(c.expected, "utf-8").trim();
        if (actual !== expected) {
          console.error(`GOLDEN MISMATCH: ${c.actual} does not match ${c.expected}`);
          console.error("--- expected ---\n" + expected);
          console.error("--- actual ---\n" + actual);
          failures++;
        }
      }
    }

    if (failures > 0) {
      console.error(`Golden tests failed (${failures} mismatches).`);
      process.exit(2);
    }

    console.log("Golden tests passed.");
    process.exit(0);
  } catch (e) {
    console.error("Golden test failed:", e);
    process.exit(1);
  }
}

main();
