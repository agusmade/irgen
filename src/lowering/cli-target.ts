import type { CliIR } from "../ir/domain/cli.js";
import type { CliTargetIR } from "../ir/target/cli.js";
import { engine } from "./engine.js";

export function cliDomainToTarget(ir: CliIR): CliTargetIR {
  return ir as CliTargetIR;
}

try {
  engine.registerTransform("cli-target", (ir: CliIR) => cliDomainToTarget(ir));
} catch (e) {
  // ignore duplicate registration
}

