import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function copyIfExists(src, dst, transform) {
  if (fs.existsSync(src)) {
    let content = fs.readFileSync(src, "utf-8");
    if (typeof transform === "function") {
      content = transform(content);
    }
    fs.writeFileSync(dst, content, "utf-8");
    console.log(`Updated golden: ${dst}`);
  } else {
    console.warn(`Missing generated file, skipping: ${src}`);
  }
}

function main() {
  console.log("Updating golden fixtures: running generator (backend + frontend + static-site)...");
  // ensure both backend and frontend artifacts exist
  execSync("npm run gen", { stdio: "inherit" });
  execSync("tsx src/cli.ts examples/static-no-enhance.dsl.ts --targets=static-site --outDir=generated/static-no-enhance", { stdio: "inherit" });
  execSync("tsx src/cli.ts examples/static-with-enhance.dsl.ts --targets=static-site --outDir=generated/static-with-enhance", { stdio: "inherit" });

  ensureDir(path.join("test", "golden"));
  ensureDir(path.join("test", "golden", "frontend", "lib"));
  ensureDir(path.join("test", "golden", "static-site", "no-enhance"));
  ensureDir(path.join("test", "golden", "static-site", "with-enhance"));

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
    ["generated/frontend/src/lib/logic.ts", "test/golden/frontend/lib/logic.expected.ts"],
    ["generated/frontend/src/pages/home.tsx", "test/golden/frontend/pages/home.expected.tsx"],
    ["generated/frontend/src/pages/product.tsx", "test/golden/frontend/pages/product.expected.tsx"],
    ["generated/frontend/src/components/product-card.tsx", "test/golden/frontend/components/product-card.expected.tsx"],
    ["generated/frontend/src/components/product-detail.tsx", "test/golden/frontend/components/product-detail.expected.tsx"],
    ["generated/frontend/src/components/product-form.tsx", "test/golden/frontend/components/product-form.expected.tsx"],
    ["generated/static-no-enhance/dist/index.html", "test/golden/static-site/no-enhance/index.expected.html"],
    ["generated/static-no-enhance/dist/assets/style.css", "test/golden/static-site/no-enhance/style.expected.css"],
    ["generated/static-with-enhance/dist/index.html", "test/golden/static-site/with-enhance/index.expected.html"],
    ["generated/static-with-enhance/dist/assets/style.css", "test/golden/static-site/with-enhance/style.expected.css"],
    ["generated/static-with-enhance/dist/assets/app.js", "test/golden/static-site/with-enhance/app.expected.js"],
    ["generated/static-with-enhance/dist/assets/search-index.json", "test/golden/static-site/with-enhance/search-index.expected.json"],
    ["generated/static-with-enhance/dist/index.html", "test/golden/static-site/with-enhance/js-off.expected.html"],
  ];

  for (const [s, d] of mapping) {
    if (d.endsWith("js-off.expected.html")) {
      copyIfExists(s, d, (html) => html.replace(/<script\\b[^>]*>[\\s\\S]*?<\\/script>/gi, ""));
    } else {
      copyIfExists(s, d);
    }
  }

  console.log("Golden fixtures updated. Review and commit the changes.");
}

main();
