import type { DeclCliApp } from "../ir/decl/cli.raw.schema.js";
import type { CliIR } from "../ir/domain/cli.js";
import { engine } from "./engine.js";
import { z } from "zod";

export function declToCliIR(decl: DeclCliApp): CliIR {
  return {
    domain: "cli",
    name: decl.name,
    commands: (decl.commands ?? []).map(cmd => ({
      name: cmd.name,
      description: cmd.description,
      options: cmd.options,
      action: cmd.action,
    })),
  };
}

try {
  engine.registerTransform("cli", (decl: DeclCliApp) => declToCliIR(decl));
  engine.registerPolicySchema("cli", z.object({}).passthrough());
} catch (e) {
  // ignore double registration in repeated runs
}
