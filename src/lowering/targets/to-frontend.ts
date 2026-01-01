import type { FrontendIR } from "../../ir/domain/frontend.js";
import type { FrontendTargetIR } from "../../ir/target/frontend.js";
import { normalizeFrontendPolicy } from "../../ir/target/frontend.policy.js";
import { engine } from "../engine.js";

function resolveFrontendPolicies(policies?: any) {
  const raw = policies?.frontend ?? policies;
  return {
    frontend: normalizeFrontendPolicy(raw),
  };
}

export function frontendDomainToTarget(ir: FrontendIR, policies?: any): FrontendTargetIR {
  return {
    ...ir,
    policies: resolveFrontendPolicies(policies),
  };
}

try {
  engine.registerTransform("frontend-target", (ir: FrontendIR, policies?: any) => frontendDomainToTarget(ir, policies));
} catch (e) {
  // ignore duplicate registration during repeated imports
}

