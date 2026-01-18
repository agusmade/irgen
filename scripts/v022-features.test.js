import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";

const execFileP = promisify(execFile);

async function main() {
  try {
    const outDir = path.resolve(process.cwd(), "generated-v022-features");
    if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });

    await execFileP(
      "npx",
      ["tsx", "src/cli.ts", "examples/v022-features.dsl.ts", outDir, "--mode=frontend"],
      { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 },
    );

    const actionCard = path.join(outDir, "src", "components", "action-card.tsx");
    const macroSurface = path.join(outDir, "src", "components", "macro-surface.tsx");
    const heroCta = path.join(outDir, "src", "components", "hero-cta.tsx");
    const requiredComponents = path.join(outDir, "src", "lib", "required-components.ts");
    const runtime = path.join(outDir, "src", "lib", "runtime.ts");

    const actionContent = fs.readFileSync(actionCard, "utf-8");
    if (!actionContent.includes('useOperation("ping")')) {
      throw new Error("invoke action not wired to useOperation");
    }
    if (!actionContent.includes("handleButtonAction")) {
      throw new Error("button action handler not generated");
    }

    const macroContent = fs.readFileSync(macroSurface, "utf-8");
    // Layout-based macro expansion implies it should render children or contain layout logic
    // We check if the separate Card component file exists and has correct content
    const macroCard = path.join(outDir, "src", "components", "macro-surface-card.tsx");
    if (!fs.existsSync(macroCard)) {
      throw new Error("Macro expanded component (MacroSurface_Card) not found");
    }
    const cardContent = fs.readFileSync(macroCard, "utf-8");
    if (!cardContent.includes("Great for growing businesses")) {
      throw new Error("Expanded macro content mismatch");
    }

    const heroContent = fs.readFileSync(heroCta, "utf-8");
    if (!heroContent.includes("useNavigate")) {
      throw new Error("navigate action not wired");
    }

    const requiredContent = fs.readFileSync(requiredComponents, "utf-8");
    if (!requiredContent.includes("LegacyShell")) {
      throw new Error("requiredComponentKeys not emitted");
    }

    const runtimeContent = fs.readFileSync(runtime, "utf-8");
    if (!runtimeContent.includes("emit(\"toast\"")) {
      throw new Error("runtime toast signal not emitted");
    }
    if (!runtimeContent.includes("window.location.assign")) {
      throw new Error("runtime redirect signal not emitted");
    }
    if (!runtimeContent.includes("window.open")) {
      throw new Error("runtime openUrl signal not emitted");
    }

    console.log("v0.2.2 features test passed");
    process.exit(0);
  } catch (err) {
    console.error("v0.2.2 features test failed:", err);
    process.exit(1);
  }
}

main();
