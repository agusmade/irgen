import type { BackendIR } from "../../ir/domain/backend.js";
import type { BackendTargetIR } from "../../ir/target/backend.js";
import { normalizeBackendPolicy, BackendPolicySchema } from "../../ir/target/backend.policy.js";
import { engine } from "../engine.js";
import { z } from "zod";

export type BackendTargetPoliciesInput = {
  backend?: unknown;
} | {
  [key: string]: unknown;
};

export function backendDomainToTarget(ir: BackendIR, policies?: BackendTargetPoliciesInput): BackendTargetIR {
  const raw = (policies as any)?.backend ?? policies ?? {};
  const normalized = normalizeBackendPolicy(raw);

  // Backward compatibility: allow legacy generateId/httpClient/formatter/loggerImpl/db fields at root
  const legacyGenerateId = (raw as any).generateId ?? (raw as any)?.core?.generateId;
  const legacyFormatter = (raw as any).formatter;
  const legacyLogger = (raw as any).loggerImpl;
  const legacyHttp = (raw as any).httpClient;
  const legacyDb = (raw as any).db;

  const generateId = legacyGenerateId ?? normalized.core.generateId ?? "uuid_v4";
  const idProvider = generateId === "shortid" ? "shortId" : "newId";

  const mergedPolicy = {
    ...normalized,
    core: {
      ...normalized.core,
      generateId,
      formatter: legacyFormatter ?? normalized.core.formatter,
      loggerImpl: legacyLogger ?? normalized.core.loggerImpl,
      httpClient: legacyHttp ?? normalized.core.httpClient,
      db: legacyDb ?? normalized.core.db,
    },
  };

  return {
    ...ir,
    policies: {
      backend: {
        ...mergedPolicy,
        idProvider,
      },
    },
  };
}

try {
  // Accept both new policy object and legacy top-level knobs for tests/CLI overrides
  const legacySchema = z.object({
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
  engine.registerPolicySchema("backend-target", z.union([BackendPolicySchema.strict(), legacySchema]));
} catch (e) {
  // ignore double registration in test runs
}
