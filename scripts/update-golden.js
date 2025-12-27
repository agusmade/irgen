import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function copyIfExists(src, dst) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log(`Updated golden: ${dst}`);
  } else {
    console.warn(`Missing generated file, skipping: ${src}`);
  }
}

function main() {
  console.log("Updating golden fixtures: running generator (backend + frontend)...");
  // ensure both backend and frontend artifacts exist
  execSync("npm run gen:combined", { stdio: "inherit" });

  ensureDir(path.join("test", "golden"));

  const mapping = [
    ["generated/lib/models.ts", "test/golden/models.expected.ts"],
    ["generated/services/product.service.ts", "test/golden/product.service.expected.ts"],
    ["generated/controllers/product.controller.ts", "test/golden/product.controller.expected.ts"],
    ["generated/lib/id.ts", "test/golden/id.expected.ts"],
    ["generated/lib/logger.ts", "test/golden/logger.expected.ts"],
    ["generated/lib/http.ts", "test/golden/http.expected.ts"],
    ["generated/package.json", "test/golden/package.expected.json"],
    ["generated/frontend/index.tsx", "test/golden/frontend/index.expected.tsx"],
    ["generated/frontend/index.css", "test/golden/frontend/index.css.expected"],
    ["generated/frontend/pages/home.tsx", "test/golden/frontend/pages/home.expected.tsx"],
    ["generated/frontend/pages/product.tsx", "test/golden/frontend/pages/product.expected.tsx"],
    ["generated/frontend/components/productcard.tsx", "test/golden/frontend/components/productcard.expected.tsx"],
    ["generated/frontend/components/productdetail.tsx", "test/golden/frontend/components/productdetail.expected.tsx"],
    ["generated/frontend/components/productform.tsx", "test/golden/frontend/components/productform.expected.tsx"],
  ];

  for (const [s, d] of mapping) copyIfExists(s, d);

  console.log("Golden fixtures updated. Review and commit the changes.");
}

main();
