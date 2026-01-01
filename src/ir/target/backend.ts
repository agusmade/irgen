import type { BackendIR } from "../domain/backend.js";
import type { BackendPolicy } from "./backend.policy.js";

export interface BackendTargetPolicies {
  backend: BackendPolicy & {
    idProvider: "newId" | "shortId";
  };
}

export interface BackendTargetIR extends BackendIR {
  policies: BackendTargetPolicies;
}
