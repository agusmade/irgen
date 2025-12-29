import type { DeclApp } from "./backend.raw.schema.js";
import type { DeclFrontendApp } from "./frontend.schema.js";
import type { DeclCliApp } from "./cli.schema.js";

/**
 * DeclBundle: wadah deklarasi lintas domain (backend/frontend/cli).
 * Lebih eksplisit daripada nama "unified".
 */
export type DeclBundle = {
  apps: Array<DeclApp | DeclFrontendApp | DeclCliApp>;
};

export function mergeIntoBundle(apps: DeclApp[] | DeclFrontendApp[] | DeclCliApp[] | DeclApp | DeclFrontendApp | DeclCliApp): DeclBundle {
  return { apps: Array.isArray(apps) ? apps : [apps] };
}

// Backward-compatibility aliases
export type DeclUnified = DeclBundle;
export const mergeIntoUnified = mergeIntoBundle;
