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

function readText(p) {
  return fs.readFileSync(p, "utf-8").trim();
}

async function main() {
  try {
    console.log("Running static-site generator for golden test...");
    await run("tsx src/cli.ts examples/static-no-enhance.dsl.ts --targets=static-site --outDir=generated/static-no-enhance");
    await run("tsx src/cli.ts examples/static-with-enhance.dsl.ts --targets=static-site --outDir=generated/static-with-enhance");

    const checks = [
      { actual: "generated/static-no-enhance/dist/index.html", expected: "test/golden/static-site/no-enhance/index.expected.html", type: "text" },
      { actual: "generated/static-no-enhance/dist/assets/style.css", expected: "test/golden/static-site/no-enhance/style.expected.css", type: "text" },
      { actual: "generated/static-with-enhance/dist/index.html", expected: "test/golden/static-site/with-enhance/index.expected.html", type: "text" },
      { actual: "generated/static-with-enhance/dist/assets/style.css", expected: "test/golden/static-site/with-enhance/style.expected.css", type: "text" },
      { actual: "generated/static-with-enhance/dist/assets/app.js", expected: "test/golden/static-site/with-enhance/app.expected.js", type: "text" },
      { actual: "generated/static-with-enhance/dist/assets/search-index.json", expected: "test/golden/static-site/with-enhance/search-index.expected.json", type: "json" },
    ];

    const jsOffCheck = {
      actual: "generated/static-with-enhance/dist/index.html",
      expected: "test/golden/static-site/with-enhance/js-off.expected.html",
    };

    const shouldNotExist = [
      "generated/static-no-enhance/dist/assets/app.js",
    ];

    let failures = 0;

    for (const p of shouldNotExist) {
      if (fs.existsSync(p)) {
        console.error(`UNEXPECTED FILE: ${p} should not exist`);
        failures++;
      }
    }

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
        const actual = readText(c.actual);
        const expected = readText(c.expected);
        if (actual !== expected) {
          console.error(`GOLDEN MISMATCH: ${c.actual} does not match ${c.expected}`);
          console.error("--- expected ---\n" + expected);
          console.error("--- actual ---\n" + actual);
          failures++;
        }
      }
    }

    if (!fs.existsSync(jsOffCheck.expected)) {
      console.error(`MISSING GOLDEN: ${jsOffCheck.expected} (run scripts/update-golden.js to create)`);
      failures++;
    } else if (!fs.existsSync(jsOffCheck.actual)) {
      console.error(`MISSING GENERATED: ${jsOffCheck.actual} (generator failed?)`);
      failures++;
    } else {
      const actual = readText(jsOffCheck.actual);
      const expected = readText(jsOffCheck.expected);
      if (actual !== expected) {
        console.error(`GOLDEN MISMATCH: ${jsOffCheck.actual} does not match ${jsOffCheck.expected}`);
        console.error("--- expected ---\n" + expected);
        console.error("--- actual ---\n" + actual);
        failures++;
      }
      const hasScript = /<script\\b/i.test(actual);
      if (hasScript) {
        console.error(`JS-OFF CHECK FAILED: ${jsOffCheck.actual} still contains <script> tags`);
        failures++;
      }
    }

    if (failures > 0) {
      console.error(`Static-site golden tests failed (${failures} mismatches).`);
      process.exit(2);
    }

    console.log("Static-site golden tests passed.");
    process.exit(0);
  } catch (e) {
    console.error("Static-site golden test failed:", e);
    process.exit(1);
  }
}

main();
