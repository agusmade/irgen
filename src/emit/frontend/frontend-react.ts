import path from "node:path";
import fs from "node:fs";
import { Project, QuoteKind, IndentationText, ScriptTarget } from "ts-morph";
import type { FrontendTargetIR } from "../../ir/target/frontend.js";
import { emitterEngine } from "../engine.js";
import { registerTargetEmitter } from "../registry.js";
import { pascal, kebab } from "../../utils/string.js";
import { emitSsgSupport } from "./ssg.js";
import { emitRuntime } from "./runtime-emitter.js";
import { emitFrontendPackageJson } from "./frontend-package.js";
import { emitPwaAssets } from "./frontend-pwa.js";
import { emitViteConfig } from "./frontend-vite.js";
import { emitTailwindConfig } from "./frontend-tailwind.js";
import { emitSharedLogic, emitRequiredComponents } from "./frontend-shared.js";
import { emitPage } from "./frontend-pages.js";
import { emitComponent } from "./frontend-components.js";
import {
  buildSearchIndex,
  escapeHtml,
  hasMarkdownCodeBlocks,
  hasMarkdownMermaid,
  renderInlineMarkdown,
  renderMarkdownToHtml,
  slugifyHeading,
  ensureDir,
} from "./frontend-helpers.js";


export function emitFrontend(project: Project, outDir: string, ir: FrontendTargetIR) {
  const frontendDir = path.join(outDir, "src");
  ensureDir(frontendDir);

  const policy = ir.policies.frontend;
  const mode = policy.framework.rendering.mode;
  const isSsg = mode === "ssg" || mode === "hybrid";
  const hasMarkdownCode = hasMarkdownCodeBlocks(ir);
  const hasMermaid = hasMarkdownMermaid(ir);
  const visualPolicy = (policy as any).visual ?? (policy as any).ui?.visual ?? {};
  const visualNavLayout = visualPolicy.navLayout ?? (policy.styling?.themePack === "admin" ? "sidebar" : "topbar");
  const visualContentWidth = visualPolicy.contentWidth ?? "normal";
  const visualDensity = visualPolicy.density ?? "normal";
  const visualTopbarControls = visualPolicy.topbarControls ?? {};
  const visualBrand = visualPolicy.brand ?? {};
  const visualNavItems = visualPolicy.navItems ?? {};
  const visualSearch = visualPolicy.search ?? {};
  const visualFooterLinks = visualPolicy.footerLinks ?? null;
  const visualFooter = visualPolicy.footer ?? {};
  const visualDocs = visualPolicy.docs ?? {};
  const visualBackground = visualPolicy.background ?? {};
  const visualLabels = visualPolicy.labels ?? {};
  const visualMotion = visualPolicy.motion ?? {};
  const visualTokens = visualPolicy.tokens ?? {};
  const visualIcons = visualPolicy.icons ?? {};
  const visualBreakpoints = visualPolicy.breakpoints ?? {};
  const visualCopy = visualPolicy.copy ?? {};
  const docsLinks = (ir.pages ?? [])
    .filter((page) => page.docsLayout)
    .map((page) => ({ name: page.name, path: page.path, groupLabel: page.docsGroupLabel }));
  const docsGroupLabels = Array.from(
    new Set(docsLinks.map((link) => link.groupLabel).filter((label): label is string => Boolean(label))),
  );
  const docsGroupLabel = docsGroupLabels.length === 1 ? docsGroupLabels[0] : "Docs";
  const humanizePageName = (name: string) =>
    name
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  const navbarLinks = (ir.pages ?? [])
    .filter((page) => !page.docsLayout && !page.path.includes(":"))
    .map((page) => ({ name: humanizePageName(page.name), path: page.path }));
  if (docsLinks.length > 0) {
    navbarLinks.push({ name: docsGroupLabel, path: docsLinks[0].path });
  }

  emitFrontendPackageJson(outDir, ir);
  emitPwaAssets(outDir, ir);
  emitViteConfig(project, outDir, policy);
  emitSharedLogic(project, frontendDir);
  emitRequiredComponents(project, frontendDir, ir);
  emitRuntime(project, frontendDir, ir);

  const searchIndex = buildSearchIndex(ir);
  project.createSourceFile(
    path.join(frontendDir, "lib", "search-index.ts"),
    `export const SEARCH_INDEX = ${JSON.stringify(searchIndex, null, 2)} as const;\n`,
    { overwrite: true },
  );

  // client entry (CSR + optional hydration for hybrid)
  const clientEntry = project.createSourceFile(path.join(frontendDir, "entry-client.tsx"), "", { overwrite: true });
  clientEntry.addImportDeclaration({ moduleSpecifier: "react", defaultImport: "React" });
  clientEntry.addImportDeclaration({
    moduleSpecifier: "react-dom/client",
    namedImports: mode === "hybrid" ? ["hydrateRoot", "createRoot"] : ["createRoot"],
  });
  clientEntry.addImportDeclaration({ moduleSpecifier: "react-router-dom", namedImports: ["BrowserRouter"] });
  clientEntry.addImportDeclaration({ moduleSpecifier: "./index.css" });
  clientEntry.addImportDeclaration({ moduleSpecifier: "./App", namedImports: ["App"] });
  if (hasMarkdownCode) {
    clientEntry.addImportDeclaration({ moduleSpecifier: "prismjs/themes/prism.css" });
    clientEntry.addImportDeclaration({ moduleSpecifier: "prismjs/components/prism-markup" });
    clientEntry.addImportDeclaration({ moduleSpecifier: "prismjs/components/prism-markup-templating" });
    clientEntry.addImportDeclaration({ moduleSpecifier: "prismjs/components/prism-clike" });
    clientEntry.addImportDeclaration({ moduleSpecifier: "prismjs/components/prism-javascript" });
    clientEntry.addImportDeclaration({ moduleSpecifier: "prismjs/components/prism-typescript" });
    clientEntry.addImportDeclaration({ moduleSpecifier: "prismjs/components/prism-jsx" });
    clientEntry.addImportDeclaration({ moduleSpecifier: "prismjs/components/prism-tsx" });
    clientEntry.addImportDeclaration({ moduleSpecifier: "prismjs/components/prism-json" });
    clientEntry.addImportDeclaration({ moduleSpecifier: "prismjs/components/prism-bash" });
    clientEntry.addImportDeclaration({ moduleSpecifier: "prismjs/components/prism-css" });
  }

  const policyBasePath = policy.framework.rendering.basePath || "/";
  const irBasePath = ir.basePath || "/";
  const basePathRaw = policyBasePath !== "/" ? policyBasePath : irBasePath;
  const basePath = basePathRaw.replace(/\/$/, "") || "/";
  const hasBasePath = basePath !== "/";

  if (mode === "hybrid") {
    clientEntry.addStatements(`
const rootElement = document.getElementById('root') as HTMLElement | null;
if (rootElement) {
  const modeFlag = rootElement.dataset.irgenInteractive;
  if (modeFlag === "false") {
    // no hydrate for static-only pages
  } else if (modeFlag === "csr" || !modeFlag) {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <BrowserRouter${hasBasePath ? ` basename="${basePath}"` : ""}>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
  } else {
    hydrateRoot(
      rootElement,
      <React.StrictMode>
        <BrowserRouter${hasBasePath ? ` basename="${basePath}"` : ""}>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
  }
}
    `.trim());
  } else {
    clientEntry.addStatements(`
const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <BrowserRouter${hasBasePath ? ` basename="${basePath}"` : ""}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
    `.trim());
  }

  if (ir.pwa?.enabled) {
    const swBasePath = basePath !== "/" ? basePath : "";
    clientEntry.addStatements(`
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('${swBasePath}/pwa-sw.js').catch(err => {
      console.error('Service worker registration failed', err);
    });
  });
}
    `.trim());
  }

  // compatibility entry for legacy tooling/tests
  project.createSourceFile(
    path.join(frontendDir, "index.tsx"),
    `import "./entry-client";`,
    { overwrite: true },
  );

  if (isSsg) {
    emitSsgSupport(project, outDir, frontendDir, ir);
  }

  // App.tsx
  const appFile = project.createSourceFile(path.join(frontendDir, "App.tsx"), "", { overwrite: true });
  const appReactImports = ["useEffect", "useMemo", "useState"];
  appFile.addImportDeclaration({ moduleSpecifier: "react", namedImports: appReactImports });
  const authConfig = ir.auth?.enabled ? ir.auth : undefined;
  const authMeOpId = authConfig?.meOperationId ?? "auth.me";
  const authLogoutOpId = authConfig?.logoutOperationId ?? "auth.logout";
  const authLoginPath = authConfig?.loginPath ?? "/login";
  const hideLoginWhenAuthed = authConfig?.hideLoginWhenAuthed ?? true;
  const routerImports = ["Routes", "Route", "Link", "useLocation", "useNavigate"];
  appFile.addImportDeclaration({ moduleSpecifier: "react-router-dom", namedImports: routerImports });
  appFile.addImportDeclaration({ moduleSpecifier: "lucide-react", namespaceImport: "Icons" });
  if (authConfig) {
    appFile.addImportDeclaration({ moduleSpecifier: "./lib/hooks", namedImports: ["useOperation"] });
  }
  if (hasMarkdownCode) {
    appFile.addImportDeclaration({ moduleSpecifier: "prismjs", defaultImport: "Prism" });
  }
  if (hasMermaid) {
    appFile.addImportDeclaration({ moduleSpecifier: "mermaid", defaultImport: "mermaid" });
  }
  appFile.addImportDeclaration({ moduleSpecifier: "./lib/search-index", namedImports: ["SEARCH_INDEX"] });

  // Import all pages
  ir.pages.forEach(p => {
    appFile.addImportDeclaration({ moduleSpecifier: `./pages/${kebab(p.name)}`, namedImports: [`${pascal(p.name)}Page`] });
  });

  const appFn = appFile.addFunction({ name: "App", isExported: true });

  appFn.setBodyText(writer => {
    writer.writeLine("const [isDark, setIsDark] = useState(() => {");
    writer.writeLine("  if (typeof window !== 'undefined') {");
    writer.writeLine("    return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';");
    writer.writeLine("  }");
    writer.writeLine("  return false;");
    writer.writeLine("});");
    writer.writeLine("const [searchOpen, setSearchOpen] = useState(false);");
    writer.writeLine("const [searchQuery, setSearchQuery] = useState(\"\");");
    writer.writeLine("const [tocItems, setTocItems] = useState([] as Array<{ id: string; text: string; level: number }>);");
    writer.writeLine("const [activeToc, setActiveToc] = useState(\"\" as string);");
    writer.writeLine("const location = useLocation();");
    writer.writeLine("const navigate = useNavigate();");
    writer.writeLine(`const basePath = "${policy.framework.rendering.basePath}".replace(/\\/$/, "") || "/";`);
    writer.writeLine("const relativePath = location.pathname.startsWith(basePath) ? location.pathname.substring(basePath.length) || '/' : location.pathname;");
    writer.writeLine(`const themePack = ${JSON.stringify(policy.styling?.themePack ?? "default")};`);
    writer.writeLine("const isAdminTheme = themePack === \"admin\";");
    writer.writeLine(`const visualNavLayout = ${JSON.stringify(visualNavLayout)};`);
    writer.writeLine(`const visualContentWidth = ${JSON.stringify(visualContentWidth)};`);
    writer.writeLine(`const visualDensity = ${JSON.stringify(visualDensity)};`);
    writer.writeLine(`const visualTopbarControls = ${JSON.stringify(visualTopbarControls)};`);
    writer.writeLine(`const visualBrand = ${JSON.stringify(visualBrand)};`);
    writer.writeLine(`const visualNavItems = ${JSON.stringify(visualNavItems)};`);
    writer.writeLine(`const visualSearch = ${JSON.stringify(visualSearch)};`);
    writer.writeLine(`const visualFooterLinks = ${JSON.stringify(visualFooterLinks)};`);
    writer.writeLine(`const visualFooter = ${JSON.stringify(visualFooter)};`);
    writer.writeLine(`const visualDocs = ${JSON.stringify(visualDocs)};`);
    writer.writeLine(`const visualBackground = ${JSON.stringify(visualBackground)};`);
    writer.writeLine(`const visualLabels = ${JSON.stringify(visualLabels)};`);
    writer.writeLine(`const visualMotion = ${JSON.stringify(visualMotion)};`);
    writer.writeLine(`const visualTokens = ${JSON.stringify(visualTokens)};`);
    writer.writeLine(`const visualIcons = ${JSON.stringify(visualIcons)};`);
    writer.writeLine(`const visualBreakpoints = ${JSON.stringify(visualBreakpoints)};`);
    writer.writeLine(`const visualCopy = ${JSON.stringify(visualCopy)};`);
    writer.writeLine("const topbarControlsEnabled = visualTopbarControls.enabled !== false;");
    writer.writeLine("const topbarItems = Array.isArray(visualTopbarControls.items) && visualTopbarControls.items.length > 0 ? visualTopbarControls.items : [\"search\", \"notifications\", \"themeToggle\", \"avatar\"];");
    writer.writeLine("const topbarCustom = Array.isArray(visualTopbarControls.custom) ? visualTopbarControls.custom : [];");
    writer.writeLine("const searchConfig = visualSearch || {};");
    writer.writeLine("const searchEnabled = searchConfig.enabled !== false;");
    writer.writeLine("const searchPlaceholder = searchConfig.placeholder || \"Search docs...\";");
    writer.writeLine("const searchEmptyMessage = searchConfig.emptyMessage || \"No results\";");
    writer.writeLine("const showSearch = topbarControlsEnabled && topbarItems.includes(\"search\") && searchEnabled;");
    writer.writeLine("const showNotifications = topbarControlsEnabled && topbarItems.includes(\"notifications\");");
    writer.writeLine("const showThemeToggle = topbarControlsEnabled && topbarItems.includes(\"themeToggle\");");
    writer.writeLine("const showAvatar = topbarControlsEnabled && topbarItems.includes(\"avatar\");");
    writer.writeLine("const avatarConfig = visualTopbarControls.avatar || {};");
    writer.writeLine("const defaultAvatarSrc = avatarConfig.src || \"https://i.pravatar.cc/100?u=user\";");
    writer.writeLine("const sidebarLabelText = visualLabels.sidebarLabel || \"Admin\";");
    writer.writeLine("const docsSidebarLabel = visualDocs.sidebarLabel || \"Documentation\";");
    writer.writeLine("const docsTocLabel = visualDocs.tocLabel || \"On this page\";");
    writer.writeLine("const showDocsSidebar = visualDocs.showSidebar !== false;");
    writer.writeLine("const showDocsToc = visualDocs.showToc !== false;");
    writer.writeLine("const docsGridClass = showDocsSidebar && showDocsToc && tocItems.length > 0");
    writer.writeLine("  ? (visualBreakpoints.docsGrid?.threeColumn || \"grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_260px] gap-10\")");
    writer.writeLine("  : (showDocsSidebar");
    writer.writeLine("      ? (visualBreakpoints.docsGrid?.twoColumn || \"grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-10\")");
    writer.writeLine("      : (showDocsToc && tocItems.length > 0");
    writer.writeLine("          ? (visualBreakpoints.docsGrid?.mainToc || \"grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-10\")");
    writer.writeLine("          : (visualBreakpoints.docsGrid?.single || \"grid grid-cols-1 gap-10\")));");
    writer.writeLine("const showBackgroundGradients = visualBackground.showGradients !== false;");
    writer.writeLine("const brandShowTopbar = visualBrand.showTopbarLogo !== false;");
    writer.writeLine("const brandShowSidebar = visualBrand.showSidebarLogo !== false;");
    writer.writeLine("const brandLogoSrc = visualBrand.logoSrc || \"\";");
    writer.writeLine("const brandLogoText = visualBrand.logoText || \"\";");
    writer.writeLine("const brandLogoIcon = visualBrand.logoIcon || \"\";");
    writer.writeLine("const showSidebar = visualNavLayout === \"sidebar\" || visualNavLayout === \"hybrid\" || isAdminTheme;");
    writer.writeLine("const showTopbar = (visualNavLayout !== \"sidebar\") && !visualNavItems.hideTopbar;");
    writer.writeLine("const contentWidthClass = visualContentWidth === \"full\" ? \"max-w-none\" : visualContentWidth === \"wide\" ? \"max-w-[1400px]\" : visualContentWidth === \"narrow\" ? \"max-w-3xl\" : \"max-w-7xl\";");
    writer.writeLine("const densityClass = visualDensity === \"compact\" ? \"py-6\" : visualDensity === \"spacious\" ? \"py-16\" : \"py-12\";");
    writer.writeLine("const docsDensityClass = visualDensity === \"compact\" ? \"py-6\" : visualDensity === \"spacious\" ? \"py-14\" : \"py-10\";");
    writer.writeLine("const motionThemeTransition = visualMotion.themeTransitionClass || (isAdminTheme ? \"transition-colors duration-200\" : \"transition-colors duration-300\");");
    writer.writeLine("const motionDuration = visualTokens.motion?.duration || null;");
    writer.writeLine("const motionEasing = visualTokens.motion?.easing || null;");
    writer.writeLine("const motionStyle = (motionDuration || motionEasing) ? { transitionDuration: motionDuration || undefined, transitionTimingFunction: motionEasing || undefined } : undefined;");
    writer.writeLine("const motionPageEnter = visualMotion.pageEnterClass || \"animate-in fade-in duration-700\";");
    writer.writeLine("const motionDocsEnter = visualMotion.docsEnterClass || motionPageEnter;");
    writer.writeLine("const contentPaddingClass = visualBreakpoints.contentPadding || \"px-6 lg:px-10\";");
    writer.writeLine("const docsPaddingClass = visualBreakpoints.docsPadding || contentPaddingClass;");
    writer.writeLine("const adminOffsetClass = showSidebar ? (visualBreakpoints.sidebarOffsetClass || \"ml-64 w-[calc(100%-16rem)]\") : \"w-full\";");
    writer.writeLine("const topbarHeightAdmin = visualBreakpoints.topbarHeightAdmin || \"h-14\";");
    writer.writeLine("const topbarHeightDefault = visualBreakpoints.topbarHeightDefault || \"h-20\";");
    writer.writeLine("const sidebarResponsiveClass = visualBreakpoints.sidebarResponsiveClass || \"\";");
    writer.writeLine("const topbarLinksWrapClass = visualBreakpoints.topbarLinksWrapClass || \"\";");
    writer.writeLine("const topbarControlsWrapClass = visualBreakpoints.topbarControlsWrapClass || \"\";");
    writer.writeLine("const adminMainClass = `${adminOffsetClass} max-w-none mx-auto ${contentPaddingClass} py-6`;");
    writer.writeLine("const defaultMainClass = `${contentWidthClass} mx-auto ${contentPaddingClass} ${densityClass} ${motionPageEnter}`;");
    writer.writeLine("const docsMainClass = `${visualContentWidth === \"full\" ? \"max-w-none\" : \"max-w-[1400px]\"} mx-auto ${docsPaddingClass} ${docsDensityClass} ${motionDocsEnter}`;");
    writer.writeLine("const isActivePath = (path: string) => relativePath === path;");
    writer.writeLine(`const docsLinks = ${JSON.stringify(docsLinks, null, 2)};`);
    writer.writeLine(`const defaultDocsGroupLabel = ${JSON.stringify(docsGroupLabel)};`);
    writer.writeLine("const docsSidebarGroups = docsLinks.reduce((acc, link) => {");
    writer.writeLine("  const label = link.groupLabel || defaultDocsGroupLabel;");
    writer.writeLine("  let group = acc.find((g) => g.label === label);");
    writer.writeLine("  if (!group) { group = { label, items: [] as typeof docsLinks }; acc.push(group); }");
    writer.writeLine("  group.items.push(link);");
    writer.writeLine("  return acc;");
    writer.writeLine("}, [] as Array<{ label: string; items: typeof docsLinks }>)");
    writer.writeLine("const docsPaths = docsLinks.map((link) => link.path);");
    writer.writeLine("const isDocsRoute = docsPaths.includes(relativePath);");
    writer.writeLine("const topbarLinks = Array.isArray(visualNavItems.topbar) && visualNavItems.topbar.length > 0 ? visualNavItems.topbar : " + JSON.stringify(navbarLinks) + ";");
    writer.writeLine("const sidebarLinks = Array.isArray(visualNavItems.sidebar) && visualNavItems.sidebar.length > 0 ? visualNavItems.sidebar : " + JSON.stringify(navbarLinks) + ";");
    writer.writeLine("const footerLinks = Array.isArray(visualFooterLinks) ? visualFooterLinks : [{ label: \"Terms\", href: \"#\" }, { label: \"Privacy\", href: \"#\" }, { label: \"Contact\", href: \"#\" }];");
    writer.writeLine("const showFooterLinks = footerLinks.length > 0;");
    writer.writeLine("const footerEnabled = visualFooter.enabled !== false;");
    writer.writeLine("const footerLayout = visualFooter.layout || \"standard\";");
    writer.writeLine("const footerText = visualFooter.text || null;");
    writer.writeLine("const navSectionLabel = visualCopy.navSection || \"Navigation\";");
    writer.writeLine("const docsSectionLabel = visualCopy.docsSection || \"Docs\";");
    writer.writeLine("const footerDefaultText = visualCopy.footerDefault || null;");
    writer.writeLine("const iconSearch = visualIcons.search || \"Search\";");
    writer.writeLine("const iconNotifications = visualIcons.notifications || \"Bell\";");
    writer.writeLine("const iconThemeSun = visualIcons.themeSun || \"Sun\";");
    writer.writeLine("const iconThemeMoon = visualIcons.themeMoon || \"Moon\";");
    writer.writeLine("const iconLogoFallback = visualIcons.logoFallback || \"Box\";");
    writer.writeLine("const iconDocsSection = visualIcons.docsSection || null;");
    writer.writeLine("const docsItemIcons = visualIcons.docsItems || {};");
    writer.writeLine("const navItemIcons = visualIcons.navItems || {};");
    writer.writeLine("const footerLinkIcons = visualIcons.footerLinks || {};");
    writer.writeLine("const iconSearchInput = visualIcons.searchInput || iconSearch;");
    writer.writeLine("const iconSearchEmpty = visualIcons.searchEmpty || iconSearch;");
    if (authConfig) {
      writer.writeLine("const [authChecked, setAuthChecked] = useState(false);");
      writer.writeLine("const [isAuthed, setIsAuthed] = useState(false);");
    }
    writer.writeLine("");
    if (authConfig) {
      writer.writeLine(`const authMeOp = useOperation("${authMeOpId}");`);
      writer.writeLine(`const authLogoutOp = useOperation("${authLogoutOpId}");`);
    }
    writer.writeLine("");
    writer.writeLine("useEffect(() => {");
    writer.writeLine("  if (typeof window === \"undefined\") return;");
    writer.writeLine("  (window as any).__SPA_ROUTER__ = true;");
    writer.writeLine("  (window as any).__IRGEN_BASE_PATH__ = basePath;");
    writer.writeLine("  (window as any).__IRGEN_NAVIGATE__ = (to: string) => navigate(to);");
    writer.writeLine("  return () => {");
    writer.writeLine("    try { delete (window as any).__IRGEN_NAVIGATE__; } catch (_) {}");
    writer.writeLine("  };");
    writer.writeLine("}, [navigate]);");
    writer.writeLine("");
    if (authConfig) {
      writer.writeLine("useEffect(() => {");
      writer.writeLine("  const run = async () => {");
      writer.writeLine("    const res = await authMeOp.execute();");
      writer.writeLine("    setIsAuthed(Boolean(res.ok));");
      writer.writeLine("    setAuthChecked(true);");
      writer.writeLine("  };");
      writer.writeLine("  run();");
      writer.writeLine("}, [location.pathname]);");
      writer.writeLine("");
      writer.writeLine("useEffect(() => {");
      writer.writeLine("  if (!authChecked) return;");
      writer.writeLine(`  if (!isAuthed && relativePath !== ${JSON.stringify(authLoginPath)}) {`);
      writer.writeLine(`    navigate(${JSON.stringify(authLoginPath)});`);
      writer.writeLine("    return;");
      writer.writeLine("  }");
      writer.writeLine(`  if (isAuthed && relativePath === ${JSON.stringify(authLoginPath)}) {`);
      writer.writeLine("    navigate(\"/\");");
      writer.writeLine("  }");
      writer.writeLine("}, [authChecked, isAuthed, relativePath]);");
      writer.writeLine("");
    }
    writer.writeLine("useEffect(() => {");
    writer.writeLine("  if (isDark) {");
    writer.writeLine("    document.documentElement.classList.add('dark');");
    writer.writeLine("    localStorage.setItem('theme', 'dark');");
    writer.writeLine("  } else {");
    writer.writeLine("    document.documentElement.classList.remove('dark');");
    writer.writeLine("    localStorage.setItem('theme', 'light');");
    writer.writeLine("  }");
    writer.writeLine("}, [isDark]);");
    writer.writeLine("useEffect(() => {");
    writer.writeLine("  const root = document.querySelector('[data-irgen-content]');");
    writer.writeLine("  if (!root) { setTocItems([]); return; }");
    writer.writeLine("  const headings = Array.from(root.querySelectorAll('h2, h3')) as HTMLElement[];");
    writer.writeLine("  const next = headings.map((el) => ({ id: el.id, text: el.textContent || '', level: Number(el.tagName.replace('H','')) }));");
    writer.writeLine("  setTocItems(next.filter((item) => item.id && item.text));");
    writer.writeLine("}, [location.pathname]);");
    writer.writeLine("");
    writer.writeLine("useEffect(() => {");
    writer.writeLine("  const root = document.querySelector('[data-irgen-content]');");
    writer.writeLine("  if (!root) return;");
    writer.writeLine("  const headings = Array.from(root.querySelectorAll('h2, h3')) as HTMLElement[];");
    writer.writeLine("  if (!headings.length) return;");
    writer.writeLine("  const observer = new IntersectionObserver((entries) => {");
    writer.writeLine("    entries.forEach((entry) => {");
    writer.writeLine("      if (entry.isIntersecting) {");
    writer.writeLine("        setActiveToc(entry.target.id);");
    writer.writeLine("      }");
    writer.writeLine("    });");
    writer.writeLine("  }, { rootMargin: '0px 0px -70% 0px', threshold: 0.1 });");
    writer.writeLine("  headings.forEach((h) => observer.observe(h));");
    writer.writeLine("  return () => observer.disconnect();");
    writer.writeLine("}, [location.pathname, tocItems.length]);");
    writer.writeLine("");
    writer.writeLine("const searchResults = useMemo(() => {");
    writer.writeLine("  const q = searchQuery.trim().toLowerCase();");
    writer.writeLine("  if (!q) return [];");
    writer.writeLine("  return SEARCH_INDEX.filter((item) => {");
    writer.writeLine("    return (`${item.title} ${item.description} ${item.content}`.toLowerCase()).includes(q);");
    writer.writeLine("  }).slice(0, 20);");
    writer.writeLine("}, [searchQuery]);");
    writer.writeLine("");

    if (hasMarkdownCode) {
      writer.writeLine("useEffect(() => {");
      writer.writeLine("  Prism.highlightAll();");
      writer.writeLine("}, [location.pathname]);");
    }
    if (hasMermaid) {
      writer.writeLine("");
      writer.writeLine("useEffect(() => {");
      writer.writeLine("  mermaid.initialize({ startOnLoad: false, theme: isDark ? 'dark' : 'default' });");
      writer.writeLine("  mermaid.run({ querySelector: '.mermaid' });");
      writer.writeLine("}, [isDark, location.pathname]);");
    }
    writer.writeLine("");
    writer.writeLine("return (");
    writer.writeLine('    <div data-irgen-theme={themePack} style={motionStyle || undefined} className={isAdminTheme ? `min-h-screen bg-[var(--irgen-color-surface)] dark:bg-[var(--irgen-color-surface-dark)] text-slate-900 dark:text-slate-100 font-sans ${motionThemeTransition}` : `min-h-screen bg-[var(--irgen-color-surface)]/60 dark:bg-[var(--irgen-color-surface-dark)] text-slate-900 dark:text-slate-100 font-sans selection:bg-slate-900 selection:text-white ${motionThemeTransition}`}>');
    writer.writeLine("        {showSidebar && (");
    writer.writeLine("          <aside className={`fixed inset-y-0 left-0 ${visualBreakpoints.sidebarWidth || \"w-64\"} ${sidebarResponsiveClass} bg-[var(--irgen-color-surface)]/95 dark:bg-[var(--irgen-color-surface-dark)]/95 border-r border-slate-200 dark:border-slate-800 z-40`}>");
    writer.writeLine("            <div className=\"h-full flex flex-col\">");
    writer.writeLine("              <div className=\"px-[var(--irgen-space-md)] py-[var(--irgen-space-lg)] border-b border-slate-200 dark:border-slate-800\">");
    writer.writeLine("                {brandShowSidebar && (");
    writer.writeLine("                  <Link to=\"/\" className=\"flex items-center gap-3\">");
    writer.writeLine(`                    <div className=\"w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20\" style={{ backgroundColor: \"${ir.policies.frontend.styling.theme.primaryColor}\" }}>`);
    writer.writeLine("                      {brandLogoSrc ? <img src={brandLogoSrc} alt=\"Logo\" className=\"w-full h-full object-cover rounded-xl\" /> : (brandLogoIcon && (Icons as any)[brandLogoIcon] ? React.createElement((Icons as any)[brandLogoIcon], { size: 22 }) : React.createElement((Icons as any)[iconLogoFallback] || Icons.Box, { size: 22 }))}");
    writer.writeLine("                    </div>");
    writer.writeLine("                    <div className=\"leading-tight\">");
    writer.writeLine("                      <p className=\"text-xs uppercase tracking-widest text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)]\">{sidebarLabelText}</p>");
    writer.writeLine(`                      <p className=\"text-lg font-black text-slate-900 dark:text-white\">{brandLogoText || ${JSON.stringify(ir.appName)}}</p>`);
    writer.writeLine("                    </div>");
    writer.writeLine("                  </Link>");
    writer.writeLine("                )}");
    writer.writeLine("              </div>");
    writer.writeLine("              <div className=\"flex-1 overflow-y-auto px-[var(--irgen-space-sm)] py-[var(--irgen-space-lg)] space-y-[var(--irgen-space-lg)]\">");
    writer.writeLine("                <div>");
    writer.writeLine("                  <p className=\"text-[11px] font-semibold uppercase tracking-widest text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)] mb-[var(--irgen-space-xs)]\">{navSectionLabel}</p>");
    writer.writeLine("                  <div className=\"space-y-[var(--irgen-space-xs)]\">");
    if (authConfig && hideLoginWhenAuthed) {
      writer.writeLine("                    {sidebarLinks.filter((link: any) => link.path === " + JSON.stringify(authLoginPath) + " ? !isAuthed : true).map((link: any) => (");
    } else {
      writer.writeLine("                    {sidebarLinks.map((link: any) => (");
    }
    writer.writeLine("                      <Link key={link.path} to={link.path} className={isActivePath(link.path) ? \"flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold uppercase tracking-widest\" : \"flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-semibold uppercase tracking-widest hover:bg-slate-100/70 dark:hover:bg-slate-800/70\"}>");
    writer.writeLine("                        {(navItemIcons[link.path] || navItemIcons[link.name]) ? React.createElement((Icons as any)[navItemIcons[link.path] || navItemIcons[link.name]] || Icons.Square, { size: 12, className: \"text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)]\" }) : null}");
    writer.writeLine("                        <span>{link.name}</span>");
    writer.writeLine("                      </Link>");
    writer.writeLine("                    ))}");
    writer.writeLine("                  </div>");
    writer.writeLine("                </div>");
    if (docsLinks.length > 0) {
      writer.writeLine("                <div>");
      writer.writeLine("                  <p className=\"text-[11px] font-semibold uppercase tracking-widest text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)] mb-[var(--irgen-space-xs)] flex items-center gap-[var(--irgen-space-xs)]\">");
      writer.writeLine("                    {iconDocsSection ? React.createElement((Icons as any)[iconDocsSection] || Icons.BookOpen, { size: 14, className: \"text-[var(--irgen-color-muted)]\" }) : null}");
      writer.writeLine("                    <span>{docsSectionLabel}</span>");
      writer.writeLine("                  </p>");
      writer.writeLine("                  <div className=\"space-y-[var(--irgen-space-xs)]\">");
      writer.writeLine("                    {docsLinks.map((link) => (");
      writer.writeLine("                      <Link key={link.path} to={link.path} className={isActivePath(link.path) ? \"flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold uppercase tracking-widest\" : \"flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-semibold uppercase tracking-widest hover:bg-slate-100/70 dark:hover:bg-slate-800/70\"}>");
      writer.writeLine("                        {(docsItemIcons[link.path] || docsItemIcons[link.name]) ? React.createElement((Icons as any)[docsItemIcons[link.path] || docsItemIcons[link.name]] || Icons.BookOpen, { size: 12, className: \"text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)]\" }) : null}");
      writer.writeLine("                        <span>{link.name}</span>");
      writer.writeLine("                      </Link>");
      writer.writeLine("                    ))}");
      writer.writeLine("                  </div>");
      writer.writeLine("                </div>");
    }
    writer.writeLine("              </div>");
    writer.writeLine("            </div>");
    writer.writeLine("          </aside>");
    writer.writeLine("        )}");
    writer.writeLine("        {!showSidebar && !isAdminTheme && showBackgroundGradients && (");
    writer.writeLine("          <>");
    writer.writeLine("            {/* Decorative background gradients */}");
    writer.writeLine("            <div className=\"fixed inset-0 -z-10 pointer-events-none opacity-40\">");
    writer.writeLine("              <div className=\"absolute top-0 left-1/4 w-96 h-96 bg-[var(--irgen-color-surface)] rounded-full blur-3xl\"></div>");
    writer.writeLine("              <div className=\"absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--irgen-color-surface)]/80 rounded-full blur-3xl\"></div>");
    writer.writeLine("            </div>");
    writer.writeLine("          </>");
    writer.writeLine("        )}");
    writer.writeLine(`        {/* Navigation Bar */}`);
    writer.writeLine("        {showTopbar && (");
    writer.writeLine('        <nav className={showSidebar ? "sticky top-0 z-30 bg-[var(--irgen-color-surface)] dark:bg-[var(--irgen-color-surface-dark)] border-b border-slate-200 dark:border-slate-800 " + adminOffsetClass : "sticky top-0 z-50 bg-[var(--irgen-color-surface)]/70 dark:bg-[var(--irgen-color-surface-dark)]/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60"}>');
    writer.writeLine('          <div className={isAdminTheme ? "max-w-none mx-auto px-[var(--irgen-space-sm)] lg:px-[var(--irgen-space-md)]" : "max-w-7xl mx-auto px-[var(--irgen-space-md)] lg:px-[var(--irgen-space-xl)]"}>');
    writer.writeLine('            <div className={isAdminTheme ? `flex justify-between ${topbarHeightAdmin}` : `flex justify-between ${topbarHeightDefault}`}>');
    writer.writeLine('              <div className={isAdminTheme ? "flex items-center gap-[var(--irgen-space-md)]" : "flex items-center gap-[var(--irgen-space-xl)]"}>');
    writer.writeLine("                {brandShowTopbar && (");
    writer.writeLine("                  <div className=\"flex-shrink-0\">");
    writer.writeLine("                    <Link to=\"/\" className=\"group flex items-center gap-2\">");
    writer.writeLine(`                      <div className=\"w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20 active:scale-95 transition-all\" style={{ backgroundColor: \"${ir.policies.frontend.styling.theme.primaryColor}\" }}>`);
    writer.writeLine("                        {brandLogoSrc ? <img src={brandLogoSrc} alt=\"Logo\" className=\"w-full h-full object-cover rounded-xl\" /> : (brandLogoIcon && (Icons as any)[brandLogoIcon] ? React.createElement((Icons as any)[brandLogoIcon], { size: 24 }) : React.createElement((Icons as any)[iconLogoFallback] || Icons.Box, { size: 24 }))}");
    writer.writeLine("                      </div>");
    writer.writeLine(`                      <span className=\"font-black text-2xl tracking-tighter text-slate-900 dark:text-white\">{brandLogoText || ${JSON.stringify(ir.appName)}}</span>`);
    writer.writeLine("                    </Link>");
    writer.writeLine("                  </div>");
    writer.writeLine("                )}");
    writer.writeLine('                <div className={`hidden sm:flex items-center gap-[var(--irgen-space-xs)] ${topbarLinksWrapClass ? topbarLinksWrapClass : ""}`}>');
    if (authConfig && hideLoginWhenAuthed) {
      writer.writeLine("                  {topbarLinks.filter((link: any) => link.path === " + JSON.stringify(authLoginPath) + " ? !isAuthed : true).map((link: any) => (");
    } else {
      writer.writeLine("                  {topbarLinks.map((link: any) => (");
    }
    writer.writeLine('                    <Link key={link.path} to={link.path} className={isAdminTheme ? "px-3 py-2 rounded-md text-[11px] font-semibold uppercase tracking-widest text-[var(--irgen-color-muted)] hover:text-slate-900 dark:text-[var(--irgen-color-muted-dark)] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" : "px-4 py-2 rounded-lg text-sm font-bold text-[var(--irgen-color-muted)] hover:text-slate-900 dark:text-[var(--irgen-color-muted-dark)] dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all"}>');
    writer.writeLine(`                      {(navItemIcons[link.path] || navItemIcons[link.name]) ? React.createElement((Icons as any)[navItemIcons[link.path] || navItemIcons[link.name]] || Icons.Square, { size: 14, className: "mr-2 align-text-bottom" }) : null}`);
    writer.writeLine(`                      {link.name}`);
    writer.writeLine(`                    </Link>`);
    writer.writeLine(`                  ))}`);
    writer.writeLine("                </div>");
    writer.writeLine("              </div>");
    writer.writeLine('              <div className={isAdminTheme ? `flex items-center gap-[var(--irgen-space-sm)] ${topbarControlsWrapClass ? topbarControlsWrapClass : ""}` : `flex items-center gap-[var(--irgen-space-md)] ${topbarControlsWrapClass ? topbarControlsWrapClass : ""}`}>');
    writer.writeLine("                {showSearch && (");
    writer.writeLine("                  <button onClick={() => setSearchOpen(true)} className=\"p-2 text-[var(--irgen-color-muted)] hover:text-slate-900 dark:text-[var(--irgen-color-muted-dark)] dark:hover:text-white transition-colors\" aria-label=\"Search\">{React.createElement((Icons as any)[iconSearch] || Icons.Search, { size: 20 })}</button>");
    writer.writeLine("                )}");
    writer.writeLine("                {showNotifications && (");
    writer.writeLine("                  <button className=\"p-2 text-[var(--irgen-color-muted)] hover:text-slate-900 dark:text-[var(--irgen-color-muted-dark)] dark:hover:text-white transition-colors\" aria-label=\"Notifications\">{React.createElement((Icons as any)[iconNotifications] || Icons.Bell, { size: 20 })}</button>");
    writer.writeLine("                )}");
    writer.writeLine("                {showThemeToggle && (");
    writer.writeLine("                  <button ");
    writer.writeLine("                    onClick={() => setIsDark(!isDark)}");
    writer.writeLine("                    className=\"p-2 text-[var(--irgen-color-muted)] hover:text-slate-900 dark:text-[var(--irgen-color-muted-dark)] dark:hover:text-white transition-all active:scale-90\"");
    writer.writeLine("                    aria-label=\"Toggle theme\"");
    writer.writeLine("                  >");
    writer.writeLine("                    <div className=\"relative w-5 h-5\">");
    writer.writeLine("                      {React.createElement((Icons as any)[iconThemeSun] || Icons.Sun, { size: 20, className: \"absolute inset-0 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 transition-all text-amber-500\" })}");
    writer.writeLine("                      {React.createElement((Icons as any)[iconThemeMoon] || Icons.Moon, { size: 20, className: \"absolute inset-0 rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-all text-indigo-400\" })}");
    writer.writeLine("                    </div>");
    writer.writeLine("                  </button>");
    writer.writeLine("                )}");
    writer.writeLine("                {topbarCustom.map((item: any, idx: number) => {");
    writer.writeLine("                  const Icon = item.icon && (Icons as any)[item.icon];");
    writer.writeLine("                  const label = item.label || \"Link\";");
    writer.writeLine("                  const href = item.href || \"#\";");
    writer.writeLine("                  const target = item.target || \"_blank\";");
    writer.writeLine("                  return (");
    writer.writeLine("                    <a key={idx} href={href} target={target} rel={target === \"_blank\" ? \"noreferrer\" : undefined} className=\"inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[var(--irgen-color-muted)] hover:text-slate-900 dark:text-[var(--irgen-color-muted-dark)] dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors\">");
    writer.writeLine("                      {Icon ? <Icon size={16} /> : null}");
    writer.writeLine("                      <span>{label}</span>");
    writer.writeLine("                    </a>");
    writer.writeLine("                  );");
    writer.writeLine("                })}");
    if (authConfig) {
      writer.writeLine("                {authChecked && isAuthed && (");
      writer.writeLine(`                  <button onClick={async () => { await authLogoutOp.execute(); setIsAuthed(false); navigate(${JSON.stringify(authLoginPath)}); }} className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-[var(--irgen-color-muted)] hover:text-slate-900 dark:text-[var(--irgen-color-muted-dark)] dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all">`);
      writer.writeLine("                    Logout");
      writer.writeLine("                  </button>");
      writer.writeLine("                )}");
    }
    writer.writeLine("                {showAvatar && !(avatarConfig.hideWhenUnauthed && !isAuthed) && !(avatarConfig.hideWhenAuthed && isAuthed) && (");
    writer.writeLine("                  <div className=\"w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-700 overflow-hidden shadow-sm\">");
    writer.writeLine("                     <img src={defaultAvatarSrc} alt=\"Avatar\" className=\"w-full h-full object-cover\" />");
    writer.writeLine("                  </div>");
    writer.writeLine("                )}");
    writer.writeLine("              </div>");
    writer.writeLine("            </div>");
    writer.writeLine("          </div>");
    writer.writeLine("        </nav>");
    writer.writeLine("        )}");
    writer.writeLine("");
    writer.writeLine("        {/* Content Area */}");
    writer.writeLine('        <main className={isDocsRoute ? (isAdminTheme ? adminMainClass : docsMainClass) : (isAdminTheme ? adminMainClass : defaultMainClass)}>');
    writer.writeLine("          {isDocsRoute ? (");
    writer.writeLine("            <div className={docsGridClass}>");
    writer.writeLine("              {showDocsSidebar && (");
    writer.writeLine("                <aside className=\"hidden lg:block\">");
    writer.writeLine("                  <div className=\"sticky top-28\">");
    writer.writeLine("                    <p className=\"text-xs font-semibold uppercase tracking-widest text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)] mb-[var(--irgen-space-sm)]\">{docsSidebarLabel}</p>");
    writer.writeLine("                    <nav className=\"space-y-[var(--irgen-space-lg)] text-sm\">");
    writer.writeLine("                      {docsSidebarGroups.map((group) => (");
    writer.writeLine("                        <div key={group.label} className=\"space-y-[var(--irgen-space-xs)]\">");
    writer.writeLine("                          <p className=\"text-[11px] font-semibold uppercase tracking-widest text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)]\">{group.label}</p>");
    writer.writeLine("                          <div className=\"space-y-0\">");
    writer.writeLine("                            {group.items.map((link) => (");
    writer.writeLine("                              <Link key={link.path} to={link.path} className={link.path === location.pathname ? \"block px-[var(--irgen-space-xs)] py-[var(--irgen-space-xs)] rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold\" : \"block px-[var(--irgen-space-xs)] py-[var(--irgen-space-xs)] rounded-lg text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60\"}>");
    writer.writeLine("                                {link.name}");
    writer.writeLine("                              </Link>");
    writer.writeLine("                            ))}");
    writer.writeLine("                          </div>");
    writer.writeLine("                        </div>");
    writer.writeLine("                      ))}");
    writer.writeLine("                    </nav>");
    writer.writeLine("                  </div>");
    writer.writeLine("                </aside>");
    writer.writeLine("              )}");
    writer.writeLine("              <div className=\"min-w-0\" data-irgen-content>");
    writer.writeLine("                <Routes>");
    ir.pages.forEach(p => {
      writer.writeLine(`            <Route path=\"${p.path}\" element={<${pascal(p.name)}Page />} />`);
    });
    if (ir.pages.length > 0) {
      writer.writeLine(`            <Route path=\"*\" element={<${pascal(ir.pages[0].name)}Page />} />`);
    }
    writer.writeLine("                </Routes>");
    writer.writeLine("              </div>");
    writer.writeLine("              {showDocsToc && tocItems.length > 0 && (");
    writer.writeLine("                <aside className=\"hidden lg:block\">");
    writer.writeLine("                  <div className=\"sticky top-28 space-y-[var(--irgen-space-sm)] text-sm\">");
    writer.writeLine("                    <p className=\"text-xs font-semibold uppercase tracking-widest text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)]\">{docsTocLabel}</p>");
    writer.writeLine("                    <ul className=\"space-y-[var(--irgen-space-xs)]\">");
    writer.writeLine("                      {tocItems.map((item) => (");
    writer.writeLine("                        <li key={item.id} className={item.level === 3 ? \"pl-3\" : \"\"}>");
    writer.writeLine("                          <a href={`#${item.id}`} className={item.id === activeToc ? \"text-slate-900 dark:text-white font-semibold\" : \"text-[var(--irgen-color-muted)] hover:text-slate-900 dark:text-[var(--irgen-color-muted-dark)] dark:hover:text-white\"}>{item.text}</a>");
    writer.writeLine("                        </li>");
    writer.writeLine("                      ))}");
    writer.writeLine("                    </ul>");
    writer.writeLine("                  </div>");
    writer.writeLine("                </aside>");
    writer.writeLine("              )}");
    writer.writeLine("            </div>");
    writer.writeLine("          ) : (");
    writer.writeLine("            <div className=\"min-w-0\" data-irgen-content>");
    writer.writeLine("              <Routes>");
    ir.pages.forEach(p => {
      writer.writeLine(`            <Route path=\"${p.path}\" element={<${pascal(p.name)}Page />} />`);
    });
    if (ir.pages.length > 0) {
      writer.writeLine(`            <Route path=\"*\" element={<${pascal(ir.pages[0].name)}Page />} />`);
    }
    writer.writeLine("              </Routes>");
    writer.writeLine("            </div>");
    writer.writeLine("          )}");
    writer.writeLine("        </main>");
    writer.writeLine("");
    writer.writeLine("        {searchEnabled && searchOpen && (");
    writer.writeLine("          <div className=\"fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-start justify-center pt-24\" onClick={() => setSearchOpen(false)}>");
    writer.writeLine("            <div className=\"bg-[var(--irgen-color-surface)] dark:bg-[var(--irgen-color-surface-dark)] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl p-6\" onClick={(e) => e.stopPropagation()}>");
    writer.writeLine("              <div className=\"flex items-center gap-[var(--irgen-space-sm)] mb-[var(--irgen-space-sm)]\">");
    writer.writeLine("                {React.createElement((Icons as any)[iconSearchInput] || Icons.Search, { size: 18, className: \"text-[var(--irgen-color-muted)]\" })}");
    writer.writeLine("                <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={searchPlaceholder} className=\"w-full bg-transparent outline-none text-slate-900 dark:text-white\" />");
    writer.writeLine("              </div>");
    writer.writeLine("              <div className=\"max-h-[420px] overflow-auto divide-y divide-slate-100 dark:divide-slate-800\">");
    writer.writeLine("                {searchResults.length === 0 ? (");
    writer.writeLine("                  <div className=\"text-sm text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)] py-6 text-center\">");
    writer.writeLine("                    {React.createElement((Icons as any)[iconSearchEmpty] || Icons.Search, { size: 20, className: \"mx-auto mb-3 text-[var(--irgen-color-muted)]\" })}");
    writer.writeLine("                    <div>{searchEmptyMessage}</div>");
    writer.writeLine("                  </div>");
    writer.writeLine("                ) : (");
    writer.writeLine("                  searchResults.map((item) => (");
    writer.writeLine("                    <Link key={item.path} to={item.path} onClick={() => setSearchOpen(false)} className=\"block py-[var(--irgen-space-sm)] hover:bg-slate-50 dark:hover:bg-slate-800/40 px-[var(--irgen-space-xs)] rounded-[var(--irgen-radius-md)]\">");
    writer.writeLine("                      <p className=\"text-sm font-semibold text-slate-900 dark:text-white\">{item.title}</p>");
    writer.writeLine("                      {item.description && <p className=\"text-xs text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)] mt-1\">{item.description}</p>}");
    writer.writeLine("                    </Link>");
    writer.writeLine("                  ))");
    writer.writeLine("                )}");
    writer.writeLine("              </div>");
    writer.writeLine("            </div>");
    writer.writeLine("          </div>");
    writer.writeLine("        )}");
    writer.writeLine("");
    writer.writeLine("        {/* Footer */}");
    writer.writeLine("        {footerEnabled && (");
    writer.writeLine('        <footer className={showSidebar ? "border-t border-slate-200 dark:border-slate-800 mt-[var(--irgen-space-lg)] " + (footerLayout === "compact" ? "py-[var(--irgen-space-sm)]" : "py-[var(--irgen-space-md)]") + " bg-[var(--irgen-color-surface)] dark:bg-[var(--irgen-color-surface-dark)] " + adminOffsetClass : "border-t border-slate-200 dark:border-slate-800 mt-[var(--irgen-space-xl)] " + (footerLayout === "compact" ? "py-[var(--irgen-space-md)]" : "py-[var(--irgen-space-xl)]") + " bg-[var(--irgen-color-surface)]/30 dark:bg-[var(--irgen-color-surface-dark)]/30 backdrop-blur-sm"}>');
    writer.writeLine('          <div className={isAdminTheme ? "max-w-none mx-auto px-[var(--irgen-space-md)] flex flex-col md:flex-row justify-between items-center gap-[var(--irgen-space-sm)]" : "max-w-7xl mx-auto px-[var(--irgen-space-md)] lg:px-[var(--irgen-space-xl)] flex flex-col md:flex-row justify-between items-center gap-[var(--irgen-space-md)]"}>');
    writer.writeLine("            <div className={isAdminTheme ? \"text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)] text-xs font-medium\" : \"text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)] text-sm font-medium\"}>");
    writer.writeLine("              {footerText ? footerText : (footerDefaultText ? footerDefaultText : (<>© 2026 " + ir.appName + ". Powered by <span className=\"font-bold text-slate-900 dark:text-white\">irgen</span></>))}");
    writer.writeLine("            </div>");
    writer.writeLine("            {showFooterLinks && (");
    writer.writeLine('              <div className={isAdminTheme ? "flex gap-[var(--irgen-space-md)] text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)] text-[11px] font-semibold uppercase tracking-widest" : "flex gap-[var(--irgen-space-lg)] text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)] text-sm font-bold uppercase tracking-widest"}>');
    writer.writeLine("                {footerLinks.map((link: any, idx: number) => (");
    writer.writeLine("                  <a key={idx} href={link.href} className=\"inline-flex items-center gap-2 hover:text-slate-900 dark:hover:text-white transition-colors\">");
    writer.writeLine("                    {(footerLinkIcons[link.href] || footerLinkIcons[link.label]) ? React.createElement((Icons as any)[footerLinkIcons[link.href] || footerLinkIcons[link.label]] || Icons.Link, { size: 14, className: \"text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)]\" }) : null}");
    writer.writeLine("                    <span>{link.label}</span>");
    writer.writeLine("                  </a>");
    writer.writeLine("                ))}");
    writer.writeLine("              </div>");
    writer.writeLine("            )}");
    writer.writeLine("          </div>");
    writer.writeLine("        </footer>");
    writer.writeLine("        )}");
    writer.writeLine("      </div>");
    writer.writeLine("  );");
  });

  // index.html (SPA fallback / CSR entry)
  // Note: Vite handles prefixing based on 'base' config during build. 
  // Scripts in index.html should point to the source path relative to project root.
  const htmlBasePath = basePath !== "/" ? basePath : "";
  project.createSourceFile(path.join(outDir, "index.html"), `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${ir.pwa?.enabled ? `<link rel="manifest" href="${htmlBasePath}/manifest.webmanifest" />` : ""}
    ${ir.pwa?.enabled ? `<link rel="icon" href="${htmlBasePath}/icons/icon.svg" />` : ""}
    ${ir.pwa?.enabled ? `<link rel="apple-touch-icon" href="${htmlBasePath}/icons/icon.svg" />` : ""}
    ${ir.pwa?.enabled ? `<meta name="theme-color" content="${ir.pwa.themeColor}" />` : ""}
    <title>${ir.appName}</title>
  </head>
  <body>
    <div id="root" data-irgen-interactive="csr"></div>
    <script type="module" src="/src/entry-client.tsx"></script>
  </body>
</html>
  `.trim(), { overwrite: true });

  // TAILWIND SETUP
  const cssPath = path.join(frontendDir, "index.css");
  const typographyTokens = visualTokens.typography ?? {};
  const spacingTokens = visualTokens.spacing ?? {};
  const radiusTokens = visualTokens.radius ?? {};
  const shadowTokens = visualTokens.shadow ?? {};
  const colorTokens = visualTokens.colors ?? {};
  const motionTokens = visualTokens.motion ?? {};
  const fontSans = typographyTokens.fontSans || "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";
  const fontMono = typographyTokens.fontMono || "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace";
  const proseH1 = typographyTokens.h1 || "2rem";
  const proseH2 = typographyTokens.h2 || "1.5rem";
  const proseH3 = typographyTokens.h3 || "1.25rem";
  const proseLeading = typographyTokens.leading || "1.75";
  const spaceXs = spacingTokens.xs || "0.25rem";
  const spaceSm = spacingTokens.sm || "0.75rem";
  const spaceMd = spacingTokens.md || "1.25rem";
  const spaceLg = spacingTokens.lg || "1.5rem";
  const spaceXl = spacingTokens.xl || "2rem";
  const radiusSm = radiusTokens.sm || "0.375rem";
  const radiusMd = radiusTokens.md || "0.5rem";
  const radiusLg = radiusTokens.lg || "0.75rem";
  const shadowSm = shadowTokens.sm || "0 1px 2px rgba(15, 23, 42, 0.08)";
  const shadowMd = shadowTokens.md || "0 10px 15px rgba(15, 23, 42, 0.08)";
  const shadowLg = shadowTokens.lg || "0 25px 50px rgba(15, 23, 42, 0.12)";
  const colorText = colorTokens.text || "#0f172a";
  const colorTextDark = colorTokens.textDark || "#e2e8f0";
  const colorMuted = colorTokens.muted || "#94a3b8";
  const colorMutedDark = colorTokens.mutedDark || "#64748b";
  const colorLink = colorTokens.link || "#2563eb";
  const colorLinkDark = colorTokens.linkDark || "#93c5fd";
  const colorCodeBg = colorTokens.codeBg || "rgba(15, 23, 42, 0.08)";
  const colorCodeBgDark = colorTokens.codeBgDark || "rgba(148, 163, 184, 0.2)";
  const colorPreBg = colorTokens.preBg || "#0f172a";
  const colorPreText = colorTokens.preText || "#e2e8f0";
  const colorSurface = colorTokens.surface || "#ffffff";
  const colorSurfaceDark = colorTokens.surfaceDark || "#0f172a";
  const motionDuration = motionTokens.duration || "300ms";
  const motionEasing = motionTokens.easing || "ease";
  project.createSourceFile(cssPath, `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  --irgen-font-sans: ${fontSans};\n  --irgen-font-mono: ${fontMono};\n  --irgen-prose-h1: ${proseH1};\n  --irgen-prose-h2: ${proseH2};\n  --irgen-prose-h3: ${proseH3};\n  --irgen-prose-leading: ${proseLeading};\n  --irgen-space-xs: ${spaceXs};\n  --irgen-space-sm: ${spaceSm};\n  --irgen-space-md: ${spaceMd};\n  --irgen-space-lg: ${spaceLg};\n  --irgen-space-xl: ${spaceXl};\n  --irgen-radius-sm: ${radiusSm};\n  --irgen-radius-md: ${radiusMd};\n  --irgen-radius-lg: ${radiusLg};\n  --irgen-shadow-sm: ${shadowSm};\n  --irgen-shadow-md: ${shadowMd};\n  --irgen-shadow-lg: ${shadowLg};\n  --irgen-color-text: ${colorText};\n  --irgen-color-text-dark: ${colorTextDark};\n  --irgen-color-muted: ${colorMuted};\n  --irgen-color-muted-dark: ${colorMutedDark};\n  --irgen-color-link: ${colorLink};\n  --irgen-color-link-dark: ${colorLinkDark};\n  --irgen-color-code-bg: ${colorCodeBg};\n  --irgen-color-code-bg-dark: ${colorCodeBgDark};\n  --irgen-color-pre-bg: ${colorPreBg};\n  --irgen-color-pre-text: ${colorPreText};\n  --irgen-color-surface: ${colorSurface};\n  --irgen-color-surface-dark: ${colorSurfaceDark};\n  --irgen-motion-duration: ${motionDuration};\n  --irgen-motion-easing: ${motionEasing};\n}\n\n/* Markdown prose styling */\n.prose { color: var(--irgen-color-text); font-family: var(--irgen-font-sans); }\n.dark .prose { color: var(--irgen-color-text-dark); }\n.prose p { margin: var(--irgen-space-sm) 0; line-height: var(--irgen-prose-leading); }\n.prose h1, .prose h2, .prose h3, .prose h4 { font-weight: 700; color: inherit; margin: var(--irgen-space-md) 0 var(--irgen-space-xs); }\n.prose h1 { font-size: var(--irgen-prose-h1); }\n.prose h2 { font-size: var(--irgen-prose-h2); }\n.prose h3 { font-size: var(--irgen-prose-h3); }\n.prose a { color: var(--irgen-color-link); text-decoration: underline; text-underline-offset: 3px; }\n.dark .prose a { color: var(--irgen-color-link-dark); }\n.prose ul, .prose ol { margin: var(--irgen-space-sm) 0 var(--irgen-space-sm) var(--irgen-space-lg); }\n.prose li { margin: var(--irgen-space-xs) 0; }\n.prose code { font-family: var(--irgen-font-mono); background: var(--irgen-color-code-bg); padding: 0.1rem 0.35rem; border-radius: var(--irgen-radius-sm); font-size: 0.85em; }\n.dark .prose code { background: var(--irgen-color-code-bg-dark); }\n.prose pre { background: var(--irgen-color-pre-bg); color: var(--irgen-color-pre-text); padding: var(--irgen-space-md) var(--irgen-space-lg); border-radius: var(--irgen-radius-lg); overflow-x: auto; overflow-y: hidden; font-size: 0.85rem; line-height: 1.6; box-shadow: var(--irgen-shadow-sm); }\n.prose pre code { background: transparent; padding: 0; color: inherit; }\n`, { overwrite: true });

  emitTailwindConfig(project, outDir);

  // pages barrel
  const pagesBarrel = project.createSourceFile(path.join(frontendDir, "pages.ts"), "", { overwrite: true });
  pagesBarrel.addStatements([`// Re-exports for generated pages`]);

  // components barrel
  const compsBarrel = project.createSourceFile(path.join(frontendDir, "components.ts"), "", { overwrite: true });
  compsBarrel.addStatements([`// Re-exports for generated components`]);

  for (const p of ir.pages) {
    emitPage(project, frontendDir, p);
    pagesBarrel.addStatements([`export * from "./pages/${p.name.toLowerCase()}";`]);
  }

  for (const c of ir.components) {
    emitComponent(project, frontendDir, c, ir);
    compsBarrel.addStatements([`export * from "./components/${c.name.toLowerCase()}";`]);
  }
}
// Register frontend emitter with the engine
try {
  emitterEngine.registerEmitter("frontend-tsmorph", async (ir: FrontendTargetIR, outDir: string) => {
    const project = new Project({
      useInMemoryFileSystem: false,
      manipulationSettings: {
        quoteKind: QuoteKind.Double,
        indentationText: IndentationText.TwoSpaces,
      },
      compilerOptions: { target: ScriptTarget.ES2022 },
    });

    // create/ensure out dir
    fs.mkdirSync(outDir, { recursive: true });

    emitFrontend(project, outDir, ir);
    project.saveSync();
  }, { force: true });
} catch (e) {
  // ignore double registration
}

// register default target mapping
try {
  registerTargetEmitter("frontend", "frontend-tsmorph", { force: true });
} catch (e) {
  // ignore
}
