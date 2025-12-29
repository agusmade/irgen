import type { DeclApp } from "./raw.schema.js";
import type { DeclFrontendApp } from "../domain/frontend.js";

/**
 * Very small DeclUnified for POC: wraps one or more DeclApp (apps)
 * In a fuller implementation this will be a normalized, validated
 * single schema representing all declarations.
 */
export type DeclUnified = {
  // mixed declarations (backend app or frontend app)
  apps: Array<DeclApp | DeclFrontendApp>;
};

export function mergeIntoUnified(apps: DeclApp[] | DeclFrontendApp[] | DeclApp | DeclFrontendApp): DeclUnified {
  return { apps: Array.isArray(apps) ? apps : [apps] };
}
