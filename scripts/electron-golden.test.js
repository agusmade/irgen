import { exec } from "node:child_process";
import fs from "node:fs";

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
    console.log("Running electron generator for golden test...");
    await run("npm run gen:electron-docs");

    const checks = [
      { actual: "generated/electron-docs/electron/main.ts", expected: "test/golden/electron/main.expected.ts", type: "text" },
      { actual: "generated/electron-docs/electron/preload.ts", expected: "test/golden/electron/preload.expected.ts", type: "text" },
      { actual: "generated/electron-docs/electron/ipc-handlers.ts", expected: "test/golden/electron/ipc-handlers.expected.ts", type: "text" },
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
      const actual = fs.readFileSync(c.actual, "utf-8").trim();
      const expected = fs.readFileSync(c.expected, "utf-8").trim();
      if (actual !== expected) {
        console.error(`GOLDEN MISMATCH: ${c.actual} does not match ${c.expected}`);
        console.error("--- expected ---\n" + expected);
        console.error("--- actual ---\n" + actual);
        failures++;
      }
    }

    if (failures > 0) {
      console.error(`Electron golden tests failed (${failures} mismatches).`);
      process.exit(2);
    }

    console.log("Electron golden tests passed.");
    process.exit(0);
  } catch (e) {
    console.error("Electron golden test failed:", e);
    process.exit(1);
  }
}

main();
