import type { FrontendIR } from "../../ir/domain/frontend.js";
import type { FrontendTargetIR } from "../../ir/target/frontend.js";
import { engine } from "../engine.js";

export function frontendDomainToTarget(ir: FrontendIR): FrontendTargetIR {
  // Pass-through for now to keep compatibility while isolating emitter-facing IR.
  return ir as FrontendTargetIR;
}

try {
  engine.registerTransform("frontend-target", (ir: FrontendIR) => frontendDomainToTarget(ir));
} catch (e) {
  // ignore duplicate registration during repeated imports
}

