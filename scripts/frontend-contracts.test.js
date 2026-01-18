import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";

const execFileP = promisify(execFile);

async function main() {
  try {
    const outDir = path.resolve(process.cwd(), "generated-frontend-contracts");
    if (fs.existsSync(outDir)) {
      fs.rmSync(outDir, { recursive: true, force: true });
    }

    await execFileP(
      "npx",
      ["tsx", "src/cli.ts", "examples/frontend-contracts.dsl.ts", outDir, "--mode=frontend"],
      { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 },
    );

    const appPath = path.join(outDir, "src", "App.tsx");
    const tablePath = path.join(outDir, "src", "components", "posts-table.tsx");

    const appContent = fs.readFileSync(appPath, "utf-8");
    if (!appContent.includes('const authMeOp = useOperation("auth.me")')) {
      throw new Error("auth.me operation not wired in App");
    }
    if (!appContent.includes('const authLogoutOp = useOperation("auth.logout")')) {
      throw new Error("auth.logout operation not wired in App");
    }
    if (!appContent.includes('navigate("/login")')) {
      throw new Error("auth login redirect not generated");
    }
    if (!appContent.includes('link.path === "/login"')) {
      throw new Error("login link visibility guard not generated");
    }

    const tableContent = fs.readFileSync(tablePath, "utf-8");
    if (!tableContent.includes("Actions</th>")) {
      throw new Error("table row actions column not rendered");
    }
    if (!tableContent.includes('const tmpl = "/posts/:slug"')) {
      throw new Error("rowNavigateTo template not rendered");
    }
    if (!tableContent.includes('window.confirm("Delete this post?")')) {
      throw new Error("row action confirm message not rendered");
    }
    if (!tableContent.includes('useOperation("posts.delete")')) {
      throw new Error("row action invoke operation not wired");
    }

    console.log("frontend contracts test passed");
    process.exit(0);
  } catch (err) {
    console.error("frontend contracts test failed:", err);
    process.exit(1);
  }
}

main();
