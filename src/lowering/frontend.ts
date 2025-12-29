import type { DeclFrontendApp } from "../ir/decl/frontend.schema.js";
import type { FrontendIR, FrontendPwaConfig } from "../ir/domain/frontend.js";
import { pascal } from "../utils/index.js";

export type FrontendPolicies = {
  pwa?: Partial<FrontendPwaConfig> & { enabled?: boolean };
};

const DEFAULT_PWA: FrontendPwaConfig = {
  enabled: false,
  name: "IR App",
  shortName: "IRApp",
  description: "Offline-ready web app",
  startUrl: "/",
  scope: "/",
  display: "standalone",
  backgroundColor: "#ffffff",
  themeColor: "#0f172a",
};

function resolvePolicies(policies?: any): FrontendPolicies {
  if (!policies) return {};
  // allow namespaced policies.frontend or direct
  return (policies.frontend ?? policies) as FrontendPolicies;
}

function resolvePwaConfig(decl: DeclFrontendApp, policies?: any): FrontendPwaConfig | undefined {
  const policy = resolvePolicies(policies);
  const pwaInput = policy?.pwa ?? decl.pwa;
  const enabled = pwaInput?.enabled ?? decl?.pwa?.enabled ?? false;
  if (!enabled) return undefined;

  return {
    ...DEFAULT_PWA,
    ...pwaInput,
    enabled: true,
    name: pwaInput?.name ?? decl.name,
    shortName: pwaInput?.shortName ?? pascal(decl.name).slice(0, 12),
  };
}

export function declToFrontendIR(decl: DeclFrontendApp, policies?: any): FrontendIR {
  const mapComponent = (c: any) => ({
    name: c.name,
    props: c.props,
    entityRef: c.entityRef,
    form: c.form,
    layout: c.layout,
    content: c.content,
    html: c.html,
    button: c.button,
  });

  const pages = (decl.pages ?? []).map((p: any) => ({ name: p.name, path: p.path, components: (p.components ?? []).map(mapComponent) }));
  const components = (decl.components ?? []).map(mapComponent);

  return {
    domain: "frontend",
    appName: decl.name,
    pages,
    components,
    pwa: resolvePwaConfig(decl, policies),
  };
}

// register with lowering engine
import { engine } from "./engine.js";
import { z } from "zod";
try {
  engine.registerTransform("frontend", (decl: any, policies?: any) => declToFrontendIR(decl, policies));
  const schema = z.object({
    pwa: z.object({
      enabled: z.boolean().optional(),
      name: z.string().optional(),
      shortName: z.string().optional(),
      description: z.string().optional(),
      startUrl: z.string().optional(),
      scope: z.string().optional(),
      display: z.string().optional(),
      backgroundColor: z.string().optional(),
      themeColor: z.string().optional(),
      orientation: z.string().optional(),
      icons: z.array(z.object({
        src: z.string(),
        sizes: z.string(),
        type: z.string(),
        purpose: z.string().optional(),
      })).optional(),
    }).optional(),
  }).passthrough();
  engine.registerPolicySchema("frontend", schema);
} catch (e) {
  // ignore double registration in tests
}
