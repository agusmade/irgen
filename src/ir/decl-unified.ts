import { DeclApp } from "./decl.js";

/**
 * Very small DeclUnified for POC: wraps one or more DeclApp (apps)
 * In a fuller implementation this will be a normalized, validated
 * single schema representing all declarations.
 */
export type DeclUnified = {
  apps: DeclApp[];
};

export function mergeIntoUnified(apps: DeclApp[] | DeclApp): DeclUnified {
  return { apps: Array.isArray(apps) ? apps : [apps] };
}
