import type { DeclFrontendApp } from "../ir/decl/frontend.raw.schema.js";
import type { FrontendIR, FrontendPwaConfig, FrontendField, LoweredValidationRule } from "../ir/domain/frontend.js";
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

function lowerValidators(f: any): LoweredValidationRule[] {
  const rules: LoweredValidationRule[] = [];
  const v = f.validators;
  if (!v) return rules;

  const label = f.label ?? f.name;

  if (v.required) {
    rules.push({ id: `${f.name}_required`, type: "required", message: `${label} is required` });
  }
  if (v.requiredIf) {
    rules.push({ id: `${f.name}_requiredIf`, type: "requiredIf", message: `${label} is required`, logic: v.requiredIf });
  }
  if (typeof v.min !== "undefined") {
    rules.push({ id: `${f.name}_min`, type: "min", message: `${label} must be >= ${v.min}`, params: { value: v.min } });
  }
  if (typeof v.max !== "undefined") {
    rules.push({ id: `${f.name}_max`, type: "max", message: `${label} must be <= ${v.max}`, params: { value: v.max } });
  }
  if (v.minDate) {
    rules.push({ id: `${f.name}_minDate`, type: "min", message: `${label} must be after ${v.minDate}`, params: { value: v.minDate, isDate: true } });
  }
  if (v.maxDate) {
    rules.push({ id: `${f.name}_maxDate`, type: "max", message: `${label} must be before ${v.maxDate}`, params: { value: v.maxDate, isDate: true } });
  }
  if (typeof v.minLength !== "undefined") {
    rules.push({ id: `${f.name}_minLength`, type: "minLength", message: `${label} must have length >= ${v.minLength}`, params: { value: v.minLength } });
  }
  if (typeof v.maxLength !== "undefined") {
    rules.push({ id: `${f.name}_maxLength`, type: "maxLength", message: `${label} must have length <= ${v.maxLength}`, params: { value: v.maxLength } });
  }
  if (v.pattern) {
    rules.push({ id: `${f.name}_pattern`, type: "pattern", message: `${label} is invalid`, params: { value: v.pattern } });
  }
  if (v.format === "email") {
    rules.push({ id: `${f.name}_email`, type: "format", message: `${label} must be a valid email`, params: { value: "email" } });
  }
  if (v.format === "url") {
    rules.push({ id: `${f.name}_url`, type: "format", message: `${label} must be a valid URL`, params: { value: "url" } });
  }
  if (v.equalsField) {
    rules.push({ id: `${f.name}_equals`, type: "equalsField", message: `${label} must match ${v.equalsField}`, params: { value: v.equalsField } });
  }
  if (v.notEqualsField) {
    rules.push({ id: `${f.name}_notEquals`, type: "notEqualsField", message: `${label} must differ from ${v.notEqualsField}`, params: { value: v.notEqualsField } });
  }
  if (v.greaterThanField) {
    rules.push({ id: `${f.name}_gt`, type: "greaterThanField", message: `${label} must be greater than ${v.greaterThanField}`, params: { value: v.greaterThanField } });
  }
  if (v.lessThanField) {
    rules.push({ id: `${f.name}_lt`, type: "lessThanField", message: `${label} must be less than ${v.lessThanField}`, params: { value: v.lessThanField } });
  }
  if (Array.isArray(v.custom)) {
    v.custom.forEach((c: any, idx: number) => {
      rules.push({ id: `${f.name}_custom_${idx}`, type: "custom", message: c.message ?? `${label} is invalid`, logic: c.logic });
    });
  }
  if (Array.isArray(v.uniqueIn)) {
    rules.push({ id: `${f.name}_unique`, type: "uniqueIn", message: `${label} must be unique`, params: { value: v.uniqueIn } });
  }

  return rules;
}

function extractLogicDependencies(logic: any): string[] {
  const deps = new Set<string>();
  const scan = (node: any) => {
    if (!node) return;
    if (typeof node === "string") {
      const trimmed = node.trim();
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") { scan(parsed); return; }
      } catch (_) { }
      const match = trimmed.match(/^([A-Za-z0-9_\\.]+)\\s*(==|===|!=|!==|>=|<=|>|<)\\s*(.+)$/);
      if (match) { deps.add(match[1]); } else { deps.add(trimmed); }
    } else if (Array.isArray(node)) {
      node.forEach(scan);
    } else if (typeof node === "object") {
      const entries = Object.entries(node);
      if (entries.length > 0) {
        const [op, val] = entries[0];
        if (op === "var" && typeof val === "string") {
          deps.add(val);
        } else if (Array.isArray(val)) {
          val.forEach(scan);
        } else {
          scan(val);
        }
      }
    }
  };
  scan(logic);
  return Array.from(deps).map(d => d.split(".")[0]); // only top-level for state tracking
}

function lowerLogicExpression(logic: string | undefined): any {
  if (!logic) return undefined;
  let parsed = logic;
  try {
    parsed = JSON.parse(logic);
  } catch (_) { }
  return {
    logic: parsed,
    dependencies: extractLogicDependencies(parsed)
  };
}

export function declToFrontendIR(decl: DeclFrontendApp, policies?: any): FrontendIR {
  const mapComponent = (c: any) => ({
    name: c.name,
    props: c.props,
    entityRef: c.entityRef,
    form: c.form ? {
      ...c.form,
      fields: (c.form.fields ?? []).map((f: any) => ({
        ...f,
        loweredValidators: lowerValidators(f),
        loweredVisibleIf: lowerLogicExpression(f.visibleIf),
        loweredDisabledIf: lowerLogicExpression(f.disabledIf),
        loweredDefaultValue: lowerLogicExpression(f.defaultValue),
        loweredComputeValue: lowerLogicExpression(f.computeValue),
      }))
    } : undefined,
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
