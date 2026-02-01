import fs from "node:fs";
import { exec } from "node:child_process";

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
    console.log("Running backend generator for golden test...");
    await run("npm run gen:backend-policy");

    const checks = [
      { actual: "generated/backend-policy/server.ts", expected: "test/golden/backend/server.expected.ts", type: "text" },
      { actual: "generated/backend-policy/openapi.json", expected: "test/golden/backend/openapi.expected.json", type: "json" },
      { actual: "generated/backend-policy/lib/health.ts", expected: "test/golden/backend/health.expected.ts", type: "text" },
      { actual: "generated/backend-policy/lib/logger.ts", expected: "test/golden/backend/logger.expected.ts", type: "text" },
    ];

    let failures = 0;
    for (const c of checks) {
      if (!fs.existsSync(c.expected)) {
        console.error(`MISSING GOLDEN: ${c.expected} (create it by updating golden fixtures)`);
        failures++;
        continue;
      }
      if (!fs.existsSync(c.actual)) {
        console.error(`MISSING GENERATED: ${c.actual} (generator failed?)`);
        failures++;
        continue;
      }
      if (c.type === "json") {
        const actualObj = JSON.parse(fs.readFileSync(c.actual, "utf-8"));
        const expectedObj = JSON.parse(fs.readFileSync(c.expected, "utf-8"));
        if (JSON.stringify(actualObj) !== JSON.stringify(expectedObj)) {
          console.error(`GOLDEN MISMATCH: ${c.actual} does not match ${c.expected}`);
          failures++;
        }
      } else {
        const actual = fs.readFileSync(c.actual, "utf-8").trim();
        const expected = fs.readFileSync(c.expected, "utf-8").trim();
        if (actual !== expected) {
          console.error(`GOLDEN MISMATCH: ${c.actual} does not match ${c.expected}`);
          failures++;
        }
      }
    }

    if (failures > 0) {
      console.error(`Backend golden tests failed (${failures} mismatches).`);
      process.exit(2);
    }

    console.log("Backend golden tests passed.");
    process.exit(0);
  } catch (e) {
    console.error("Backend golden test failed:", e);
    process.exit(1);
  }
}

main();
