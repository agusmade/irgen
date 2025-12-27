import type { DeclFrontendApp } from "../ir/frontend.js";
import type { FrontendIR } from "../ir/frontend.js";
import { pascal } from "../utils/index.js";

export function declToFrontendIR(decl: any): FrontendIR {
  const pages = (decl.pages ?? []).map((p: any) => ({ name: p.name, path: p.path, components: (p.components ?? []).map((c: any) => ({ name: c.name, props: c.props, entityRef: c.entityRef, form: c.form })) }));
  const components = (decl.components ?? []).map((c: any) => ({ name: c.name, props: c.props, entityRef: c.entityRef, form: c.form }));

  return {
    domain: "frontend",
    appName: decl.name,
    pages,
    components,
  };
}

// register with lowering engine
import { engine } from "./engine.js";
import { z } from "zod";
try {
  engine.registerTransform("frontend", (decl: any, policies?: any) => declToFrontendIR(decl));
  const schema = z.object({}); // currently no frontend policies
  engine.registerPolicySchema("frontend", schema);
} catch (e) {
  // ignore double registration in tests
}
