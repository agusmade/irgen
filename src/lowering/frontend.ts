import type { DeclFrontendApp } from "../ir/decl/frontend.raw.schema.js";
import type { FrontendIR, FrontendPwaConfig, FrontendField, LoweredValidationRule } from "../ir/domain/frontend.js";
import { pascal } from "../utils/index.js";
import { initMacros, getMacro } from "./frontend/macros/index.js";

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

function lowerLogicExpression(logic: any): any {
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

function lowerActionSpec(action?: any) {
  if (!action) return undefined;
  if (action.kind === "invoke") {
    return {
      ...action,
      confirmMessage: action.confirmMessage,
      args: action.args ? lowerLogicExpression(action.args) : undefined,
    };
  }
  if (action.kind === "navigate") {
    return {
      ...action,
      confirmMessage: action.confirmMessage,
      to: lowerLogicExpression(action.to),
    };
  }
  return action;
}

export function declToFrontendIR(decl: DeclFrontendApp, policies?: any): FrontendIR {
  // Initialize macros registry
  initMacros();

  const mapComponent = (c: any): any[] => {
    // 1. Check for Macro
    if (c.macro) {
      const expander = getMacro(c.macro);
      if (!expander) {
        throw new Error(`Unknown macro: ${c.macro}`);
      }
      // Expand
      const expandedDecl = expander(c.props ?? {}, c);

      // Recursively lower the resulting components
      // (This flattening approach handles the 1-to-many expansion)
      return expandedDecl.flatMap(mapComponent);
    }

    // 2. Normal Component Mapping
    return [{
      name: c.name,
      props: c.props,
      entityRef: c.entityRef,
      agentChat: c.agentChat,
      cliUsage: c.cliUsage,
      form: c.form ? {
        ...c.form,
        load: c.form.load ? {
          ...c.form.load,
          args: lowerLogicExpression(c.form.load.args),
          when: lowerLogicExpression(c.form.load.when),
          mapFields: c.form.load.mapFields
            ? Object.fromEntries(Object.entries(c.form.load.mapFields).map(([k, v]) => [k, lowerLogicExpression(v)]))
            : undefined,
          onSuccess: lowerLogicExpression(c.form.load.onSuccess),
          onError: lowerLogicExpression(c.form.load.onError),
        } : undefined,
        submit: c.form.submit ? {
          ...c.form.submit,
        } : undefined,
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
      button: c.button ? { ...c.button, onClick: lowerActionSpec(c.button.onClick) } : undefined,
      themeToggle: c.themeToggle,
      codeBlock: c.codeBlock,
      marketing: c.marketing ? {
        ...c.marketing,
        actions: c.marketing.actions ? c.marketing.actions.map((a: any) => ({ ...a, onClick: lowerActionSpec(a.onClick) })) : undefined,
      } : undefined,
      table: c.table ? {
        ...c.table,
        rowActions: c.table.rowActions ? c.table.rowActions.map((a: any) => ({ ...a, onClick: lowerActionSpec(a.onClick) })) : undefined,
      } : undefined,
      // Macro is purposely excluded here
    }];
  };

  const pages = (decl.pages ?? []).map((p: any) => ({
    name: p.name,
    path: p.path,
    hideHeader: p.hideHeader,
    description: p.description,
    docsLayout: p.docsLayout,
    docsGroupLabel: p.docsGroupLabel,
    // Flatten components (handle macro expansion results)
    components: (p.components ?? []).flatMap(mapComponent)
  }));

  const auth = decl.auth
    ? {
      enabled: decl.auth.enabled ?? true,
      loginPath: decl.auth.loginPath ?? "/login",
      meOperationId: decl.auth.meOperationId ?? "auth.me",
      logoutOperationId: decl.auth.logoutOperationId ?? "auth.logout",
      hideLoginWhenAuthed: decl.auth.hideLoginWhenAuthed ?? true,
    }
    : undefined;

  const components = (decl.components ?? []).flatMap(mapComponent);

  return {
    domain: "frontend",
    appName: decl.name,
    basePath: decl.basePath ?? "/",
    pages,
    components,
    datasources: decl.datasources ?? [],
    operations: (decl.operations ?? []).map((op: any) => ({
      ...op,
      // In Phase 2, we might want to normalize logic expressions in operations too
      pathParams: lowerLogicExpression(op.pathParams),
      query: lowerLogicExpression(op.query),
      headers: lowerLogicExpression(op.headers),
      body: op.body ? {
        ...op.body,
        build: lowerLogicExpression(op.body.build)
      } : undefined,
      resultHandling: op.resultHandling ? {
        ...op.resultHandling,
        redirectTo: lowerLogicExpression(op.resultHandling.redirectTo),
        openUrl: lowerLogicExpression(op.resultHandling.openUrl),
        downloadAs: lowerLogicExpression(op.resultHandling.downloadAs),
      } : undefined
    })),
    resources: decl.resources ?? [],
    pwa: resolvePwaConfig(decl, policies),
    auth,
    requiredComponentKeys: decl.requiredComponentKeys,
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
