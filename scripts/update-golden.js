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
  execSync("npm run gen", { stdio: "inherit" });

  ensureDir(path.join("test", "golden"));

  const mapping = [
    ["generated/backend/lib/models.ts", "test/golden/models.expected.ts"],
    ["generated/backend/services/user.service.ts", "test/golden/user.service.expected.ts"],
    ["generated/backend/controllers/post.controller.ts", "test/golden/post.controller.expected.ts"],
    ["generated/backend/controllers/comment.controller.ts", "test/golden/comment.controller.expected.ts"],
    ["generated/backend/lib/id.ts", "test/golden/id.expected.ts"],
    ["generated/backend/lib/logger.ts", "test/golden/logger.expected.ts"],
    ["generated/backend/lib/http.ts", "test/golden/http.expected.ts"],
    ["generated/backend/package.json", "test/golden/package.expected.json"],
    ["generated/frontend/src/index.tsx", "test/golden/frontend/index.expected.tsx"],
    ["generated/frontend/src/index.css", "test/golden/frontend/index.css.expected"],
    ["generated/frontend/src/pages/home.tsx", "test/golden/frontend/pages/home.expected.tsx"],
    ["generated/frontend/src/pages/product.tsx", "test/golden/frontend/pages/product.expected.tsx"],
    ["generated/frontend/src/components/productcard.tsx", "test/golden/frontend/components/productcard.expected.tsx"],
    ["generated/frontend/src/components/productdetail.tsx", "test/golden/frontend/components/productdetail.expected.tsx"],
    ["generated/frontend/src/components/productform.tsx", "test/golden/frontend/components/productform.expected.tsx"],
  ];

  for (const [s, d] of mapping) copyIfExists(s, d);

  console.log("Golden fixtures updated. Review and commit the changes.");
}

main();
