import type { FrontendIR } from "../domain/frontend.js";
import type { FrontendPolicy } from "./frontend.policy.js";

export interface FrontendTargetPolicies {
    frontend: FrontendPolicy;
}

/**
 * TargetIR for frontend emitters.
 */
export interface FrontendTargetIR extends FrontendIR {
    policies: FrontendTargetPolicies;
}

