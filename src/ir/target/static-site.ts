import type { FrontendIR } from "../domain/frontend.js";
import type { StaticSitePolicy } from "./static-site.policy.js";

/**
 * Policies for static-site target.
 */
export interface StaticSitePolicies {
  staticSite: StaticSitePolicy;
}

/**
 * TargetIR for static-site emitters.
 * 
 * Static-site target uses FrontendIR as its domain IR input (same as electron),
 * and adds static-site-specific policies for HTML generation.
 */
export interface StaticSiteTargetIR extends FrontendIR {
  policies: StaticSitePolicies;
}

