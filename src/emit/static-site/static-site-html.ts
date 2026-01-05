import path from "node:path";
import crypto from "node:crypto";
import type { StaticSiteTargetIR } from "../../ir/target/static-site.js";
import { emitterEngine } from "../engine.js";
import { appendCustomCss, emitStaticSiteCss } from "./css.js";
import { emitEnhancements } from "./enhancements.js";

type WarningEntry = {
  code: "route_skipped" | "component_fallback" | "highlight_fallback" | "search_fallback";
  message: string;
  context?: string;
};

type HeadingEntry = {
  level: number;
  text: string;
  id: string;
};

type RenderContext = {
  headings: HeadingEntry[];
  usedIds: Map<string, number>;
};

type AssetManifest = {
  styleCss: string;
  prismCss?: string;
  prismJs?: string;
  appJs?: string;
  searchJs?: string;
  mermaidJs?: string;
};

type EnhancementCaps = {
  sidebarToggle: boolean;
  copyCode: boolean;
  themeToggle: boolean;
  tocScrollSpy: boolean;
  search: boolean;
  mermaid: boolean;
};

const FALLBACK_RULES: Array<{ component: string; fallback: string }> = [
  { component: "form", fallback: "Render static placeholder block (no inputs, no submission)." },
  { component: "themeToggle", fallback: "Render static badge text, no interactivity." },
  { component: "layout.tabs", fallback: "Render tabs as stacked sections with labels." },
];

const highlighterCache = new Map<string, Promise<any | null>>();
let warnedHighlight = false;

function normalizeLang(input: string): string {
  const lang = input.trim().toLowerCase();
  if (!lang) return "text";
  const map: Record<string, string> = {
    ts: "typescript",
    js: "javascript",
    bash: "shellscript",
    sh: "shellscript",
    shell: "shellscript",
    zsh: "shellscript",
  };
  return map[lang] ?? lang;
}

async function getHighlighter(theme: string, lang: string): Promise<any | null> {
  const key = `${theme}::${lang}`;
  if (highlighterCache.has(key)) return highlighterCache.get(key) ?? null;
  const promise = (async () => {
    try {
      const shiki = await import("shiki/bundle/full");
      return await shiki.getHighlighter({ themes: [theme], langs: [lang] });
    } catch (_) {
      return null;
    }
  })();
  highlighterCache.set(key, promise);
  return promise;
}

async function highlightCode(
  snippet: string,
  language: string,
  theme: string,
  warnings: WarningEntry[],
): Promise<string | null> {
  const normalized = normalizeLang(language);
  const highlighter = await getHighlighter(theme, normalized);
  if (!highlighter) {
    if (!warnedHighlight) {
      warnings.push({
        code: "highlight_fallback",
        message: "Shiki not available; falling back to plain code blocks. Run npm install if dependencies are missing.",
      });
      warnedHighlight = true;
    }
    return null;
  }
  try {
    return highlighter.codeToHtml(snippet, { lang: normalized, theme });
  } catch (_) {
    warnings.push({
      code: "highlight_fallback",
      message: `Failed to highlight code for language "${normalized}".`,
      context: normalized,
    });
    return null;
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(input: string): string {
  return escapeHtml(input);
}

function safeAttr(value: unknown): string {
  if (value === null || value === undefined) return "";
  return escapeAttr(String(value));
}

function normalizeBaseUrl(baseUrl: string): string {
  const normalized = baseUrl.startsWith("/") ? baseUrl : `/${baseUrl}`;
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

function isDynamicRoute(routePath: string): boolean {
  return /[:*]/.test(routePath);
}

function normalizeRoutePath(routePath: string): string {
  if (!routePath.startsWith("/")) return `/${routePath}`;
  return routePath;
}

function toFilePath(routePath: string, trailingSlash: boolean): string {
  const cleaned = normalizeRoutePath(routePath).replace(/\/+$/, "");
  if (cleaned === "" || cleaned === "/") return "index.html";
  const relative = cleaned.replace(/^\//, "");
  if (trailingSlash) return path.join(relative, "index.html");
  return `${relative}.html`;
}

function toHref(baseUrl: string, routePath: string, trailingSlash: boolean): string {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const cleaned = normalizeRoutePath(routePath).replace(/\/+$/, "");
  if (cleaned === "" || cleaned === "/") return normalizedBase;
  const suffix = trailingSlash ? `${cleaned}/` : cleaned;
  return `${normalizedBase.replace(/\/+$/, "")}${suffix}`;
}

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function buildExternalRel(security: any): string {
  const parts: string[] = [];
  if (security?.externalLinks?.noopener) parts.push("noopener");
  if (security?.externalLinks?.noreferrer) parts.push("noreferrer");
  return parts.join(" ");
}

function renderWarningBox(message: string): string {
  return `<div class="irgen-warning">${escapeHtml(message)}</div>`;
}

function safeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return escapeHtml(String(value));
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nextHeadingId(text: string, ctx: RenderContext): string {
  const base = slugify(text) || "section";
  const existing = ctx.usedIds.get(base) ?? 0;
  const next = existing + 1;
  ctx.usedIds.set(base, next);
  return next === 1 ? base : `${base}-${next}`;
}

function renderHeading(level: number, text: string, ctx: RenderContext, includeCopy: boolean = true): string {
  const id = nextHeadingId(text, ctx);
  ctx.headings.push({ level, text, id });
  const button = includeCopy
    ? `<button class="irgen-heading-copy" type="button" data-irgen-copy-anchor="#${safeAttr(id)}" aria-label="Copy link to ${safeAttr(text)}">
         <span class="irgen-icon" aria-hidden="true">
           <svg viewBox="0 0 24 24" role="presentation"><path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 1 0-7.07-7.07L10.5 4.1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.93a5 5 0 0 0 7.07 7.07L13.5 19.9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
         </span>
       </button>`
    : "";
  return `<h${level} id="${safeAttr(id)}" class="irgen-heading"><span class="irgen-heading-text">${safeText(text)}</span>${button}</h${level}>`;
}

function renderActionLinks(actions: any[], security: any): string {
  if (!Array.isArray(actions) || actions.length === 0) return "";
  const links = actions.map((a: any) => {
    const href = a?.href ? safeAttr(a.href) : "#";
    const label = safeText(a?.label ?? "Action");
    const rel = isExternalUrl(String(a?.href ?? "")) ? buildExternalRel(security) : "";
    const relAttr = rel ? ` rel="${safeAttr(rel)}"` : "";
    return `<a class="irgen-action-link" href="${href}"${relAttr}>${label}</a>`;
  }).join("");
  return `<div class="irgen-actions">${links}</div>`;
}

function renderItemList(items: any[], ordered: boolean): string {
  if (!Array.isArray(items) || items.length === 0) return "";
  const tag = ordered ? "ol" : "ul";
  const entries = items.map((i: any) => {
    const title = i?.title ? `<strong>${safeText(i.title)}</strong>` : "";
    const desc = i?.description ? `<span>${safeText(i.description)}</span>` : "";
    const value = i?.value ? `<span>${safeText(i.value)}</span>` : "";
    const label = i?.label ? `<span>${safeText(i.label)}</span>` : "";
    const body = [title, desc, value, label].filter(Boolean).join(" ");
    return `<li>${body || safeText(i)}</li>`;
  }).join("");
  return `<${tag} class="irgen-list">${entries}</${tag}>`;
}

function renderStatsTable(items: any[]): string {
  if (!Array.isArray(items) || items.length === 0) return "";
  const rows = items.map((i: any) => {
    const label = safeText(i?.label ?? i?.title ?? "");
    const value = safeText(i?.value ?? "");
    if (!label && !value) return "";
    return `<tr><th>${label}</th><td>${value}</td></tr>`;
  }).filter(Boolean).join("");
  if (!rows) return "";
  return `<table class="irgen-table"><tbody>${rows}</tbody></table>`;
}

function renderMarketing(marketing: any, ctx: RenderContext, security: any): string {
  const kind = marketing?.kind ?? "generic";
  const title = marketing.title ? renderHeading(2, marketing.title, ctx, false) : "";
  const subtitle = marketing.subtitle ? `<p>${safeText(marketing.subtitle)}</p>` : "";
  const badge = marketing.badge ? `<span class="irgen-badge">${safeText(marketing.badge)}</span>` : "";
  const actions = renderActionLinks(marketing.actions ?? [], security);
  const items = marketing.items ?? [];

  if (kind === "hero") {
    return `<section class="irgen-marketing irgen-hero">${badge}${title}${subtitle}${actions}</section>`;
  }
  if (kind === "features" || kind === "logos" || kind === "testimonials") {
    const list = renderItemList(items, false);
    return `<section class="irgen-marketing irgen-${kind}">${title}${subtitle}${list}${actions}</section>`;
  }
  if (kind === "faq") {
    const list = renderItemList(items, false);
    return `<section class="irgen-marketing irgen-faq">${title}${subtitle}${list}</section>`;
  }
  if (kind === "timeline") {
    const list = renderItemList(items, true);
    return `<section class="irgen-marketing irgen-timeline">${title}${subtitle}${list}</section>`;
  }
  if (kind === "stats") {
    const table = renderStatsTable(items);
    return `<section class="irgen-marketing irgen-stats">${title}${subtitle}${table}</section>`;
  }
  if (kind === "cta") {
    return `<section class="irgen-marketing irgen-cta">${title}${subtitle}${actions}</section>`;
  }

  const list = renderItemList(items, false);
  return `<section class="irgen-marketing">${badge}${title}${subtitle}${list}${actions}</section>`;
}

async function renderCodeBlock(
  ir: StaticSiteTargetIR,
  codeBlock: any,
  warnings: WarningEntry[],
): Promise<string> {
  const mode = ir.policies.staticSite.codeHighlight?.mode ?? "pre";
  const theme = ir.policies.staticSite.codeHighlight?.theme ?? "github-dark";
  const addCopy = ir.policies.staticSite.codeHighlight?.addCopyButton ?? true;
  const language = normalizeLang(codeBlock.language ?? "text");
  const snippet = codeBlock.snippet ?? "";
  const copyButton = addCopy
    ? `<button class="irgen-copy-button irgen-icon-button" type="button" data-irgen-copy-code>
         <span class="irgen-icon" aria-hidden="true">
           <svg viewBox="0 0 24 24" role="presentation"><path d="M9 9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V9z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
         </span>
         <span class="irgen-button-label">Copy</span>
       </button>`
    : "";

  if (language === "mermaid" && ir.policies.staticSite.enhancements?.features?.includes("mermaid")) {
    return `<div class="irgen-code irgen-mermaid" data-irgen-code data-irgen-lang="mermaid">${copyButton}<pre class="mermaid">${escapeHtml(snippet)}</pre></div>`;
  }

  if (mode === "pre") {
    const highlighted = await highlightCode(snippet, language, theme, warnings);
    if (highlighted) {
      return `<div class="irgen-code" data-irgen-code data-irgen-lang="${safeAttr(language)}">${copyButton}${highlighted}</div>`;
    }
  }

  const langClass = language ? ` class="language-${safeAttr(language)}"` : "";
  const attrs = mode === "client" ? ` data-irgen-highlight="client"` : "";
  return `<div class="irgen-code" data-irgen-code data-irgen-lang="${safeAttr(language)}"${attrs}>${copyButton}<pre><code${langClass}>${escapeHtml(snippet)}</code></pre></div>`;
}

async function renderComponent(
  ir: StaticSiteTargetIR,
  component: any,
  componentsByName: Map<string, any>,
  ctx: RenderContext,
  warnings: WarningEntry[],
): Promise<string> {
  const renderContentParts = async (): Promise<string> => {
    const parts: string[] = [];
    if (component.content) parts.push(`<p>${escapeHtml(component.content)}</p>`);
    if (component.html) parts.push(`<div>${escapeHtml(component.html)}</div>`);
    if (component.codeBlock) {
      parts.push(await renderCodeBlock(ir, component.codeBlock, warnings));
    }
    if (component.button?.label) {
      parts.push(`<button type="button">${escapeHtml(component.button.label)}</button>`);
    }
    return parts.join("");
  };

  const props = component.props ?? {};
  const hideTitle = props.hideTitle === "true" || props.hideTitle === "1";
  const customTitle = typeof props.title === "string" && props.title.trim().length > 0 ? props.title.trim() : "";
  const headingText = hideTitle ? "" : (customTitle || component.name);
  const heading = headingText ? renderHeading(2, headingText, ctx) : "";

  if (component.form && component.form.fields?.length) {
    warnings.push({
      code: "component_fallback",
      message: `Component "${component.name}" uses form; rendered as static placeholder.`,
      context: component.name,
    });
    return `<section class="irgen-component">${heading}${renderWarningBox("Form component rendered as static placeholder.")}</section>`;
  }

  if (component.themeToggle) {
    warnings.push({
      code: "component_fallback",
      message: `Component "${component.name}" uses themeToggle; rendered as static placeholder.`,
      context: component.name,
    });
    return `<section class="irgen-component">${heading}${renderWarningBox("Theme toggle rendered as static placeholder.")}</section>`;
  }

  if (component.layout?.kind === "tabs") {
    warnings.push({
      code: "component_fallback",
      message: `Component "${component.name}" uses layout.tabs; rendered as stacked sections.`,
      context: component.name,
    });
    const tabs = component.layout.tabs ?? [];
    const tabHtmlParts: string[] = [];
    for (const t of tabs) {
      const label = t.label ? renderHeading(3, t.label, ctx, false) : "";
      const content = t.content ? `<p>${escapeHtml(t.content)}</p>` : "";
      let items = "";
      if (Array.isArray(t.items)) {
        const itemParts: string[] = [];
        for (const n of t.items) {
          const child = componentsByName.get(n);
          itemParts.push(child ? await renderComponent(ir, child, componentsByName, ctx, warnings) : renderWarningBox(`Missing component: ${n}`));
        }
        items = itemParts.join("");
      }
      tabHtmlParts.push(`<section class="irgen-tab">${label}${content}${items}</section>`);
    }
    const tabHtml = tabHtmlParts.join("");
    return `<section class="irgen-component">${tabHtml || renderWarningBox("Tabs rendered as stacked sections.")}</section>`;
  }

  if (component.layout) {
    const title = component.layout.title ? renderHeading(2, component.layout.title, ctx) : "";
    const contentParts = await renderContentParts();
    const itemParts: string[] = [];
    for (const n of component.layout.items ?? []) {
      const child = componentsByName.get(n);
      itemParts.push(child ? await renderComponent(ir, child, componentsByName, ctx, warnings) : renderWarningBox(`Missing component: ${n}`));
    }
    const items = itemParts.join("");
    return `<section class="irgen-component irgen-layout">${title}${contentParts}${items}</section>`;
  }

  if (component.marketing) {
    return `<section class="irgen-component">${renderMarketing(component.marketing, ctx, ir.policies.staticSite.security)}</section>`;
  }

  const partsHtml = await renderContentParts();

  if (!partsHtml) {
    warnings.push({
      code: "component_fallback",
      message: `Component "${component.name}" has no renderable content; rendered as placeholder.`,
      context: component.name,
    });
    return `<section class="irgen-component">${heading}${renderWarningBox("Component rendered as empty placeholder.")}</section>`;
  }

  return `<section class="irgen-component">${heading}${partsHtml}</section>`;
}

function renderBreadcrumbs(baseUrl: string, routePath: string, trailingSlash: boolean, pageName: string): string {
  const cleaned = normalizeRoutePath(routePath).replace(/\/+$/, "");
  if (cleaned === "" || cleaned === "/") return "";
  const parts = cleaned.replace(/^\//, "").split("/").filter(Boolean);
  const crumbs: string[] = [];
  let acc = "";
  for (const part of parts.slice(0, -1)) {
    acc += `/${part}`;
    const href = toHref(baseUrl, acc, trailingSlash);
    crumbs.push(`<li><a href="${safeAttr(href)}">${safeText(part)}</a></li>`);
  }
  crumbs.push(`<li><span>${safeText(pageName)}</span></li>`);
  return `<nav class="irgen-breadcrumbs"><ol>${crumbs.join("")}</ol></nav>`;
}

function formatTitle(title: string, template: string | undefined): string {
  if (!template) return title;
  if (template.includes("%s")) return template.replace("%s", title);
  return `${title} ${template}`;
}

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSitemapXml(urls: string[]): string {
  const entries = urls.map((u) => `  <url><loc>${escapeXml(u)}</loc></url>`).join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    "</urlset>",
  ].join("\n");
}

function buildRobotsTxt(sitemapUrl: string | null): string {
  const lines = ["User-agent: *", "Allow: /"];
  if (sitemapUrl) lines.push(`Sitemap: ${sitemapUrl}`);
  return `${lines.join("\n")}\n`;
}

function buildToc(ctx: RenderContext): string {
  const entries = ctx.headings.filter((h) => h.level >= 2 && h.level <= 3);
  if (entries.length < 2) return "";
  const items = entries.map((h) => {
    return `<li class="irgen-toc-level-${h.level}"><a href="#${safeAttr(h.id)}" data-irgen-toc-link="${safeAttr(h.id)}">${safeText(h.text)}</a></li>`;
  }).join("");
  return `<nav class="irgen-toc" data-irgen-toc><h2>On this page</h2><ul>${items}</ul></nav>`;
}

function validateHeadings(ctx: RenderContext, warnings: WarningEntry[], pageName: string): void {
  const h1Count = ctx.headings.filter((h) => h.level === 1).length;
  if (h1Count !== 1) {
    warnings.push({
      code: "component_fallback",
      message: `Page "${pageName}" has ${h1Count} H1 headings; expected exactly 1.`,
      context: pageName,
    });
  }
  let prevLevel = 0;
  for (const h of ctx.headings) {
    if (prevLevel > 0 && h.level - prevLevel > 1) {
      warnings.push({
        code: "component_fallback",
        message: `Heading level jump from H${prevLevel} to H${h.level} in page "${pageName}".`,
        context: pageName,
      });
      break;
    }
    prevLevel = h.level;
  }
}

function assetHref(filePath: string, assetName: string): string {
  const rel = path.posix.relative(path.posix.dirname(filePath), `assets/${assetName}`);
  return rel || `assets/${assetName}`;
}

function relHref(fromFilePath: string, targetRelPath: string): string {
  const rel = path.posix.relative(path.posix.dirname(fromFilePath), targetRelPath);
  return rel || targetRelPath;
}

async function renderPage(
  ir: StaticSiteTargetIR,
  page: any,
  pagesForNav: any[],
  warnings: WarningEntry[],
  caps: EnhancementCaps,
  emitAppJs: boolean,
  assets: AssetManifest,
  fontAssets: string[],
): Promise<string> {
  const policy = ir.policies.staticSite;
  const baseUrl = policy.baseUrl ?? "/";
  const trailingSlash = policy.trailingSlash ?? true;
  const filePath = toFilePath(page.path, trailingSlash);
  const cssHref = assetHref(filePath, assets.styleCss);
  const prismCssHref = assets.prismCss ? assetHref(filePath, assets.prismCss) : "";
  const prismJsHref = assets.prismJs ? assetHref(filePath, assets.prismJs) : "";
  const appJsHref = assets.appJs ? assetHref(filePath, assets.appJs) : "";
  const searchJsHref = assets.searchJs ? assetHref(filePath, assets.searchJs) : "";
  const rawTitle = page.name || policy.seo?.defaultTitle || ir.appName;
  const title = formatTitle(rawTitle, policy.seo?.titleTemplate);
  const description = page.description || policy.seo?.defaultDescription || "";
  const themeMode = policy.theme?.mode ?? "auto";
  const htmlAttrs: string[] = ['lang="en"'];
  const themeScript = `
  <script>
    (function() {
      try {
        var pref = localStorage.getItem("irgen-theme");
        var theme = pref || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        document.documentElement.setAttribute("data-theme", theme);
      } catch (_) {}
    })();
  </script>
  `.trim();
  if (themeMode === "light" || themeMode === "dark") {
    htmlAttrs.push(`data-theme="${themeMode}"`);
  }
  const highlightMode = policy.codeHighlight?.mode ?? "pre";
  const includeClientHighlight = highlightMode === "client";
  const canonicalBase = policy.seo?.canonicalBaseUrl;
  const canonicalUrl = canonicalBase ? toHref(canonicalBase, page.path, trailingSlash) : null;
  const cspValue = policy.security?.csp?.enabled ? (policy.security?.csp?.value ?? "default-src 'self'; base-uri 'self'; object-src 'none'") : null;
  const navItems = pagesForNav.map((p) => {
    const href = toHref(baseUrl, p.path, trailingSlash);
    return `<li><a href="${safeAttr(href)}">${escapeHtml(p.name)}</a></li>`;
  }).join("");
  const breadcrumbs = renderBreadcrumbs(baseUrl, page.path, trailingSlash, page.name);
  const searchIndexFile = policy.search?.indexFile ?? "assets/search-index.json";
  const searchIndexHref = relHref(filePath, searchIndexFile);
  const mermaidJsHref = assets.mermaidJs ? assetHref(filePath, assets.mermaidJs) : "";
  const navbarLinks = policy.navbar?.links ?? [];
  const headerNav = navbarLinks.length
    ? `<nav class="irgen-header-nav"><ul>${navbarLinks.map((link: any) => {
        const href = link?.href ? safeAttr(link.href) : "#";
        const label = safeText(link?.label ?? "Link");
        const rel = isExternalUrl(String(link?.href ?? "")) ? buildExternalRel(policy.security) : "";
        const relAttr = rel ? ` rel="${safeAttr(rel)}"` : "";
        return `<li><a href="${href}"${relAttr}>${label}</a></li>`;
      }).join("")}</ul></nav>`
    : "";
  const searchBox = caps.search
    ? `<div class="irgen-search" data-irgen-search data-irgen-search-index="${safeAttr(searchIndexHref)}">
        <span class="irgen-search-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="presentation"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" fill="none"/><path d="M20 20L16.5 16.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </span>
        <input type="search" placeholder="Search..." aria-label="Search" data-irgen-search-input />
        <div class="irgen-search-results" data-irgen-search-results></div>
      </div>`
    : "";
  const preloadFonts = fontAssets.map((asset) => {
    const href = relHref(filePath, asset);
    return `  <link rel="preload" href="${safeAttr(href)}" as="font" type="font/woff2" crossorigin />`;
  }).join("\n");

  const componentsByName = new Map<string, any>();
  for (const c of ir.components ?? []) componentsByName.set(c.name, c);

  const ctx: RenderContext = { headings: [], usedIds: new Map() };
  const normalizeText = (input: string) => input.trim().toLowerCase();
  const heroMatchesTitle = (page.components ?? []).some((component: any) => {
    const hero = component?.marketing;
    if (!hero || hero.kind !== "hero" || !hero.title) return false;
    return normalizeText(hero.title) === normalizeText(page.name ?? "");
  });
  const pageHeading = page.hideHeader || heroMatchesTitle ? "" : renderHeading(1, page.name, ctx);
  if (!pageHeading && heroMatchesTitle) {
    // Preserve a single H1 in the document outline when hero title replaces page heading.
    renderHeading(1, page.name, ctx, false);
  }
  const bodyParts: string[] = [];
  for (const c of page.components ?? []) {
    bodyParts.push(await renderComponent(ir, c, componentsByName, ctx, warnings));
  }
  const bodyContent = bodyParts.join("");
  const toc = buildToc(ctx);
  validateHeadings(ctx, warnings, page.name);

  return [
    "<!DOCTYPE html>",
    `<html ${htmlAttrs.join(" ")}>`,
    "<head>",
    '  <meta charset="UTF-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    cspValue ? `  <meta http-equiv="Content-Security-Policy" content="${safeAttr(cspValue)}" />` : "",
    description ? `  <meta name="description" content="${safeAttr(description)}" />` : "",
    canonicalUrl ? `  <link rel="canonical" href="${safeAttr(canonicalUrl)}" />` : "",
    `  <link rel="stylesheet" href="${safeAttr(cssHref)}" />`,
    themeScript,
    includeClientHighlight && assets.prismCss ? `  <link rel="stylesheet" href="${safeAttr(prismCssHref)}" />` : "",
    preloadFonts,
    `  <title>${escapeHtml(title)}</title>`,
    policy.seo?.openGraph?.enabled ? `  <meta property="og:title" content="${safeAttr(title)}" />` : "",
    policy.seo?.openGraph?.enabled && description ? `  <meta property="og:description" content="${safeAttr(description)}" />` : "",
    policy.seo?.openGraph?.enabled ? `  <meta property="og:type" content="website" />` : "",
    policy.seo?.openGraph?.enabled && canonicalUrl ? `  <meta property="og:url" content="${safeAttr(canonicalUrl)}" />` : "",
    "</head>",
    "<body>",
    `  <a class="irgen-skip-link" href="#irgen-main">Skip to content</a>`,
    `  <header class="irgen-header">`,
    `    <div class="irgen-header-left">`,
    `      <div class="irgen-site-title">${escapeHtml(ir.appName)}</div>`,
    headerNav,
    `    </div>`,
    `    <div class="irgen-header-actions">`,
    searchBox,
    caps.sidebarToggle ? `      <button class="irgen-sidebar-toggle irgen-icon-button" type="button" data-irgen-sidebar-toggle aria-controls="irgen-sidebar" aria-expanded="true">
        <span class="irgen-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="presentation"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </span>
        <span class="irgen-button-label">Menu</span>
      </button>` : "",
    caps.themeToggle ? `      <button class="irgen-theme-toggle irgen-icon-button" type="button" data-irgen-theme-toggle aria-pressed="false">
        <span class="irgen-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="presentation"><path d="M12 3a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1zM12 18.5a1 1 0 0 1 1 1V21a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1zM4 11a1 1 0 0 1 1 1h1.5a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1 1 1 0 0 1 1-1zm13.5 1a1 1 0 1 1 0-2H19a1 1 0 1 1 0 2h-1.5zM6.2 6.2a1 1 0 0 1 1.4 0l1.06 1.06a1 1 0 1 1-1.42 1.42L6.2 7.6a1 1 0 0 1 0-1.4zm10.6 10.6a1 1 0 0 1 1.4 0l1.06 1.06a1 1 0 1 1-1.42 1.42l-1.04-1.06a1 1 0 0 1 0-1.4zM6.2 17.8a1 1 0 0 1 0-1.4l1.06-1.06a1 1 0 1 1 1.42 1.42L7.6 17.8a1 1 0 0 1-1.4 0zm10.6-10.6a1 1 0 0 1 0-1.4l1.06-1.06a1 1 0 1 1 1.42 1.42l-1.04 1.04a1 1 0 0 1-1.4 0zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" fill="currentColor"/></svg>
        </span>
        <span class="irgen-button-label">Theme</span>
      </button>` : "",
    `    </div>`,
    `  </header>`,
    `  <div class="irgen-layout-grid">`,
    `    <aside class="irgen-sidebar" id="irgen-sidebar"><nav class="irgen-nav"><ul>${navItems}</ul></nav></aside>`,
    `    <main class="irgen-main" id="irgen-main">`,
    `      ${breadcrumbs}`,
    `      ${toc}`,
    `      ${pageHeading}`,
    `      ${bodyContent}`,
    `    </main>`,
    `  </div>`,
    `  <footer class="irgen-footer"><small>Generated by irgen</small></footer>`,
    includeClientHighlight && assets.prismJs ? `  <script defer src="${safeAttr(prismJsHref)}"></script>` : "",
    caps.search && assets.searchJs ? `  <script defer src="${safeAttr(searchJsHref)}"></script>` : "",
    emitAppJs && assets.appJs ? `  <script defer src="${safeAttr(appJsHref)}"></script>` : "",
    caps.mermaid && assets.mermaidJs ? `  <script defer src="${safeAttr(mermaidJsHref)}"></script>` : "",
    "</body>",
    "</html>",
  ].join("\n");
}

async function copyDirRecursive(srcDir: string, destDir: string): Promise<void> {
  const fs = await import("node:fs/promises");
  await fs.mkdir(destDir, { recursive: true });
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      try {
        await fs.access(destPath);
        continue;
      } catch (_) {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

async function copyPublicAssets(outDir: string, publicDir: string | undefined): Promise<void> {
  if (!publicDir) return;
  const srcDir = path.isAbsolute(publicDir) ? publicDir : path.resolve(process.cwd(), publicDir);
  try {
    const fs = await import("node:fs/promises");
    const stat = await fs.stat(srcDir);
    if (!stat.isDirectory()) return;
    await copyDirRecursive(srcDir, outDir);
  } catch (_) {
    console.warn(`[static-site emitter] Public assets folder not found: ${srcDir}`);
  }
}

async function collectFontAssets(outDir: string): Promise<string[]> {
  const fs = await import("node:fs/promises");
  const results: string[] = [];

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && entry.name.endsWith(".woff2")) {
        const rel = path.relative(outDir, full).split(path.sep).join(path.posix.sep);
        results.push(rel);
      }
    }
  }

  try {
    await walk(outDir);
  } catch (_) {
    return [];
  }

  return results;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, " ");
}

function collectComponentText(component: any): string {
  const parts: string[] = [];
  if (component.name) parts.push(String(component.name));
  if (component.content) parts.push(String(component.content));
  if (component.html) parts.push(stripTags(String(component.html)));
  if (component.codeBlock?.snippet) parts.push(String(component.codeBlock.snippet));
  if (component.button?.label) parts.push(String(component.button.label));
  if (component.layout?.title) parts.push(String(component.layout.title));
  if (component.marketing?.title) parts.push(String(component.marketing.title));
  if (component.marketing?.subtitle) parts.push(String(component.marketing.subtitle));
  if (Array.isArray(component.marketing?.items)) {
    for (const item of component.marketing.items) {
      if (item?.title) parts.push(String(item.title));
      if (item?.description) parts.push(String(item.description));
      if (item?.value) parts.push(String(item.value));
      if (item?.label) parts.push(String(item.label));
    }
  }
  if (Array.isArray(component.marketing?.actions)) {
    for (const action of component.marketing.actions) {
      if (action?.label) parts.push(String(action.label));
    }
  }
  return parts.join(" ");
}

function collectPageText(page: any): string {
  const parts: string[] = [];
  if (page.name) parts.push(String(page.name));
  if (page.description) parts.push(String(page.description));
  for (const c of page.components ?? []) {
    parts.push(collectComponentText(c));
  }
  return parts.join(" ");
}

async function emitSearchIndex(
  outDir: string,
  pages: any[],
  baseUrl: string,
  trailingSlash: boolean,
  indexFile: string,
): Promise<void> {
  const fs = await import("node:fs/promises");
  const items = pages.map((p, idx) => ({
    id: idx + 1,
    title: p.name,
    description: p.description ?? "",
    url: toHref(baseUrl, p.path, trailingSlash),
    content: collectPageText(p),
  }));
  const abs = path.join(outDir, indexFile);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, JSON.stringify({ items }, null, 2), "utf-8");
}

async function hashAndRenameAsset(outDir: string, assetName: string): Promise<string> {
  const fs = await import("node:fs/promises");
  const assetPath = path.join(outDir, "assets", assetName);
  try {
    const content = await fs.readFile(assetPath);
    const hash = crypto.createHash("sha256").update(content).digest("hex").slice(0, 8);
    const ext = path.extname(assetName);
    const base = path.basename(assetName, ext);
    const hashedName = `${base}.${hash}${ext}`;
    const hashedPath = path.join(outDir, "assets", hashedName);
    await fs.rename(assetPath, hashedPath);
    return hashedName;
  } catch (_) {
    return assetName;
  }
}

async function copySearchLibrary(outDir: string): Promise<string | null> {
  try {
    const { createRequire } = await import("node:module");
    const require = createRequire(import.meta.url);
    let pkgDir: string | null = null;
    try {
      const pkgPath = require.resolve("minisearch/package.json");
      pkgDir = path.dirname(pkgPath);
    } catch (_) {
      pkgDir = null;
    }
    const candidates = [
      ...(pkgDir ? [
        path.join(pkgDir, "dist", "umd", "index.min.js"),
        path.join(pkgDir, "dist", "umd", "index.js"),
        path.join(pkgDir, "dist", "minisearch.min.js"),
        path.join(pkgDir, "dist", "minisearch.js"),
      ] : []),
      path.resolve(process.cwd(), "node_modules", "minisearch", "dist", "umd", "index.min.js"),
      path.resolve(process.cwd(), "node_modules", "minisearch", "dist", "umd", "index.js"),
      path.resolve(process.cwd(), "node_modules", "minisearch", "dist", "minisearch.min.js"),
      path.resolve(process.cwd(), "node_modules", "minisearch", "dist", "minisearch.js"),
    ];
    let resolved: string | null = null;
    for (const c of candidates) {
      try {
        await (await import("node:fs/promises")).access(c);
        resolved = c;
        break;
      } catch (_) {
        // try next
      }
    }
    if (!resolved) return null;
    const fs = await import("node:fs/promises");
    const outPath = path.join(outDir, "assets", "minisearch.js");
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.copyFile(resolved, outPath);
    return "minisearch.js";
  } catch (_) {
    return null;
  }
}

async function copyMermaidLibrary(outDir: string): Promise<string | null> {
  const candidates = [
    path.resolve(process.cwd(), "node_modules", "mermaid", "dist", "mermaid.min.js"),
  ];
  for (const candidate of candidates) {
    try {
      const fs = await import("node:fs/promises");
      await fs.access(candidate);
      const outPath = path.join(outDir, "assets", "mermaid.min.js");
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.copyFile(candidate, outPath);
      return "mermaid.min.js";
    } catch (_) {
      // try next
    }
  }
  return null;
}

export async function emitStaticSite(ir: StaticSiteTargetIR, outDir: string): Promise<void> {
  const policy = ir.policies.staticSite;
  const policyOut = (policy.outDir ?? ".").trim();
  const finalOutDir = policyOut === "." || policyOut === "" ? outDir : path.join(outDir, policyOut);
  const warnings: WarningEntry[] = [];
  const hasCode = (ir.pages ?? []).some((p) => (p.components ?? []).some((c: any) => c.codeBlock))
    || (ir.components ?? []).some((c: any) => c.codeBlock);
  const hasMermaid = (ir.pages ?? []).some((p) => (p.components ?? []).some((c: any) => {
    const lang = String(c?.codeBlock?.language ?? "").toLowerCase();
    return lang === "mermaid";
  })) || (ir.components ?? []).some((c: any) => {
    const lang = String(c?.codeBlock?.language ?? "").toLowerCase();
    return lang === "mermaid";
  });
  const baseUrl = policy.baseUrl ?? "/";
  const trailingSlash = policy.trailingSlash ?? true;
  const sitemapBase = policy.seo?.canonicalBaseUrl ?? baseUrl;
  const features = policy.enhancements?.features ?? [];
  const enhancementsEnabled = policy.enhancements?.enabled ?? true;
  const caps: EnhancementCaps = {
    sidebarToggle: enhancementsEnabled && features.includes("sidebarToggle"),
    copyCode: enhancementsEnabled && features.includes("copyCode") && hasCode && (policy.codeHighlight?.addCopyButton ?? true),
    themeToggle: enhancementsEnabled && features.includes("themeToggle"),
    tocScrollSpy: enhancementsEnabled && features.includes("tocScrollSpy"),
    search: enhancementsEnabled && features.includes("search") && (policy.search?.mode ?? "none") === "client_index",
    mermaid: enhancementsEnabled && features.includes("mermaid") && hasMermaid,
  };
  const emitAppJs = caps.sidebarToggle || caps.copyCode || caps.themeToggle || caps.tocScrollSpy || caps.search || caps.mermaid;

  const fs = await import("node:fs/promises");
  await fs.mkdir(finalOutDir, { recursive: true });
  await emitStaticSiteCss(finalOutDir, { accentColor: policy.theme?.accentColor });
  await copyPublicAssets(finalOutDir, policy.assets?.publicDir);
  if (policy.customCssPath) {
    await appendCustomCss(finalOutDir, policy.customCssPath);
  }
  if (emitAppJs) {
    await emitEnhancements(finalOutDir, caps);
  }
  let prismCss = "prism.css";
  let prismJs = "prism.js";
  if ((policy.codeHighlight?.mode ?? "pre") === "client" && hasCode) {
    try {
      const { createRequire } = await import("node:module");
      const require = createRequire(import.meta.url);
      const prismJsPath = require.resolve("prismjs");
      const prismCssPath = require.resolve("prismjs/themes/prism.css");
      const prismJsOut = path.join(finalOutDir, "assets", "prism.js");
      const prismCssOut = path.join(finalOutDir, "assets", "prism.css");
      await fs.mkdir(path.dirname(prismJsOut), { recursive: true });
      await fs.copyFile(prismJsPath, prismJsOut);
      await fs.copyFile(prismCssPath, prismCssOut);
    } catch (err) {
      warnings.push({
        code: "highlight_fallback",
        message: "Failed to load Prism.js assets; client highlighting disabled.",
      });
      prismCss = "";
      prismJs = "";
    }
  }

  const assets: AssetManifest = {
    styleCss: "style.css",
    prismCss: prismCss || undefined,
    prismJs: prismJs || undefined,
    appJs: emitAppJs ? "app.js" : undefined,
    searchJs: undefined,
    mermaidJs: undefined,
  };

  if (caps.search && policy.search?.mode === "client_index") {
    const searchLib = await copySearchLibrary(finalOutDir);
    if (searchLib) {
      assets.searchJs = searchLib;
    } else {
      warnings.push({
        code: "search_fallback",
        message: "MiniSearch asset not found; falling back to basic search. Run npm install if dependencies are missing.",
      });
    }
  }

  if (caps.mermaid) {
    const mermaidLib = await copyMermaidLibrary(finalOutDir);
    if (mermaidLib) {
      assets.mermaidJs = mermaidLib;
    } else {
      warnings.push({
        code: "component_fallback",
        message: "Mermaid asset not found; diagrams will render as plain code blocks.",
      });
    }
  }

  if (policy.assets?.hashing) {
    assets.styleCss = await hashAndRenameAsset(finalOutDir, assets.styleCss);
    if (assets.prismCss) assets.prismCss = await hashAndRenameAsset(finalOutDir, assets.prismCss);
    if (assets.prismJs) assets.prismJs = await hashAndRenameAsset(finalOutDir, assets.prismJs);
    if (assets.appJs) assets.appJs = await hashAndRenameAsset(finalOutDir, assets.appJs);
    if (assets.searchJs) assets.searchJs = await hashAndRenameAsset(finalOutDir, assets.searchJs);
    if (assets.mermaidJs) assets.mermaidJs = await hashAndRenameAsset(finalOutDir, assets.mermaidJs);
  }

  const fontAssets = await collectFontAssets(finalOutDir);

  const pages = (ir.pages ?? []).filter((p) => {
    if (isDynamicRoute(p.path)) {
      warnings.push({
        code: "route_skipped",
        message: `Skipping dynamic route "${p.path}" (static-site Phase 2).`,
        context: p.path,
      });
      return false;
    }
    return true;
  });

  if (caps.search && policy.search?.mode === "client_index") {
    const indexFile = policy.search?.indexFile ?? "assets/search-index.json";
    await emitSearchIndex(finalOutDir, pages, baseUrl, trailingSlash, indexFile);
  }

  for (const page of pages) {
    const filePath = toFilePath(page.path, policy.trailingSlash ?? true);
    const absPath = path.join(finalOutDir, filePath);
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    const html = await renderPage(ir, page, pages, warnings, caps, emitAppJs, assets, fontAssets);
    await fs.writeFile(absPath, html, "utf-8");
  }

  if (policy.seo?.sitemap?.enabled) {
    const urls = pages.map((p) => toHref(sitemapBase, p.path, trailingSlash));
    const sitemapXml = buildSitemapXml(urls);
    await fs.writeFile(path.join(finalOutDir, "sitemap.xml"), sitemapXml, "utf-8");
  }

  if (policy.seo?.robotsTxt?.enabled) {
    const sitemapUrl = policy.seo?.sitemap?.enabled
      ? toHref(sitemapBase, "/sitemap.xml", false)
      : null;
    const robotsTxt = buildRobotsTxt(sitemapUrl);
    await fs.writeFile(path.join(finalOutDir, "robots.txt"), robotsTxt, "utf-8");
  }

  if (warnings.length > 0) {
    console.warn("[static-site emitter] Warnings:");
    for (const w of warnings) {
      console.warn(`- ${w.code}: ${w.message}${w.context ? ` (${w.context})` : ""}`);
    }
    console.warn("[static-site emitter] Fallback rules:");
    for (const rule of FALLBACK_RULES) {
      console.warn(`- ${rule.component}: ${rule.fallback}`);
    }
  }
}

// Register emitter
try {
  emitterEngine.registerEmitter("static-site-html", emitStaticSite);
} catch (e) {
  // ignore if already registered
}
