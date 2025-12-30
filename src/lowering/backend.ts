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

function opKind(kind: "create" | "get" | "list" | "update" | "remove"): BackendOperationKind {
  if (kind === "create") return "CREATE";
  if (kind === "get") return "GET";
  if (kind === "update") return "UPDATE";
  if (kind === "remove") return "REMOVE";
  return "LIST";
}

import { engine } from "./engine.js";

export function declToBackendIR(app: DeclApp): BackendIR {
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
  };
}

// Register this backend lowering with the engine and a zod policy schema validator
try {
  engine.registerTransform("backend", (decl: any) => declToBackendIR(decl));
} catch (e) {
  // ignore if already registered (useful for repeated runs in test environment)
}
