import type { DeclApp } from "./backend.raw.schema.js";
import type { DeclFrontendApp } from "./frontend.raw.schema.js";
import type { DeclCliApp } from "./cli.raw.schema.js";

export type DeclBundleMeta = {
  policies?: Record<string, any>;
  targets?: string[];
  outDir?: string;
  [key: string]: any;
};

export type DeclBundle = {
  apps: Array<DeclApp | DeclFrontendApp | DeclCliApp>;
  meta?: DeclBundleMeta;
};

// Pure bundle constructor: only wraps values; merge/conflict resolution lives in aggregator/normalize.
export function asBundle(
  apps: DeclApp[] | DeclFrontendApp[] | DeclCliApp[] | DeclApp | DeclFrontendApp | DeclCliApp,
  meta?: DeclBundleMeta,
): DeclBundle {
  const appsArr = Array.isArray(apps) ? apps : [apps];
  const bundle: DeclBundle = { apps: appsArr.flat() as any };
  if (meta) bundle.meta = meta;
  return bundle;
}
