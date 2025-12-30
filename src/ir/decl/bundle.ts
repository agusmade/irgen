import type { DeclApp } from "./backend.raw.schema.js";
import type { DeclFrontendApp } from "./frontend.raw.schema.js";
import type { DeclCliApp } from "./cli.raw.schema.js";

export type DeclBundle = {
  apps: Array<DeclApp | DeclFrontendApp | DeclCliApp>;
};

// Pure bundle constructor: only wraps values; merge/conflict resolution lives in aggregator/normalize.
export function asBundle(apps: DeclApp[] | DeclFrontendApp[] | DeclCliApp[] | DeclApp | DeclFrontendApp | DeclCliApp): DeclBundle {
  return { apps: Array.isArray(apps) ? apps : [apps] };
}
