/** BackendIR minimal (domain-specific) */

export type BackendOperationKind = "CREATE" | "GET" | "LIST" | "UPDATE" | "REMOVE";

export interface BackendOperation {
  kind: BackendOperationKind;
  entityName: string;
  methodName: string; // canonical naming hasil rules
}

export interface BackendEntity {
  name: string;
  id: string;
  // model holds typed fields for the entity (to be emitted as TypeScript interface)
  model?: Record<string, string>;
  operations: BackendOperation[];
}

export interface BackendIR {
  domain: "backend";
  appName: string;
  entities: BackendEntity[];
  policies: {
    idProvider: "newId" | "shortId";
    loggerImpl?: "console" | "pino" | "winston" | "custom";
    httpClient?: "fetch" | "axios" | "got" | "custom";
    generateId?: "uuid_v4" | "shortid" | "custom";
    formatter?: "prettier" | "biome";
    db?: {
      provider: "prisma"; // extensible later
      url: string;
    };
  };
}
