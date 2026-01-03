import type { FrontendIR } from "../../ir/domain/frontend.js";
import type { StaticSiteTargetIR, StaticSitePolicies } from "../../ir/target/static-site.js";
import { normalizeStaticSitePolicy, StaticSitePolicyInputSchema } from "../../ir/target/static-site.policy.js";
import { engine } from "../engine.js";

export type StaticSitePolicyInput = {
  staticSite?: unknown;
} | {
  [key: string]: unknown;
};

function resolvePolicies(policies?: StaticSitePolicyInput): StaticSitePolicies {
  const raw = (policies as any)?.staticSite ?? policies ?? {};
  const normalized = normalizeStaticSitePolicy(raw);
  
  return {
    staticSite: normalized,
  };
}

/**
 * Target lowering: FrontendIR → StaticSiteTargetIR
 * 
 * Note: Static-site target uses FrontendIR as its domain IR input (same as electron),
 * so the function name follows the pattern:
 * {domain}DomainTo{Target}Target -> frontendDomainToStaticSiteTarget
 */
export function frontendDomainToStaticSiteTarget(ir: FrontendIR, policies?: StaticSitePolicyInput): StaticSiteTargetIR {
  return {
    ...ir,
    policies: resolvePolicies(policies),
  };
}

try {
  engine.registerTransform("static-site-target", (ir: FrontendIR, policies?: any) => frontendDomainToStaticSiteTarget(ir, policies));
  engine.registerPolicySchema("static-site-target", StaticSitePolicyInputSchema);
} catch (e) {
  // ignore double registration
}

