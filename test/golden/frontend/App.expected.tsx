import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { SEARCH_INDEX } from "./lib/search-index";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { HomePage } from "./pages/home";
import { ProductPage } from "./pages/product";
import { AdminPage } from "./pages/admin";

export function App() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    }
    return false;
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tocItems, setTocItems] = useState([] as Array<{ id: string; text: string; level: number }>);
  const [activeToc, setActiveToc] = useState("" as string);
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = "/".replace(/\/$/, "") || "/";
  const relativePath = location.pathname.startsWith(basePath) ? location.pathname.substring(basePath.length) || '/' : location.pathname;
  const themePack = "default";
  const isAdminTheme = themePack === "admin";
  const visualNavLayout = "topbar";
  const visualContentWidth = "normal";
  const visualDensity = "normal";
  const visualTopbarControls = {};
  const visualBrand = {};
  const visualNavItems = {};
  const visualSearch = {};
  const visualFooterLinks = null;
  const visualFooter = {};
  const visualDocs = {};
  const visualBackground = {};
  const visualLabels = {};
  const visualMotion = {};
  const visualTokens = {};
  const visualIcons = {};
  const visualBreakpoints = {};
  const visualCopy = {};
  const topbarControlsEnabled = visualTopbarControls.enabled !== false;
  const topbarItems = Array.isArray(visualTopbarControls.items) && visualTopbarControls.items.length > 0 ? visualTopbarControls.items : ["search", "notifications", "themeToggle", "avatar"];
  const topbarCustom = Array.isArray(visualTopbarControls.custom) ? visualTopbarControls.custom : [];
  const searchConfig = visualSearch || {};
  const searchEnabled = searchConfig.enabled !== false;
  const searchPlaceholder = searchConfig.placeholder || "Search docs...";
  const searchEmptyMessage = searchConfig.emptyMessage || "No results";
  const showSearch = topbarControlsEnabled && topbarItems.includes("search") && searchEnabled;
  const showNotifications = topbarControlsEnabled && topbarItems.includes("notifications");
  const showThemeToggle = topbarControlsEnabled && topbarItems.includes("themeToggle");
  const showAvatar = topbarControlsEnabled && topbarItems.includes("avatar");
  const avatarConfig = visualTopbarControls.avatar || {};
  const defaultAvatarSrc = avatarConfig.src || "https://i.pravatar.cc/100?u=user";
  const sidebarLabelText = visualLabels.sidebarLabel || "Admin";
  const docsSidebarLabel = visualDocs.sidebarLabel || "Documentation";
  const docsTocLabel = visualDocs.tocLabel || "On this page";
  const showDocsSidebar = visualDocs.showSidebar !== false;
  const showDocsToc = visualDocs.showToc !== false;
  const docsGridClass = showDocsSidebar && showDocsToc && tocItems.length > 0
    ? (visualBreakpoints.docsGrid?.threeColumn || "grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_260px] gap-10")
    : (showDocsSidebar
        ? (visualBreakpoints.docsGrid?.twoColumn || "grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-10")
        : (showDocsToc && tocItems.length > 0
            ? (visualBreakpoints.docsGrid?.mainToc || "grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-10")
            : (visualBreakpoints.docsGrid?.single || "grid grid-cols-1 gap-10")));
  const showBackgroundGradients = visualBackground.showGradients !== false;
  const brandShowTopbar = visualBrand.showTopbarLogo !== false;
  const brandShowSidebar = visualBrand.showSidebarLogo !== false;
  const brandLogoSrc = visualBrand.logoSrc || "";
  const brandLogoText = visualBrand.logoText || "";
  const brandLogoIcon = visualBrand.logoIcon || "";
  const showSidebar = visualNavLayout === "sidebar" || visualNavLayout === "hybrid" || isAdminTheme;
  const showTopbar = (visualNavLayout !== "sidebar") && !visualNavItems.hideTopbar;
  const contentWidthClass = visualContentWidth === "full" ? "max-w-none" : visualContentWidth === "wide" ? "max-w-[1400px]" : visualContentWidth === "narrow" ? "max-w-3xl" : "max-w-7xl";
  const densityClass = visualDensity === "compact" ? "py-6" : visualDensity === "spacious" ? "py-16" : "py-12";
  const docsDensityClass = visualDensity === "compact" ? "py-6" : visualDensity === "spacious" ? "py-14" : "py-10";
  const motionThemeTransition = visualMotion.themeTransitionClass || (isAdminTheme ? "transition-colors duration-200" : "transition-colors duration-300");
  const motionDuration = visualTokens.motion?.duration || null;
  const motionEasing = visualTokens.motion?.easing || null;
  const motionStyle = (motionDuration || motionEasing) ? { transitionDuration: motionDuration || undefined, transitionTimingFunction: motionEasing || undefined } : undefined;
  const motionPageEnter = visualMotion.pageEnterClass || "animate-in fade-in duration-700";
  const motionDocsEnter = visualMotion.docsEnterClass || motionPageEnter;
  const contentPaddingClass = visualBreakpoints.contentPadding || "px-6 lg:px-10";
  const docsPaddingClass = visualBreakpoints.docsPadding || contentPaddingClass;
  const adminOffsetClass = showSidebar ? (visualBreakpoints.sidebarOffsetClass || "ml-64 w-[calc(100%-16rem)]") : "w-full";
  const topbarHeightAdmin = visualBreakpoints.topbarHeightAdmin || "h-14";
  const topbarHeightDefault = visualBreakpoints.topbarHeightDefault || "h-20";
  const sidebarResponsiveClass = visualBreakpoints.sidebarResponsiveClass || "";
  const topbarLinksWrapClass = visualBreakpoints.topbarLinksWrapClass || "";
  const topbarControlsWrapClass = visualBreakpoints.topbarControlsWrapClass || "";
  const adminMainClass = `${adminOffsetClass} max-w-none mx-auto ${contentPaddingClass} py-6`;
  const defaultMainClass = `${contentWidthClass} mx-auto ${contentPaddingClass} ${densityClass} ${motionPageEnter}`;
  const docsMainClass = `${visualContentWidth === "full" ? "max-w-none" : "max-w-[1400px]"} mx-auto ${docsPaddingClass} ${docsDensityClass} ${motionDocsEnter}`;
  const normalizePath = (p: string) => (p && p.length > 1 ? p.replace(/\/$/, "") : p || "/");
  const normalizedPath = normalizePath(relativePath);
  const isActivePath = (path: string) => normalizePath(path) === normalizedPath;
  const docsLinks = [];
  const defaultDocsGroupLabel = "Docs";
  const docsSidebarGroups = docsLinks.reduce((acc, link) => {
    const label = link.groupLabel || defaultDocsGroupLabel;
    let group = acc.find((g) => g.label === label);
    if (!group) { group = { label, items: [] as typeof docsLinks }; acc.push(group); }
    group.items.push(link);
    return acc;
  }, [] as Array<{ label: string; items: typeof docsLinks }>)
  const docsPaths = docsLinks.map((link) => normalizePath(link.path));
  const isDocsRoute = docsPaths.includes(normalizedPath);
  const topbarLinks = Array.isArray(visualNavItems.topbar) && visualNavItems.topbar.length > 0 ? visualNavItems.topbar : [{"name":"Home","path":"/"},{"name":"Admin","path":"/admin"}];
  const sidebarLinks = Array.isArray(visualNavItems.sidebar) && visualNavItems.sidebar.length > 0 ? visualNavItems.sidebar : [{"name":"Home","path":"/"},{"name":"Admin","path":"/admin"}];
  const footerLinks = Array.isArray(visualFooterLinks) ? visualFooterLinks : [{ label: "Terms", href: "#" }, { label: "Privacy", href: "#" }, { label: "Contact", href: "#" }];
  const showFooterLinks = footerLinks.length > 0;
  const footerEnabled = visualFooter.enabled !== false;
  const footerLayout = visualFooter.layout || "standard";
  const footerText = visualFooter.text || null;
  const navSectionLabel = visualCopy.navSection || "Navigation";
  const docsSectionLabel = visualCopy.docsSection || "Docs";
  const footerDefaultText = visualCopy.footerDefault || null;
  const iconSearch = visualIcons.search || "Search";
  const iconNotifications = visualIcons.notifications || "Bell";
  const iconThemeSun = visualIcons.themeSun || "Sun";
  const iconThemeMoon = visualIcons.themeMoon || "Moon";
  const iconLogoFallback = visualIcons.logoFallback || "Box";
  const iconDocsSection = visualIcons.docsSection || null;
  const docsItemIcons = visualIcons.docsItems || {};
  const navItemIcons = visualIcons.navItems || {};
  const footerLinkIcons = visualIcons.footerLinks || {};
  const iconSearchInput = visualIcons.searchInput || iconSearch;
  const iconSearchEmpty = visualIcons.searchEmpty || iconSearch;
  
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as any).__SPA_ROUTER__ = true;
    (window as any).__IRGEN_BASE_PATH__ = basePath;
    (window as any).__IRGEN_NAVIGATE__ = (to: string) => navigate(to);
    return () => {
      try { delete (window as any).__IRGEN_NAVIGATE__; } catch (_) {}
    };
  }, [navigate]);
  
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);
  useEffect(() => {
    const root = document.querySelector('[data-irgen-content]');
    if (!root) { setTocItems([]); return; }
    const headings = Array.from(root.querySelectorAll('h2, h3')) as HTMLElement[];
    const next = headings.map((el) => ({ id: el.id, text: el.textContent || '', level: Number(el.tagName.replace('H','')) }));
    setTocItems(next.filter((item) => item.id && item.text));
  }, [location.pathname]);
  
  useEffect(() => {
    const root = document.querySelector('[data-irgen-content]');
    if (!root) return;
    const headings = Array.from(root.querySelectorAll('h2, h3')) as HTMLElement[];
    if (!headings.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveToc(entry.target.id);
        }
      });
    }, { rootMargin: '0px 0px -70% 0px', threshold: 0.1 });
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [location.pathname, tocItems.length]);
  
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_INDEX.filter((item) => {
      return (`${item.title} ${item.description} ${item.content}`.toLowerCase()).includes(q);
    }).slice(0, 20);
  }, [searchQuery]);
  
  
  return (
      <ErrorBoundary>
      <div data-irgen-theme={themePack} style={motionStyle || undefined} className={isAdminTheme ? `min-h-screen bg-[var(--irgen-color-surface)] dark:bg-[var(--irgen-color-surface-dark)] text-slate-900 dark:text-slate-100 font-sans ${motionThemeTransition}` : `min-h-screen bg-[var(--irgen-color-surface)]/60 dark:bg-[var(--irgen-color-surface-dark)] text-slate-900 dark:text-slate-100 font-sans selection:bg-slate-900 selection:text-white ${motionThemeTransition}`}>
          {showSidebar && (
            <aside className={`fixed inset-y-0 left-0 ${visualBreakpoints.sidebarWidth || "w-64"} ${sidebarResponsiveClass} bg-[var(--irgen-color-surface)]/95 dark:bg-[var(--irgen-color-surface-dark)]/95 border-r border-slate-200 dark:border-slate-800 z-40`}>
              <div className="h-full flex flex-col">
                <div className="px-[var(--irgen-space-md)] py-[var(--irgen-space-lg)] border-b border-slate-200 dark:border-slate-800">
                  {brandShowSidebar && (
                    <Link to="/" className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20" style={{ backgroundColor: "#4f46e5" }}>
                        {brandLogoSrc ? <img src={brandLogoSrc} alt="Logo" className="w-full h-full object-cover rounded-xl" /> : (brandLogoIcon && (Icons as any)[brandLogoIcon] ? React.createElement((Icons as any)[brandLogoIcon], { size: 22 }) : React.createElement((Icons as any)[iconLogoFallback] || Icons.Box, { size: 22 }))}
                      </div>
                      <div className="leading-tight">
                        <p className="text-xs uppercase tracking-widest text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)]">{sidebarLabelText}</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{brandLogoText || "DemoFrontend"}</p>
                      </div>
                    </Link>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto px-[var(--irgen-space-sm)] py-[var(--irgen-space-lg)] space-y-[var(--irgen-space-lg)]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)] mb-[var(--irgen-space-xs)]">{navSectionLabel}</p>
                    <div className="space-y-[var(--irgen-space-xs)]">
                      {sidebarLinks.map((link: any) => (
                        <Link key={link.path} to={link.path} className={isActivePath(link.path) ? "flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold uppercase tracking-widest" : "flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-semibold uppercase tracking-widest hover:bg-slate-100/70 dark:hover:bg-slate-800/70"}>
                          {(navItemIcons[link.path] || navItemIcons[link.name]) ? React.createElement((Icons as any)[navItemIcons[link.path] || navItemIcons[link.name]] || Icons.Square, { size: 12, className: "text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)]" }) : null}
                          <span>{link.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}
          {!showSidebar && !isAdminTheme && showBackgroundGradients && (
            <>
              {/* Decorative background gradients */}
              <div className="fixed inset-0 -z-10 pointer-events-none opacity-40">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--irgen-color-surface)] rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--irgen-color-surface)]/80 rounded-full blur-3xl"></div>
              </div>
            </>
          )}
          {/* Navigation Bar */}
          {showTopbar && (
          <nav className={showSidebar ? "sticky top-0 z-30 bg-[var(--irgen-color-surface)] dark:bg-[var(--irgen-color-surface-dark)] border-b border-slate-200 dark:border-slate-800 " + adminOffsetClass : "sticky top-0 z-50 bg-[var(--irgen-color-surface)]/70 dark:bg-[var(--irgen-color-surface-dark)]/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60"}>
            <div className={isAdminTheme ? "max-w-none mx-auto px-[var(--irgen-space-sm)] lg:px-[var(--irgen-space-md)]" : "max-w-7xl mx-auto px-[var(--irgen-space-md)] lg:px-[var(--irgen-space-xl)]"}>
              <div className={isAdminTheme ? `flex justify-between ${topbarHeightAdmin}` : `flex justify-between ${topbarHeightDefault}`}>
                <div className={isAdminTheme ? "flex items-center gap-[var(--irgen-space-md)]" : "flex items-center gap-[var(--irgen-space-xl)]"}>
                  {brandShowTopbar && (
                    <div className="flex-shrink-0">
                      <Link to="/" className="group flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20 active:scale-95 transition-all" style={{ backgroundColor: "#4f46e5" }}>
                          {brandLogoSrc ? <img src={brandLogoSrc} alt="Logo" className="w-full h-full object-cover rounded-xl" /> : (brandLogoIcon && (Icons as any)[brandLogoIcon] ? React.createElement((Icons as any)[brandLogoIcon], { size: 24 }) : React.createElement((Icons as any)[iconLogoFallback] || Icons.Box, { size: 24 }))}
                        </div>
                        <span className="font-black text-2xl tracking-tighter text-slate-900 dark:text-white">{brandLogoText || "DemoFrontend"}</span>
                      </Link>
                    </div>
                  )}
                  <div className={`hidden sm:flex items-center gap-[var(--irgen-space-xs)] ${topbarLinksWrapClass ? topbarLinksWrapClass : ""}`}>
                    {topbarLinks.map((link: any) => (
                      <Link key={link.path} to={link.path} className={isAdminTheme ? "px-3 py-2 rounded-md text-[11px] font-semibold uppercase tracking-widest text-[var(--irgen-color-muted)] hover:text-slate-900 dark:text-[var(--irgen-color-muted-dark)] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" : "px-4 py-2 rounded-lg text-sm font-bold text-[var(--irgen-color-muted)] hover:text-slate-900 dark:text-[var(--irgen-color-muted-dark)] dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all"}>
                        {(navItemIcons[link.path] || navItemIcons[link.name]) ? React.createElement((Icons as any)[navItemIcons[link.path] || navItemIcons[link.name]] || Icons.Square, { size: 14, className: "mr-2 align-text-bottom" }) : null}
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className={isAdminTheme ? `flex items-center gap-[var(--irgen-space-sm)] ${topbarControlsWrapClass ? topbarControlsWrapClass : ""}` : `flex items-center gap-[var(--irgen-space-md)] ${topbarControlsWrapClass ? topbarControlsWrapClass : ""}`}>
                  {showSearch && (
                    <button onClick={() => setSearchOpen(true)} className="p-2 text-[var(--irgen-color-muted)] hover:text-slate-900 dark:text-[var(--irgen-color-muted-dark)] dark:hover:text-white transition-colors" aria-label="Search">{React.createElement((Icons as any)[iconSearch] || Icons.Search, { size: 20 })}</button>
                  )}
                  {showNotifications && (
                    <button className="p-2 text-[var(--irgen-color-muted)] hover:text-slate-900 dark:text-[var(--irgen-color-muted-dark)] dark:hover:text-white transition-colors" aria-label="Notifications">{React.createElement((Icons as any)[iconNotifications] || Icons.Bell, { size: 20 })}</button>
                  )}
                  {showThemeToggle && (
                    <button 
                      onClick={() => setIsDark(!isDark)}
                      className="p-2 text-[var(--irgen-color-muted)] hover:text-slate-900 dark:text-[var(--irgen-color-muted-dark)] dark:hover:text-white transition-all active:scale-90"
                      aria-label="Toggle theme"
                    >
                      <div className="relative w-5 h-5">
                        {React.createElement((Icons as any)[iconThemeSun] || Icons.Sun, { size: 20, className: "absolute inset-0 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 transition-all text-amber-500" })}
                        {React.createElement((Icons as any)[iconThemeMoon] || Icons.Moon, { size: 20, className: "absolute inset-0 rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-all text-indigo-400" })}
                      </div>
                    </button>
                  )}
                  {topbarCustom.map((item: any, idx: number) => {
                    const Icon = item.icon && (Icons as any)[item.icon];
                    const label = item.label || "Link";
                    const href = item.href || "#";
                    const target = item.target || "_blank";
                    return (
                      <a key={idx} href={href} target={target} rel={target === "_blank" ? "noreferrer" : undefined} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[var(--irgen-color-muted)] hover:text-slate-900 dark:text-[var(--irgen-color-muted-dark)] dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors">
                        {Icon ? <Icon size={16} /> : null}
                        <span>{label}</span>
                      </a>
                    );
                  })}
                  {showAvatar && !(avatarConfig.hideWhenUnauthed && !isAuthed) && !(avatarConfig.hideWhenAuthed && isAuthed) && (
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-700 overflow-hidden shadow-sm">
                       <img src={defaultAvatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </nav>
          )}
  
          {/* Content Area */}
          <main className={isDocsRoute ? (isAdminTheme ? adminMainClass : docsMainClass) : (isAdminTheme ? adminMainClass : defaultMainClass)}>
            {isDocsRoute ? (
              <div className={docsGridClass}>
                {showDocsSidebar && (
                  <aside className="hidden lg:block">
                    <div className="sticky top-28">
                      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)] mb-[var(--irgen-space-sm)]">{docsSidebarLabel}</p>
                      <nav className="space-y-[var(--irgen-space-lg)] text-sm">
                        {docsSidebarGroups.map((group) => (
                          <div key={group.label} className="space-y-[var(--irgen-space-xs)]">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)]">{group.label}</p>
                            <div className="space-y-0">
                              {group.items.map((link) => (
                                <Link key={link.path} to={link.path} className={link.path === location.pathname ? "block px-[var(--irgen-space-xs)] py-[var(--irgen-space-xs)] rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold" : "block px-[var(--irgen-space-xs)] py-[var(--irgen-space-xs)] rounded-lg text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"}>
                                  {link.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </nav>
                    </div>
                  </aside>
                )}
                <div className="min-w-0" data-irgen-content>
                  <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<HomePage />} />
                  </Routes>
                </div>
                {showDocsToc && tocItems.length > 0 && (
                  <aside className="hidden lg:block">
                    <div className="sticky top-28 space-y-[var(--irgen-space-sm)] text-sm">
                      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)]">{docsTocLabel}</p>
                      <ul className="space-y-[var(--irgen-space-xs)]">
                        {tocItems.map((item) => (
                          <li key={item.id} className={item.level === 3 ? "pl-3" : ""}>
                            <a href={`#${item.id}`} className={item.id === activeToc ? "text-slate-900 dark:text-white font-semibold" : "text-[var(--irgen-color-muted)] hover:text-slate-900 dark:text-[var(--irgen-color-muted-dark)] dark:hover:text-white"}>{item.text}</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </aside>
                )}
              </div>
            ) : (
              <div className="min-w-0" data-irgen-content>
                <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<HomePage />} />
                </Routes>
              </div>
            )}
          </main>
  
          {searchEnabled && searchOpen && (
            <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-start justify-center pt-24" onClick={() => setSearchOpen(false)}>
              <div className="bg-[var(--irgen-color-surface)] dark:bg-[var(--irgen-color-surface-dark)] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-[var(--irgen-space-sm)] mb-[var(--irgen-space-sm)]">
                  {React.createElement((Icons as any)[iconSearchInput] || Icons.Search, { size: 18, className: "text-[var(--irgen-color-muted)]" })}
                  <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={searchPlaceholder} className="w-full bg-transparent outline-none text-slate-900 dark:text-white" />
                </div>
                <div className="max-h-[420px] overflow-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {searchResults.length === 0 ? (
                    <div className="text-sm text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)] py-6 text-center">
                      {React.createElement((Icons as any)[iconSearchEmpty] || Icons.Search, { size: 20, className: "mx-auto mb-3 text-[var(--irgen-color-muted)]" })}
                      <div>{searchEmptyMessage}</div>
                    </div>
                  ) : (
                    searchResults.map((item) => (
                      <Link key={item.path} to={item.path} onClick={() => setSearchOpen(false)} className="block py-[var(--irgen-space-sm)] hover:bg-slate-50 dark:hover:bg-slate-800/40 px-[var(--irgen-space-xs)] rounded-[var(--irgen-radius-md)]">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                        {item.description && <p className="text-xs text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)] mt-1">{item.description}</p>}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
  
          {/* Footer */}
          {footerEnabled && (
          <footer className={showSidebar ? "border-t border-slate-200 dark:border-slate-800 mt-[var(--irgen-space-lg)] " + (footerLayout === "compact" ? "py-[var(--irgen-space-sm)]" : "py-[var(--irgen-space-md)]") + " bg-[var(--irgen-color-surface)] dark:bg-[var(--irgen-color-surface-dark)] " + adminOffsetClass : "border-t border-slate-200 dark:border-slate-800 mt-[var(--irgen-space-xl)] " + (footerLayout === "compact" ? "py-[var(--irgen-space-md)]" : "py-[var(--irgen-space-xl)]") + " bg-[var(--irgen-color-surface)]/30 dark:bg-[var(--irgen-color-surface-dark)]/30 backdrop-blur-sm"}>
            <div className={isAdminTheme ? "max-w-none mx-auto px-[var(--irgen-space-md)] flex flex-col md:flex-row justify-between items-center gap-[var(--irgen-space-sm)]" : "max-w-7xl mx-auto px-[var(--irgen-space-md)] lg:px-[var(--irgen-space-xl)] flex flex-col md:flex-row justify-between items-center gap-[var(--irgen-space-md)]"}>
              <div className={isAdminTheme ? "text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)] text-xs font-medium" : "text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)] text-sm font-medium"}>
                {footerText ? footerText : (footerDefaultText ? footerDefaultText : (<>© 2026 DemoFrontend. Powered by <span className="font-bold text-slate-900 dark:text-white">irgen</span></>))}
              </div>
              {showFooterLinks && (
                <div className={isAdminTheme ? "flex gap-[var(--irgen-space-md)] text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)] text-[11px] font-semibold uppercase tracking-widest" : "flex gap-[var(--irgen-space-lg)] text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)] text-sm font-bold uppercase tracking-widest"}>
                  {footerLinks.map((link: any, idx: number) => (
                    <a key={idx} href={link.href} className="inline-flex items-center gap-2 hover:text-slate-900 dark:hover:text-white transition-colors">
                      {(footerLinkIcons[link.href] || footerLinkIcons[link.label]) ? React.createElement((Icons as any)[footerLinkIcons[link.href] || footerLinkIcons[link.label]] || Icons.Link, { size: 14, className: "text-[var(--irgen-color-muted)] dark:text-[var(--irgen-color-muted-dark)]" }) : null}
                      <span>{link.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </footer>
          )}
        </div>
      </ErrorBoundary>
    );
}
