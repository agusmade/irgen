import { z } from "zod";

// Static Site Assets Policy Schema
export const StaticSiteAssetsPolicySchema = z.object({
  hashing: z.boolean().default(true),
  publicDir: z.string().optional(),
}).default({});

// Static Site Enhancements Policy Schema
export const StaticSiteEnhancementFeatureSchema = z.enum([
  "sidebarToggle",
  "copyCode",
  "themeToggle",
  "tocScrollSpy",
  "tabs",
  "accordion",
  "search",
  "mermaid",
]);

export const StaticSiteEnhancementsPolicySchema = z.object({
  enabled: z.boolean().default(true),
  features: z.array(StaticSiteEnhancementFeatureSchema).default([]),
}).default({});

// Static Site Code Highlight Policy Schema
export const StaticSiteCodeHighlightPolicySchema = z.object({
  mode: z.enum(["pre", "client", "none"]).default("pre"),
  theme: z.string().optional(),
  addCopyButton: z.boolean().default(true),
}).default({});

// Static Site Search Policy Schema
export const StaticSiteSearchPolicySchema = z.object({
  mode: z.enum(["none", "client_index", "remote"]).default("none"),
  indexFile: z.string().default("assets/search-index.json"),
}).default({});

// Static Site SEO Sitemap Policy Schema
export const StaticSiteSitemapPolicySchema = z.object({
  enabled: z.boolean().default(true),
}).default({});

// Static Site SEO Robots Policy Schema
export const StaticSiteRobotsPolicySchema = z.object({
  enabled: z.boolean().default(true),
}).default({});

// Static Site SEO OpenGraph Policy Schema
export const StaticSiteOpenGraphPolicySchema = z.object({
  enabled: z.boolean().default(false),
}).default({});

// Static Site SEO Policy Schema
export const StaticSiteSeoPolicySchema = z.object({
  defaultTitle: z.string().default("irgen Documentation"),
  titleTemplate: z.string().default("%s · irgen"),
  defaultDescription: z.string().default("Compiler-style code generation via Intermediate Representation (IR)."),
  canonicalBaseUrl: z.string().nullable().default(null),
  sitemap: StaticSiteSitemapPolicySchema,
  robotsTxt: StaticSiteRobotsPolicySchema,
  openGraph: StaticSiteOpenGraphPolicySchema,
}).default({});

// Static Site Theme Policy Schema
export const StaticSiteThemePolicySchema = z.object({
  mode: z.enum(["light", "dark", "auto"]).default("auto"),
  accentColor: z.string().default("#3b82f6"),
  radius: z.enum(["sm", "md", "lg"]).default("md"),
}).default({});

// Static Site CSP Policy Schema
export const StaticSiteCspPolicySchema = z.object({
  enabled: z.boolean().default(false),
  value: z.string().optional(),
}).default({});

// Static Site External Links Policy Schema
export const StaticSiteExternalLinksPolicySchema = z.object({
  noopener: z.boolean().default(true),
  noreferrer: z.boolean().default(true),
}).default({});

// Static Site Security Policy Schema
export const StaticSiteSecurityPolicySchema = z.object({
  csp: StaticSiteCspPolicySchema,
  externalLinks: StaticSiteExternalLinksPolicySchema,
}).default({});

// Static Site Navbar Policy Schema
export const StaticSiteNavbarPolicySchema = z.object({
  links: z.array(z.object({
    label: z.string(),
    href: z.string(),
  })).default([]),
}).default({});

// Main Static Site Policy Schema
export const StaticSitePolicySchema = z.object({
  enabled: z.boolean().default(true),
  baseUrl: z.string().default("/"),
  trailingSlash: z.boolean().default(true),
  outDir: z.string().default("."),
  customCssPath: z.string().optional(),
  assets: StaticSiteAssetsPolicySchema,
  enhancements: StaticSiteEnhancementsPolicySchema,
  codeHighlight: StaticSiteCodeHighlightPolicySchema,
  search: StaticSiteSearchPolicySchema,
  seo: StaticSiteSeoPolicySchema,
  theme: StaticSiteThemePolicySchema,
  security: StaticSiteSecurityPolicySchema,
  navbar: StaticSiteNavbarPolicySchema,
}).default({});

// Namespaced format for DSL usage
export const StaticSitePolicyNamespacedSchema = z.object({
  staticSite: StaticSitePolicySchema,
}).passthrough();

// Union schema that accepts both formats (flat or namespaced)
export const StaticSitePolicyInputSchema = z.union([
  StaticSitePolicySchema,
  StaticSitePolicyNamespacedSchema,
]);

export type StaticSitePolicy = z.infer<typeof StaticSitePolicySchema>;
export type StaticSitePolicyNamespaced = z.infer<typeof StaticSitePolicyNamespacedSchema>;
export type StaticSitePolicyInput = z.infer<typeof StaticSitePolicyInputSchema>;

/**
 * Normalize static-site policy input to StaticSitePolicy.
 * Accepts both flat format ({ enabled: true, baseUrl: "/", ... })
 * and namespaced format ({ staticSite: { enabled: true, ... } }).
 */
export function normalizeStaticSitePolicy(input: unknown): StaticSitePolicy {
  const parsed = StaticSitePolicyInputSchema.parse(input);
  if ("staticSite" in parsed) {
    return parsed.staticSite;
  }
  return parsed;
}
