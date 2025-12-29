import type { DeclApp } from "../ir/decl/backend.raw.schema.js";
import type { BackendIR, BackendOperationKind } from "../ir/domain/backend.js";

/**
 * Lowering rules:
 * - Kita paksa konvensi canonical: CREATE/GET/LIST
 * - Method name ditentukan deterministik:
 *   CREATE -> create<Entity>
 *   GET    -> get<Entity>
 *   LIST   -> list<Entity>s (sederhana; nanti bisa pluralization rules)
 */

import { pascal, camel, pluralize } from "../utils/string.js";

export type LoweringPolicies = {
  generateId?: "uuid_v4" | "shortid" | "custom";
  loggerImpl?: "console" | "pino" | "winston" | "custom";
  httpClient?: "fetch" | "axios" | "got" | "custom";
  formatter?: "prettier" | "biome";
};

const DEFAULT_POLICIES: Required<LoweringPolicies> = {
  generateId: "uuid_v4",
  loggerImpl: "console",
  httpClient: "fetch",
  formatter: "prettier",
};

function opKind(kind: "create" | "get" | "list" | "update" | "remove"): BackendOperationKind {
  if (kind === "create") return "CREATE";
  if (kind === "get") return "GET";
  if (kind === "update") return "UPDATE";
  if (kind === "remove") return "REMOVE";
  return "LIST";
}

import { engine } from "./engine.js";

export function declToBackendIR(app: DeclApp, policies?: LoweringPolicies): BackendIR {
  const rawPolicies = (policies as any)?.backend ?? policies ?? {};
  const backendPolicy = { ...DEFAULT_POLICIES, ...rawPolicies };

  const idProvider = backendPolicy.generateId === "uuid_v4" ? "newId" : (backendPolicy.generateId === "shortid" ? "shortId" : "newId");
  const loggerProvider = backendPolicy.loggerImpl ?? "console";
  const httpProvider = backendPolicy.httpClient ?? "fetch";
  const appName = app.name ?? "app";

  return {
    domain: "backend",
    appName,
    entities: (app.entities ?? []).map(e => {
      const entityName = pascal(e.name ?? e.id);
      const ops = (e.operations ?? []).map(op => {
        const K = opKind(op.kind);
        const base =
          K === "CREATE" ? "create" :
            K === "GET" ? "get" :
              K === "UPDATE" ? "update" :
                K === "REMOVE" ? "remove" :
                  "list";
        const methodName =
          K === "LIST"
            ? camel(`${base} ${pluralize(entityName)}`)
            : camel(`${base} ${entityName}`);

        return { kind: K, entityName, methodName };
      });

      return {
        name: entityName,
        id: e.id,
        model: e.model ? Object.fromEntries(
          Object.entries(e.model).map(([k, t]) => [k, t])
        ) : undefined,
        operations: ops,
      };
    }),
    policies: {
      backend: {
        generateId: backendPolicy.generateId,
        idProvider,
        loggerImpl: loggerProvider,
        httpClient: httpProvider,
        formatter: backendPolicy.formatter,
        db: (app.meta["db"] as any) ?? undefined,
      },
    },
  };
}

// Register this backend lowering with the engine and a zod policy schema validator
import { z } from "zod";

try {
  engine.registerTransform("backend", (decl: any, policies?: any) => declToBackendIR(decl, policies));
  const schema = z.object({
    generateId: z.enum(["uuid_v4", "shortid", "custom"]).optional(),
    loggerImpl: z.enum(["console", "pino", "winston", "custom"]).optional(),
    httpClient: z.enum(["fetch", "axios", "got", "custom"]).optional(),
    formatter: z.enum(["prettier", "biome"]).optional(),
  });
  engine.registerPolicySchema("backend", schema);
} catch (e) {
  // ignore if already registered (useful for repeated runs in test environment)
}
