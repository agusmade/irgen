import { execSync } from "node:child_process";
import path from "node:path";

export function formatDirectory(outDir: string, formatter: string | undefined) {
  const fmt = formatter ?? "prettier";
  if (fmt === "none") return;

  if (fmt === "prettier") {
    try {
      // use npx to ensure available even if not installed globally
      // limit files to common extensions to reduce runtime
      const cmd = `npx prettier --write "${path.join(outDir, "**/*.{ts,js,json,md}")}"`;
      console.log("Running formatter:", cmd);
      execSync(cmd, { stdio: "inherit" });
    } catch (e) {
      console.warn("Formatter failed or not available; continuing without formatting.");
    }
  } else {
    console.warn(`Unknown formatter '${fmt}', skipping formatting.`);
  }
}
