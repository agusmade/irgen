import { exec } from "node:child_process";
import fs from "node:fs";

function run(cmd) {
  return new Promise((resolve, reject) => {
    const p = exec(cmd, { cwd: process.cwd() }, (err, stdout, stderr) => {
      if (err) return reject({ err, stdout, stderr });
      resolve({ stdout, stderr });
    });
    p.stdout?.pipe(process.stdout);
    p.stderr?.pipe(process.stderr);
  });
}

async function main() {
  try {
    console.log("Running generator (combined mode)...");
    await run("npm run gen");

    const modelFile = "generated/backend/lib/models.ts";
    if (!fs.existsSync(modelFile)) {
      console.error("FAIL: expected file not found:", modelFile);
      process.exit(2);
    }

    const servicesDir = "generated/backend/services";
    if (!fs.existsSync(servicesDir)) {
      console.error("FAIL: expected directory not found:", servicesDir);
      process.exit(2);
    }

    console.log("POC smoke test passed: generated artifacts present.");
    process.exit(0);
  } catch (e) {
    console.error("Generator failed:", e);
    process.exit(1);
  }
}

main();
