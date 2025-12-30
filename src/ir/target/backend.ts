import type { BackendIR } from "../domain/backend.js";

export interface BackendTargetPolicies {
  backend: {
    idProvider: "newId" | "shortId";
    loggerImpl?: "console" | "pino" | "winston" | "custom";
    httpClient?: "fetch" | "axios" | "got" | "custom";
    generateId?: "uuid_v4" | "shortid" | "custom";
    formatter?: "prettier" | "biome";
    db?: {
      provider: "prisma";
      url: string;
    };
  };
}

export interface BackendTargetIR extends BackendIR {
  policies: BackendTargetPolicies;
}

