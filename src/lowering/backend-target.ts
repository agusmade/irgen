import type { BackendIR } from "../ir/domain/backend.js";
import type { BackendTargetIR } from "../ir/target/backend.js";
import { engine } from "./engine.js";

export function backendDomainToTarget(ir: BackendIR): BackendTargetIR {
  // Pass-through for now; this layer exists to separate domain IR decisions
  // from emitter-facing shapes when we start introducing target-specific tweaks.
  return ir as BackendTargetIR;
}

try {
  engine.registerTransform("backend-target", (ir: BackendIR) => backendDomainToTarget(ir));
} catch (e) {
  // ignore double registration in test runs
}

