import type { BackendIR } from "../../ir/domain/backend.js";
import type { BackendTargetIR } from "../../ir/target/backend.js";
import { engine } from "../engine.js";
import { z } from "zod";

export type BackendTargetPoliciesInput = {
  backend?: {
    generateId?: "uuid_v4" | "shortid" | "custom";
    loggerImpl?: "console" | "pino" | "winston" | "custom";
    httpClient?: "fetch" | "axios" | "got" | "custom";
    formatter?: "prettier" | "biome";
    db?: {
      provider: "prisma";
      url: string;
    };
  };
} | {
  generateId?: "uuid_v4" | "shortid" | "custom";
  loggerImpl?: "console" | "pino" | "winston" | "custom";
  httpClient?: "fetch" | "axios" | "got" | "custom";
  formatter?: "prettier" | "biome";
  db?: {
    provider: "prisma";
    url: string;
  };
};

const DEFAULT_POLICIES = {
  generateId: "uuid_v4",
  loggerImpl: "console",
  httpClient: "fetch",
  formatter: "prettier",
};

export function backendDomainToTarget(ir: BackendIR, policies?: BackendTargetPoliciesInput): BackendTargetIR {
  const raw = (policies as any)?.backend ?? policies ?? {};
  const finalPolicies = { ...DEFAULT_POLICIES, ...raw };

  const idProvider = finalPolicies.generateId === "uuid_v4" ? "newId" : (finalPolicies.generateId === "shortid" ? "shortId" : "newId");

  return {
    ...ir,
    policies: {
      backend: {
        ...finalPolicies,
        idProvider,
        db: (raw as any)?.db,
      },
    },
  };
}

try {
  const schema = z.object({
    generateId: z.enum(["uuid_v4", "shortid", "custom"]).optional(),
    loggerImpl: z.enum(["console", "pino", "winston", "custom"]).optional(),
    httpClient: z.enum(["fetch", "axios", "got", "custom"]).optional(),
    formatter: z.enum(["prettier", "biome"]).optional(),
    db: z.object({
      provider: z.literal("prisma"),
      url: z.string(),
    }).optional(),
  }).passthrough();

  engine.registerTransform("backend-target", (ir: BackendIR, policies?: any) => backendDomainToTarget(ir, policies));
  engine.registerPolicySchema("backend-target", schema);
} catch (e) {
  // ignore double registration in test runs
}
