import type { FrontendIR } from "../../ir/domain/frontend.js";
import type { FrontendTargetIR } from "../../ir/target/frontend.js";
import { normalizeFrontendPolicy, FrontendPolicySchema } from "../../ir/target/frontend.policy.js";
import { engine } from "../engine.js";
import { z } from "zod";

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
  // Accept both namespaced (frontend: {...}) and flat ({ styling: ..., framework: ...}) policy format
  // The normalizeFrontendPolicy function already handles both formats
  const namespacedSchema = z.object({ frontend: FrontendPolicySchema }).passthrough();
  const flexibleSchema = z.union([
    FrontendPolicySchema,
    namespacedSchema,
  ]);

  engine.registerTransform("frontend-target", (ir: FrontendIR, policies?: any) => frontendDomainToTarget(ir, policies));
  engine.registerPolicySchema("frontend-target", flexibleSchema);
} catch (e) {
  // ignore duplicate registration during repeated imports
}

