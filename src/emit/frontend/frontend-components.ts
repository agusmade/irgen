import path from "node:path";
import type { Project } from "ts-morph";
import type { FrontendComponent, FrontendMarketing } from "../../ir/domain/frontend.js";
import type { FrontendTargetIR } from "../../ir/target/frontend.js";
import type { FrontendPolicy } from "../../ir/target/frontend.policy.js";
import { pascal, kebab } from "../../utils/string.js";
import { escapeHtml, renderMarkdownToHtml, renderInlineMarkdown, slugifyHeading } from "./frontend-helpers.js";

export function emitComponent(project: Project, frontendDir: string, component: FrontendComponent, ir: FrontendTargetIR) {
  const dir = path.join(frontendDir, "components");
  project.createDirectory(dir);
  const filePath = path.join(dir, `${kebab(component.name)}.tsx`);
  const sf = project.createSourceFile(filePath, "", { overwrite: true });

  const buttonAction = component.button?.onClick;
  const marketingActions = component.marketing?.actions ?? [];
  const marketingActionHandlers = marketingActions.map((action, idx) => action.onClick ? `handleMarketingAction_${idx}` : null);
  const hasNavigateAction = Boolean(
    (buttonAction && buttonAction.kind === "navigate")
    || marketingActions.some((a) => a.onClick?.kind === "navigate"),
  );
  const hasInvokeAction = Boolean(
    (buttonAction && buttonAction.kind === "invoke")
    || marketingActions.some((a) => a.onClick?.kind === "invoke"),
  );
  const buttonClickAttr = buttonAction ? " onClick={handleButtonAction}" : "";

  const hasIpcButton = Boolean((component as any).props && (component as any).props["ipcChannel"]);
  const hasTableRowNav = Boolean(component.table?.rowNavigateTo);
  const tableRowActions = component.table?.rowActions ?? [];
  const hasTableRowActions = tableRowActions.length > 0;
  const needsHooks = !!component.themeToggle || !!(component.form && component.form.fields && component.form.fields.length > 0) || (component.layout?.kind === "tabs") || hasIpcButton || !!component.table;
  const needsParams = !!(component.form && component.form.fields && component.form.fields.length > 0);
  if (needsHooks) {
    sf.addImportDeclaration({ moduleSpecifier: "react", defaultImport: "React", namedImports: ["useEffect", "useState"] });
  } else {
    sf.addImportDeclaration({ moduleSpecifier: "react", defaultImport: "React" });
  }
  sf.addImportDeclaration({ moduleSpecifier: "lucide-react", namespaceImport: "Icons" });
  sf.addImportDeclaration({ moduleSpecifier: "../lib/logic", namedImports: ["evalLogic", "getByPath", "isEmptyVal"] });
  sf.addImportDeclaration({ moduleSpecifier: "../lib/hooks", namedImports: ["useOperation", "useResource"] });
  if (hasNavigateAction || hasTableRowNav || hasTableRowActions) {
    sf.addImportDeclaration({ moduleSpecifier: "react-router-dom", namedImports: ["useNavigate"] });
  }
  if (needsParams) {
    sf.addImportDeclaration({ moduleSpecifier: "react-router-dom", namedImports: ["useParams"] });
  }

  if (component.codeBlock) {
    sf.addImportDeclaration({
      moduleSpecifier: "react-syntax-highlighter",
      namedImports: ["Prism as SyntaxHighlighter"],
    });
    sf.addImportDeclaration({
      moduleSpecifier: "react-syntax-highlighter/dist/esm/styles/prism/one-dark",
      defaultImport: "oneDark",
    });
  }

  // Import layout child components if any
  // Import layout child components if any and valid identifier
  if (component.layout) {
    const childNames = new Set<string>();
    if (component.layout.items) component.layout.items.forEach((c) => childNames.add(c));
    component.layout.tabs?.forEach((t) => t.items?.forEach((c) => childNames.add(c)));
    const isValidIdent = (name: string) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
    for (const childName of childNames) {
      if (childName === component.name) continue; // avoid self-import
      if (!isValidIdent(childName)) continue; // skip placeholder labels
      const safeChildName = pascal(childName);
      sf.addImportDeclaration({
        moduleSpecifier: `./${kebab(childName)}`,
        namedImports: [safeChildName],
      });
    }
  }

  const actionExpr = (expr: any) => {
    if (!expr) return "undefined";
    if (typeof expr === "object" && "logic" in expr) return JSON.stringify(expr.logic);
    return JSON.stringify(expr);
  };

  const writeActionHandler = (writer: any, name: string, actionSpec: any, opVar: string) => {
    if (!actionSpec) return;
    if (actionSpec.kind === "invoke") {
      writer.writeLine(`const ${opVar} = useOperation("${actionSpec.operationId}");`);
      const argsExpr = actionExpr(actionSpec.args);
      const argsCode = argsExpr !== "undefined" ? `evalLogic(${argsExpr}, undefined, actionCtx)` : "{}";
      writer.writeLine(`const ${name} = async () => {`);
      if (actionSpec.confirmMessage) {
        writer.writeLine(`  if (!window.confirm(${JSON.stringify(actionSpec.confirmMessage)})) return;`);
      }
      writer.writeLine(`  const actionInput = ${argsCode};`);
      writer.writeLine(`  await ${opVar}.execute(actionInput, { kind: "system", reason: "action" });`);
      writer.writeLine(`};`);
      return;
    }
    if (actionSpec.kind === "navigate") {
      const toExpr = actionExpr(actionSpec.to);
      writer.writeLine(`const ${name} = () => {`);
      if (actionSpec.confirmMessage) {
        writer.writeLine(`  if (!window.confirm(${JSON.stringify(actionSpec.confirmMessage)})) return;`);
      }
      writer.writeLine(`  const target = evalLogic(${toExpr}, undefined, actionCtx);`);
      writer.writeLine(`  if (target) navigate(String(target));`);
      writer.writeLine(`};`);
    }
  };

  const compName = `${pascal(component.name)}`;
  const fn = sf.addFunction({ name: compName, isExported: true });

  fn.setBodyText((writer) => {
    // Utility classes
    // Utility classes - Modern & Premium
    const primaryColor = ir.policies.frontend.styling.theme.primaryColor || "#000000";
    const visual = (ir.policies.frontend as any).visual ?? {};
    const visualForm = visual.form ?? {};
    const visualButton = visual.button ?? {};
    const visualCards = visual.cards ?? {};
    const visualProse = visual.prose ?? {};
    const visualMotion = visual.motion ?? {};
    const visualCopy = visual.copy ?? {};
    const visualIcons = visual.icons ?? {};
    const visualCli = visual.cli ?? {};
    const labelClass = visualForm.labelClass || "block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1.5";
    const inputClass = visualForm.inputClass || `mt-1 block w-full rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shadow-sm transition-all duration-200 focus:border-slate-900 dark:focus:border-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 sm:text-sm dark:text-slate-100`;
    const checkboxClass = visualForm.checkboxClass || "h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-slate-900 bg-white dark:bg-slate-900";
    const radioClass = visualForm.radioClass || "h-4 w-4 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-slate-900 bg-white dark:bg-slate-900";
    const btnClass = visualForm.buttonClass || `inline-flex items-center justify-center rounded-[var(--irgen-radius-md)] border border-transparent py-2.5 px-5 text-sm font-semibold text-white shadow-[var(--irgen-shadow-md)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2`;
    const buttonBaseClass = visualButton.baseClass || "inline-flex items-center justify-center px-6 py-2.5 rounded-[var(--irgen-radius-md)] text-sm font-bold transition-all active:scale-95 shadow-[var(--irgen-shadow-sm)]";
    const buttonPrimaryClass = visualButton.primaryClass || "text-white hover:opacity-90";
    const buttonSecondaryClass = visualButton.secondaryClass || "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700";
    const buttonGhostClass = visualButton.ghostClass || "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800";
    const cardContainerClass = visualCards.containerClass || "bg-[var(--irgen-color-surface)] dark:bg-[var(--irgen-color-surface-dark)] border border-slate-100 dark:border-slate-800 shadow-[var(--irgen-shadow-md)] rounded-[var(--irgen-radius-lg)] overflow-hidden px-1 py-1";
    const cardHeaderClass = visualCards.headerClass || "px-[var(--irgen-space-md)] py-[var(--irgen-space-sm)] text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30";
    const cardBodyClass = visualCards.bodyClass || "p-[var(--irgen-space-md)] space-y-[var(--irgen-space-lg)]";
    const cardEmptyClass = visualCards.emptyClass || "text-slate-400 dark:text-slate-500 text-sm italic text-center py-10";
    const cardPlaceholderClass = visualCards.placeholderClass || "p-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[var(--irgen-radius-lg)] text-slate-300 dark:text-slate-700 text-xs font-medium uppercase tracking-tighter italic";
    const gridEmptyClass = visualCards.gridEmptyClass || "col-span-full py-20 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[var(--irgen-radius-lg)] text-center text-slate-400 dark:text-slate-500 italic";
    const proseClass = visualProse.className || "prose dark:prose-invert max-w-none";
    const errorClass = visualForm.errorClass || "mt-2 text-xs font-medium text-red-500 dark:text-red-400 flex items-center gap-1";
    const formClass = visualForm.formClass || "space-y-[var(--irgen-space-xl)] bg-[var(--irgen-color-surface)] dark:bg-[var(--irgen-color-surface-dark)] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none px-[var(--irgen-space-lg)] py-[var(--irgen-space-xl)] sm:rounded-2xl";
    const formLayoutClass = (visual as any).breakpoints?.formLayoutClass || "";
    const hoverLiftClass = visualMotion.hoverLiftClass || "transition-all duration-300 hover:-translate-y-1";
    const alertEnterClass = visualMotion.alertEnterClass || "animate-in fade-in slide-in-from-top-2";
    const tagEnterClass = visualMotion.tagEnterClass || "animate-in zoom-in-50";
    const copyPlaceholderPrefix = visualCopy.placeholderPrefix || "Placeholder";
    const copyEmptyPanel = visualCopy.emptyPanel || "Empty panel";
    const copyNoItems = visualCopy.noItems || "No items";
    const copyEmptyTab = visualCopy.emptyTab || "Empty tab";
    const copyNoData = visualCopy.tableEmpty || "No data available";
    const copyTableLoading = visualCopy.tableLoading || "Loading...";
    const copyTabsNoContent = visualCopy.tabsNoContent || "No content.";
    const copyIpcButton = visualCopy.ipcButton || "Invoke IPC Hook";
    const copyTerminalError = visualCopy.terminalError || "EXECUTION ERROR";
    const copyTerminalOutput = visualCopy.terminalOutput || "TERMINAL OUTPUT";
    const iconThemeSun = visualIcons.themeSun || "Sun";
    const iconThemeMoon = visualIcons.themeMoon || "Moon";
    const iconPaginationPrev = visualIcons.paginationPrev || "ChevronLeft";
    const iconPaginationNext = visualIcons.paginationNext || "ChevronRight";
    const iconTagRemove = visualIcons.tagRemove || "X";
    const rowActionIcons = visualIcons.rowActions ?? {};

    // Theme Toggle component
    if (component.themeToggle) {
      writer.writeLine(`const [isDark, setIsDark] = useState(() => {`);
      writer.writeLine(`  if (typeof window !== 'undefined') {`);
      writer.writeLine(`    return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';`);
      writer.writeLine(`  }`);
      writer.writeLine(`  return false;`);
      writer.writeLine(`});`);
      writer.writeLine("");
      writer.writeLine(`useEffect(() => {`);
      writer.writeLine(`  if (isDark) {`);
      writer.writeLine(`    document.documentElement.classList.add('dark');`);
      writer.writeLine(`    localStorage.setItem('theme', 'dark');`);
      writer.writeLine(`  } else {`);
      writer.writeLine(`    document.documentElement.classList.remove('dark');`);
      writer.writeLine(`    localStorage.setItem('theme', 'light');`);
      writer.writeLine(`  }`);
      writer.writeLine(`}, [isDark]);`);
      writer.writeLine("");
      writer.writeLine(`return (`);
      writer.writeLine(`  <button `);
      writer.writeLine(`    onClick={() => setIsDark(!isDark)} `);
      writer.writeLine(`    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all active:scale-95 group" `);
      writer.writeLine(`    aria-label="Toggle dark mode"`);
      writer.writeLine(`  >`);
      writer.writeLine(`    <div className="relative w-5 h-5">`);
      writer.writeLine(`      {React.createElement((Icons as any)["${iconThemeSun}"] || Icons.Sun, { size: 20, className: "absolute inset-0 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 transition-all text-amber-500" })}`);
      writer.writeLine(`      {React.createElement((Icons as any)["${iconThemeMoon}"] || Icons.Moon, { size: 20, className: "absolute inset-0 rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-all text-indigo-400" })}`);
      writer.writeLine(`    </div>`);
      writer.writeLine(`  </button>`);
      writer.writeLine(`);`);
      return;
    }

    if (component.codeBlock) {
      const { snippet, language, showLineNumbers } = component.codeBlock;
      writer.writeLine(`const codeBlock = (`);
      writer.writeLine(`  <div className="rounded-xl overflow-x-auto overflow-y-hidden border border-slate-200 dark:border-slate-800 shadow-sm">`);
      writer.writeLine(`    <SyntaxHighlighter `);
      writer.writeLine(`      language="${language}" `);
      writer.writeLine(`      style={oneDark} `);
      writer.writeLine(`      showLineNumbers={${showLineNumbers}}`);
      writer.writeLine(`      customStyle={{ margin: 0, padding: '1.5rem', fontSize: '0.875rem' }}`);
      writer.writeLine(`    >`);
      writer.writeLine(`      {\`${snippet.replace(/`/g, "\\`").replace(/\${/g, "\\${")}\`}`);
      writer.writeLine(`    </SyntaxHighlighter>`);
      writer.writeLine(`  </div>`);
      writer.writeLine(`);`);
    }

    if (hasInvokeAction || hasNavigateAction) {
      writer.writeLine(`const actionCtx = {};`);
      if (hasNavigateAction) {
        writer.writeLine(`const navigate = useNavigate();`);
      }
      if (buttonAction) {
        writeActionHandler(writer, "handleButtonAction", buttonAction, "buttonActionOp");
      }
      if (marketingActions.length > 0) {
        marketingActions.forEach((action, idx) => {
          if (action.onClick) {
            writeActionHandler(writer, `handleMarketingAction_${idx}`, action.onClick, `marketingActionOp_${idx}`);
          }
        });
      }
      writer.writeLine("");
    }



    const hasInlineContent = !!(component.content || component.codeBlock || component.button);

    // Marketing components
    if (component.marketing) {
      writer.writeLine(`return (`);
      writer.writeLine(`  <>`);
      emitMarketingComponent(writer, component.marketing, ir.policies.frontend, marketingActionHandlers);
      writer.writeLine(`  </>`);
      writer.writeLine(`);`);
      return;
    }

    if (component.agentChat) {
      const title = component.agentChat.title ?? "AI Copilot Integration";
      const messages = component.agentChat.messages ?? [];
      const agentChat = visual.agentChat ?? {};
      const chatContainerClass = agentChat.containerClass || "max-w-2xl mx-auto rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl p-8 shadow-2xl space-y-6";
      const chatHeaderClass = agentChat.headerClass || "text-xs font-bold text-slate-400 uppercase tracking-widest text-center";
      const chatBodyClass = agentChat.bodyClass || "space-y-6";
      const chatMessageClass = agentChat.messageClass || "flex-1 rounded-2xl p-4 text-sm shadow-sm whitespace-pre-line";
      const chatAvatarClass = agentChat.avatarClass || "h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white";
      const chatInputClass = agentChat.inputClass || "w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 px-4 py-3 text-sm";
      const chatInputPlaceholder = agentChat.inputPlaceholder || "Type a message...";
      const chatActionsClass = agentChat.actionsClass || "flex items-center justify-between gap-3";
      writer.writeLine(`const messages = ${JSON.stringify(messages)};`);
      writer.writeLine(`return (`);
      writer.writeLine(`  <div className="${chatContainerClass}">`);
      writer.writeLine(`    <p className="${chatHeaderClass}">{${JSON.stringify(title)}}</p>`);
      writer.writeLine(`    <div className="${chatBodyClass}">`);
      writer.writeLine(`      {messages.map((msg: any, idx: number) => (`);
      writer.writeLine(`        <div key={idx} className="flex gap-4">`);
      writer.writeLine(`          <div className={\`${chatAvatarClass} \${msg.role === 'agent' ? 'bg-sky-500' : 'bg-slate-900'}\`}>{msg.label ?? (msg.role === 'agent' ? 'A' : 'U')}</div>`);
      writer.writeLine(`          <div className={\`${chatMessageClass} \${msg.role === 'agent' ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-900 dark:text-sky-100 border border-sky-100/50 dark:border-sky-500/10' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300'}\`}>`);
      writer.writeLine(`            {msg.content}`);
      writer.writeLine(`          </div>`);
      writer.writeLine(`        </div>`);
      writer.writeLine(`      ))}`);
      writer.writeLine(`    </div>`);
      writer.writeLine(`    <div className="${chatActionsClass}">`);
      writer.writeLine(`      <input className="${chatInputClass}" placeholder="${chatInputPlaceholder}" disabled />`);
      writer.writeLine(`    </div>`);
      writer.writeLine(`  </div>`);
      writer.writeLine(`);`);
      return;
    }

    if (component.cliUsage) {
      const title = component.cliUsage.title ?? "Standard Usage";
      const command = component.cliUsage.command ?? "";
      const options = component.cliUsage.options ?? [];
      const cliLayout = visualCli.layout || "full";
      const cliContainerClass = visualCli.containerClass || (cliLayout === "compact" ? "max-w-3xl mx-auto space-y-4" : "max-w-3xl mx-auto space-y-6");
      const cliTitleClass = visualCli.titleClass || "text-2xl font-bold text-slate-900 dark:text-white";
      const cliCommandClass = visualCli.commandClass || "bg-slate-900 rounded-xl p-4 font-mono text-sm text-green-400 whitespace-pre-wrap";
      const cliOptionsGridClass = visualCli.optionsGridClass || "grid gap-4 mt-8";
      const cliOptionCardClass = visualCli.optionCardClass || "p-6 border border-slate-100 dark:border-slate-800 rounded-2xl";
      const cliOptionTitleClass = visualCli.optionTitleClass || "font-bold mb-2";
      const cliOptionDescClass = visualCli.optionDescClass || "text-sm text-slate-500 italic";
      writer.writeLine(`const options = ${JSON.stringify(options)};`);
      writer.writeLine(`return (`);
      writer.writeLine(`  <div className="${cliContainerClass}">`);
      writer.writeLine(`    <h3 className="${cliTitleClass}">{${JSON.stringify(title)}}</h3>`);
      writer.writeLine(`    <div className="${cliCommandClass}">{${JSON.stringify(command)}}</div>`);
      writer.writeLine(`    {options.length > 0 && (`);
      writer.writeLine(`      <div className="${cliOptionsGridClass}">`);
      writer.writeLine(`        {options.map((opt: any, idx: number) => (`);
      writer.writeLine(`          <div key={idx} className="${cliOptionCardClass}">`);
      writer.writeLine(`            <h4 className="${cliOptionTitleClass}">{opt.flag}</h4>`);
      writer.writeLine(`            <p className="${cliOptionDescClass}">{opt.description}</p>`);
      writer.writeLine(`          </div>`);
      writer.writeLine(`        ))}`);
      writer.writeLine(`      </div>`);
      writer.writeLine(`    )}`);
      writer.writeLine(`  </div>`);
      writer.writeLine(`);`);
      return;
    }

    // Layout components (real child components)
    if (hasIpcButton) {
      const channel = (component as any).props["ipcChannel"];
      const title = (component as any).props["title"] ?? "IPC Demo";
      const description = (component as any).props["description"] ?? "Invoke IPC channel from renderer";
      writer.writeLine(`const [result, setResult] = useState<string | null>(null);`);
      writer.writeLine(`const [error, setError] = useState<string | null>(null);`);
      writer.writeLine(`const handleClick = async () => {`);
      writer.writeLine(`  try {`);
      writer.writeLine(`    // @ts-ignore - bridge injected by Electron preload`);
      writer.writeLine(`    const api = (window as any).api;`);
      writer.writeLine(`    if (!api?.invoke) { setError("IPC bridge unavailable"); return; }`);
      writer.writeLine(`    const res = await api.invoke("${channel}");`);
      writer.writeLine(`    setResult(res ?? "No selection");`);
      writer.writeLine(`    setError(null);`);
      writer.writeLine(`  } catch (err:any) {`);
      writer.writeLine(`    setError(err?.message ?? String(err));`);
      writer.writeLine(`  }`);
      writer.writeLine(`};`);
      writer.writeLine(`return (`);
      writer.writeLine(`  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">`);
      writer.writeLine(`    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">`);
      writer.writeLine(`      <div>`);
      writer.writeLine(`        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">`);
      writer.writeLine(`          <Icons.Activity size={20} className="text-slate-400 dark:text-slate-500" />`);
      writer.writeLine(`          {${JSON.stringify(title)}}`);
      writer.writeLine(`        </h3>`);
      writer.writeLine(`        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{${JSON.stringify(description)}}</p>`);
      writer.writeLine(`      </div>`);
      writer.writeLine(`      <div className="px-2 py-1 rounded bg-slate-900/5 dark:bg-white/5 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-950/5 dark:border-white/5">Bridge: ${channel}</div>`);
      writer.writeLine(`    </div>`);
      writer.writeLine(`    <button onClick={handleClick} className="${btnClass} w-full sm:w-auto" style={{ backgroundColor: "${primaryColor}" }}>`);
      writer.writeLine(`      <Icons.Cpu size={16} className="mr-2" />`);
      writer.writeLine(`      ${copyIpcButton}`);
      writer.writeLine(`    </button>`);
      writer.writeLine(`    {(result || error) && (`);
      writer.writeLine(`      <div className={\`rounded-xl p-4 font-mono text-xs border \${error ? 'bg-red-50 border-red-100 text-red-600' : 'bg-slate-900 text-slate-300 border-white/10 shadow-inner'}\`}>`);
      writer.writeLine(`        <div className="flex items-center gap-2 mb-2 opacity-50">`);
      writer.writeLine(`          <div className={\`w-2 h-2 rounded-full \${error ? 'bg-red-500' : 'bg-green-500 animate-pulse'}\`}></div>`);
      writer.writeLine(`          <span>\${error ? ${JSON.stringify(copyTerminalError)} : ${JSON.stringify(copyTerminalOutput)}}</span>`);
      writer.writeLine(`        </div>`);
      writer.writeLine(`        {error ? error : String(result)}`);
      writer.writeLine(`      </div>`);
      writer.writeLine(`    )}`);
      writer.writeLine(`  </div>`);
      writer.writeLine(`);`);
      return;
    }
    if (component.layout) {
      const kind = component.layout.kind;
      if (kind === "tabs") {
        const tabsVisual = (ir.policies.frontend as any).visual?.tabs ?? {};
        const tabsContainerClass = tabsVisual.containerClass || "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm";
        const tabsHeaderClass = tabsVisual.headerClass || "px-[var(--irgen-space-md)] py-[var(--irgen-space-sm)] border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50";
        const tabsTitleClass = tabsVisual.titleClass || "text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider";
        const tabsWrapClass = tabsVisual.tabsWrapClass || "p-[var(--irgen-space-xs)] flex gap-[var(--irgen-space-xs)] bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800";
        const tabsButtonBaseClass = tabsVisual.tabButtonClass || "flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all";
        const tabsActiveClass = tabsVisual.tabActiveClass || "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm";
        const tabsInactiveClass = tabsVisual.tabInactiveClass || "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200";
        const tabsPanelClass = tabsVisual.panelClass || "p-[var(--irgen-space-lg)]";
        const tabsContentClass = tabsVisual.contentClass || "space-y-[var(--irgen-space-sm)]";
        const tabsEmptyClass = tabsVisual.emptyClass || "text-center py-[var(--irgen-space-xl)] text-slate-400 dark:text-slate-500 text-sm italic border border-dashed border-slate-200 dark:border-slate-800 rounded-[var(--irgen-radius-md)]";
        const tabsNoContentClass = tabsVisual.noContentClass || "text-slate-400 dark:text-slate-500 text-sm";

        writer.writeLine(`const [active, setActive] = useState(0);`);
        writer.writeLine(`const tabs = [`);
        for (const t of component.layout.tabs ?? []) {
          const validItems = (t.items ?? []).filter((n) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(n));
          const tabItems = validItems.map((n) => pascal(n));
          writer.writeLine(`  { label: "${t.label}", content: ${JSON.stringify(t.content ?? "")}, items: [${tabItems.join(", ")}] },`);
        }
        writer.writeLine(`];`);
        writer.writeLine(`return (`);
        writer.writeLine(`  <div className="${tabsContainerClass}">`);
        if (component.layout.title) {
          const titleId = slugifyHeading(component.layout.title);
          writer.writeLine(`    <div className="${tabsHeaderClass}"><h3 className="${tabsTitleClass}"${titleId ? ` id="${titleId}"` : ""}>{${JSON.stringify(component.layout.title)}}</h3></div>`);
        }
        writer.writeLine(`    <div className="${tabsWrapClass}">`);
        writer.writeLine(`      {tabs.map((t:any, idx:number) => (`);
        writer.writeLine(`        <button key={idx} onClick={() => setActive(idx)} className={\`${tabsButtonBaseClass} \${active === idx ? '${tabsActiveClass}' : '${tabsInactiveClass}'}\`}>{t.label}</button>`);
        writer.writeLine(`      ))}`);
        writer.writeLine(`    </div>`);
        writer.writeLine(`    <div className="${tabsPanelClass}">`);
        writer.writeLine(`      {tabs[active] ? (`);
        writer.writeLine(`        <div className="${tabsContentClass}">`);
        writer.writeLine(`          {tabs[active].content && <p className=\"text-slate-600 dark:text-slate-400 leading-relaxed\">{tabs[active].content}</p>}`);
        writer.writeLine(`          {tabs[active].items && tabs[active].items.length > 0 ? (`);
        writer.writeLine(`             <div className=\"grid gap-4\">`);
        writer.writeLine(`               {tabs[active].items.map((Comp: any, idx: number) => <div key={idx}><Comp /></div>)}`);
        writer.writeLine(`             </div>`);
        writer.writeLine(`          ) : (!tabs[active].content && <div className="${tabsEmptyClass}">${copyEmptyTab}</div>)}`);
        writer.writeLine(`        </div>`);
        writer.writeLine(`      ) : <p className="${tabsNoContentClass}">${copyTabsNoContent}</p>}`);
        writer.writeLine(`    </div>`);
        writer.writeLine(`  </div>`);
        writer.writeLine(`);`);
        return;
      } else if (kind === "panel") {
        const docsVariant = component.props?.docsLayout === "true";
        if (docsVariant) {
          writer.writeLine(`return (`);
          writer.writeLine(`  <div className="space-y-4">`);
          if (component.layout.title) {
            const titleId = slugifyHeading(component.layout.title);
            writer.writeLine(`    <h3 className="text-xl font-semibold text-slate-900 dark:text-white"${titleId ? ` id="${titleId}"` : ""}>{${JSON.stringify(component.layout.title)}}</h3>`);
          }
          if (component.content || component.codeBlock || component.button) {
            writer.writeLine(`    <div className="space-y-4">`);
            if (component.content) writer.writeLine(`      <div className="${proseClass}" dangerouslySetInnerHTML={{ __html: ${JSON.stringify(renderMarkdownToHtml(component.content))} }} />`);
            if (component.codeBlock) writer.writeLine(`      {codeBlock}`);
            if (component.button) {
              const variant = component.button.label ? (component.button.variant ?? "primary") : "primary";
              const baseBtn = buttonBaseClass;
              const variantClass = variant === "secondary"
                ? buttonSecondaryClass
                : (variant === "ghost"
                  ? buttonGhostClass
                  : buttonPrimaryClass);
              const style = variant === "primary" ? { backgroundColor: ir.policies.frontend.styling.theme.primaryColor } : {};
              writer.writeLine(`      <button className="${baseBtn} ${variantClass}" style={${JSON.stringify(style)}}${buttonClickAttr}>`);
              if (component.button.icon) {
                writer.writeLine(`        {(Icons as any)["${component.button.icon}"] && React.createElement((Icons as any)["${component.button.icon}"], { size: 16, className: "mr-2" })}`);
              }
              writer.writeLine(`        ${component.button.label}`);
              writer.writeLine(`      </button>`);
            }
            writer.writeLine(`    </div>`);
          }
          if (component.layout.items?.length) {
            writer.writeLine(`    <div className="space-y-4">`);
            for (const item of component.layout.items ?? []) {
              if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(item)) {
                writer.writeLine(`      <${pascal(item)} />`);
              } else {
                writer.writeLine(`      <div className="${cardPlaceholderClass}">${copyPlaceholderPrefix}: ${item}</div>`);
              }
            }
            writer.writeLine(`    </div>`);
          }
          writer.writeLine(`  </div>`);
          writer.writeLine(`);`);
          return;
        }
        writer.writeLine(`return (`);
        writer.writeLine(`  <div className="${cardContainerClass}">`);
        if (component.layout.title) {
          const titleId = slugifyHeading(component.layout.title);
          writer.writeLine(`    <h3 className="${cardHeaderClass}"${titleId ? ` id="${titleId}"` : ""}>{${JSON.stringify(component.layout.title)}}</h3>`);
        }
        writer.writeLine(`    <div className="${cardBodyClass}">`);
        if (component.content || component.codeBlock || component.button) {
          writer.writeLine(`      <div className="space-y-4">`);
          if (component.content) writer.writeLine(`        <div className="${proseClass}" dangerouslySetInnerHTML={{ __html: ${JSON.stringify(renderMarkdownToHtml(component.content))} }} />`);
          if (component.codeBlock) writer.writeLine(`        {codeBlock}`);
          if (component.button) {
            const variant = component.button.label ? (component.button.variant ?? "primary") : "primary";
            const baseBtn = buttonBaseClass;
            const variantClass = variant === "secondary"
              ? buttonSecondaryClass
              : (variant === "ghost"
                ? buttonGhostClass
                : buttonPrimaryClass);
            const style = variant === "primary" ? { backgroundColor: ir.policies.frontend.styling.theme.primaryColor } : {};
            writer.writeLine(`        <button className="${baseBtn} ${variantClass}" style={${JSON.stringify(style)}}${buttonClickAttr}>`);
            if (component.button.icon) {
              writer.writeLine(`          {(Icons as any)["${component.button.icon}"] && React.createElement((Icons as any)["${component.button.icon}"], { size: 16, className: "mr-2" })}`);
            }
            writer.writeLine(`          ${component.button.label}`);
            writer.writeLine(`        </button>`);
          }
          writer.writeLine(`      </div>`);
        }
        if (component.layout.items?.length) {
          for (const item of component.layout.items ?? []) {
            if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(item)) {
              writer.writeLine(`      <${pascal(item)} />`);
            } else {
              writer.writeLine(`      <div className="${cardPlaceholderClass}">${copyPlaceholderPrefix}: ${item}</div>`);
            }
          }
        } else if (!hasInlineContent) {
          writer.writeLine(`      <p className="${cardEmptyClass}">${copyEmptyPanel}</p>`);
        }
        writer.writeLine(`    </div>`);
        writer.writeLine(`  </div>`);
        writer.writeLine(`);`);
        return;
      } else if (kind === "row" || kind === "column") {
        const layoutVariant = component.props?.layoutVariant;
        const cols = component.layout.columns ?? 2;
        const grid = kind === "row" ? `grid-cols-${Math.min(4, Math.max(1, cols))}` : "grid-cols-1";
        const validItems = (component.layout.items ?? []).filter((n) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(n));
        const items = validItems.map((n) => pascal(n));
        writer.writeLine(`const items = [${items.join(", ")}];`);
        writer.writeLine(`return (`);
        if (layoutVariant === "header") {
          writer.writeLine(`  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">`);
        } else {
          writer.writeLine(`  <div className="space-y-6">`);
        }
        if (component.layout.title) {
          const titleId = slugifyHeading(component.layout.title);
          writer.writeLine(`    <h3 className=\"text-2xl font-black text-slate-900 dark:text-white tracking-tight\"${titleId ? ` id="${titleId}"` : ""}>{${JSON.stringify(component.layout.title)}}</h3>`);
        }
        if (component.content || component.codeBlock || component.button) {
          writer.writeLine(`    <div className="space-y-4">`);
          if (component.content) writer.writeLine(`      <div className="${proseClass}" dangerouslySetInnerHTML={{ __html: ${JSON.stringify(renderMarkdownToHtml(component.content))} }} />`);
          if (component.codeBlock) writer.writeLine(`      {codeBlock}`);
          if (component.button) {
            const variant = component.button.label ? (component.button.variant ?? "primary") : "primary";
            const baseBtn = buttonBaseClass;
            const variantClass = variant === "secondary"
              ? buttonSecondaryClass
              : (variant === "ghost"
                ? buttonGhostClass
                : buttonPrimaryClass);
            const style = variant === "primary" ? { backgroundColor: ir.policies.frontend.styling.theme.primaryColor } : {};
            writer.writeLine(`      <button className="${baseBtn} ${variantClass}" style={${JSON.stringify(style)}}${buttonClickAttr}>`);
            if (component.button.icon) {
              writer.writeLine(`        {(Icons as any)["${component.button.icon}"] && React.createElement((Icons as any)["${component.button.icon}"], { size: 16, className: "mr-2" })}`);
            }
            writer.writeLine(`        ${component.button.label}`);
            writer.writeLine(`      </button>`);
          }
          writer.writeLine(`    </div>`);
        }
        if (layoutVariant === "header") {
          writer.writeLine(`    {items.length ? (`);
          writer.writeLine(`      <>`);
          writer.writeLine(`        <div className="min-w-0 flex-1">`);
          writer.writeLine(`          {items[0] ? React.createElement(items[0]) : null}`);
          writer.writeLine(`        </div>`);
          writer.writeLine(`        {items.length > 1 && (`);
          writer.writeLine(`          <div className="flex flex-wrap items-center gap-2">`);
          writer.writeLine(`            {items.slice(1).map((Comp: any, idx: number) => (`);
          writer.writeLine(`              <div key={idx}><Comp /></div>`);
          writer.writeLine(`            ))}`);
          writer.writeLine(`          </div>`);
          writer.writeLine(`        )}`);
          writer.writeLine(`      </>`);
          writer.writeLine(`    ) : null}`);
        } else {
          writer.writeLine("    <div className={`grid gap-[var(--irgen-space-lg)] " + grid + "`}>");
          writer.writeLine(`      {items.length ? items.map((Comp: any, idx: number) => (`);
          writer.writeLine(`        <div key={idx} className="${hoverLiftClass}"><Comp /></div>`);
          if (hasInlineContent) {
            writer.writeLine(`      )) : null}`);
          } else {
            writer.writeLine(`      )) : <div className="${gridEmptyClass}">${copyNoItems}</div>}`);
          }
          writer.writeLine(`    </div>`);
        }
        writer.writeLine(`  </div>`);
        writer.writeLine(`);`);
        return;
      }
    }

    // Non-form content/button components
    if (component.content || component.button || component.codeBlock) {
      const uiVariant = component.props?.uiVariant;
      const isInline = uiVariant === "inline" || uiVariant === "header";
      writer.writeLine(`return (`);
      if (isInline) {
        writer.writeLine(`  <div className="space-y-3">`);
      } else {
        writer.writeLine(`  <div className="${cardContainerClass} ${cardBodyClass}">`);
      }
      if (component.content) writer.writeLine(`    <div className="${proseClass}" dangerouslySetInnerHTML={{ __html: ${JSON.stringify(renderMarkdownToHtml(component.content))} }} />`);
      if (component.codeBlock) writer.writeLine(`    {codeBlock}`);
      if (component.button) {
        const variant = component.button.label ? (component.button.variant ?? "primary") : "primary";
        const baseBtn = buttonBaseClass;
        const variantClass = variant === "secondary"
          ? buttonSecondaryClass
          : (variant === "ghost"
            ? buttonGhostClass
            : buttonPrimaryClass);

        const style = variant === "primary" ? { backgroundColor: ir.policies.frontend.styling.theme.primaryColor } : {};
        writer.writeLine(`    <button className="${baseBtn} ${variantClass}" style={${JSON.stringify(style)}}${buttonClickAttr}>`);
        if (component.button.icon) {
          writer.writeLine(`      {(Icons as any)["${component.button.icon}"] && React.createElement((Icons as any)["${component.button.icon}"], { size: 16, className: "mr-2" })}`);
        }
        writer.writeLine(`      ${component.button.label}`);
        writer.writeLine(`    </button>`);
      }
      writer.writeLine(`  </div>`);
      writer.writeLine(`);`);
      return;
    }

    if (component.form && component.form.fields && component.form.fields.length > 0) {
      // 1. STATE DEFINITIONS
      const stateVars: string[] = [];
      for (const f of component.form.fields) {
        const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
        stateVars.push(varName);
        const initialVal =
          f.type === "checkbox" ? "false /* boolean */" :
            (f.type === "select" && f.multiple) ? "[]" :
              (f.type === "tags" ? "[]" :
                (f.type === "file" && f.multiple ? "[]" :
                  (f.type === "file" ? "null" :
                    (f.type === "daterange" ? "{ start: \"\", end: \"\" }" :
                      "\"\""))));
        writer.writeLine(`const [${varName}, set_${varName}] = useState(${initialVal});`);

        if (f.dataSource) {
          writer.writeLine(`const [options_${varName}, setOptions_${varName}] = useState<{label:string, value:string}[]>([]);`);
          writer.writeLine(`const [loading_${varName}, setLoading_${varName}] = useState(false);`);
          writer.writeLine(`const [error_${varName}, setError_${varName}] = useState<string | null>(null);`);
          writer.writeLine(`const [search_${varName}, setSearch_${varName}] = useState("");`);
          writer.writeLine(`const [page_${varName}, setPage_${varName}] = useState(1);`);
          writer.writeLine(`const [hasMore_${varName}, setHasMore_${varName}] = useState(true);`);
        }
      }

      writer.writeLine(`const [errors, set_errors] = useState({} as Record<string,string>);`);
      writer.writeLine(`const params = useParams();`);
      writer.writeLine(`const paramsKey = JSON.stringify(params);`);
      writer.writeLine(`const ctx = { ${stateVars.map(s => `${s}: ${s}`).join(", ")}, params };`);
      writer.writeLine(`const getFieldVal = (field: string) => getByPath(ctx, field.replace(/[^a-zA-Z0-9_]/g, "_"));`);

      // 2. EFFECTS (Data Fetching, defaults, computed)
      if (component.form.load?.operationId) {
        const loadSpec = component.form.load;
        const loadDeps = new Set<string>();
        (loadSpec.args?.dependencies ?? []).forEach((d) => loadDeps.add(d));
        (loadSpec.when?.dependencies ?? []).forEach((d) => loadDeps.add(d));
        const loadDepExprs = Array.from(loadDeps).map((d) => d === "params"
          ? "paramsKey"
          : d.replace(/[^a-zA-Z0-9_]/g, "_")
        ).filter((d) => d && !stateVars.includes(d));
        if (loadDepExprs.length === 0) loadDepExprs.push("paramsKey");

        writer.writeLine(`const loadOp = useOperation("${loadSpec.operationId}");`);
        writer.writeLine(`useEffect(() => {`);
        writer.writeLine(`  const run = async () => {`);
        if (loadSpec.when) {
          writer.writeLine(`    const shouldLoad = evalLogic(${JSON.stringify(loadSpec.when.logic)}, true, { ...ctx, params });`);
          writer.writeLine(`    if (!shouldLoad) return;`);
        }
        writer.writeLine(`    let payload: any = {};`);
        writer.writeLine(`    if (${loadSpec.args ? "true" : "false"}) {`);
        if (loadSpec.args) {
          writer.writeLine(`      payload = evalLogic(${JSON.stringify(loadSpec.args.logic)}, {}, { ...ctx, params });`);
        }
        writer.writeLine(`    }`);
        writer.writeLine(`    const res = await loadOp.execute(payload);`);
        writer.writeLine(`    if (res.ok) {`);
        writer.writeLine(`      const hookCtx = { ...ctx, params, payload, response: res.data };`);
        if (loadSpec.mapFields) {
          for (const [fieldName, logicExpr] of Object.entries(loadSpec.mapFields)) {
            const varName = fieldName.replace(/[^a-zA-Z0-9_]/g, "_");
            writer.writeLine(`      { const next = evalLogic(${JSON.stringify(logicExpr.logic)}, undefined, hookCtx); if (typeof next !== "undefined") set_${varName}(next); }`);
          }
        }
        if (loadSpec.onSuccess) {
          writer.writeLine(`      evalLogic(${JSON.stringify(loadSpec.onSuccess.logic)}, undefined, hookCtx);`);
        }
        writer.writeLine(`    } else {`);
        writer.writeLine(`      const hookCtx = { ...ctx, params, payload, error: res.error };`);
        if (loadSpec.onError) {
          writer.writeLine(`      evalLogic(${JSON.stringify(loadSpec.onError.logic)}, undefined, hookCtx);`);
        }
        writer.writeLine(`    }`);
        writer.writeLine(`  };`);
        writer.writeLine(`  run();`);
        writer.writeLine(`}, [${loadDepExprs.join(", ")}]);`);
      }

      for (const f of component.form.fields) {
        if (f.dataSource) {
          const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
          const searchParam = f.dataSource.searchParam ?? "q";
          const pageParam = f.dataSource.pageParam ?? "page";
          const pageSizeParam = f.dataSource.pageSizeParam ?? "pageSize";
          const pageSize = f.dataSource.pageSize ?? 20;
          const debounceMs = f.dataSource.debounceMs ?? 300;

          writer.writeLine(`const op_${varName} = useOperation("${f.dataSource.url}"); // In future, this will be an operationId`);
          writer.writeLine(`useEffect(() => {`);
          writer.writeLine(`  const handle = setTimeout(async () => {`);
          writer.writeLine(`    await op_${varName}.execute({ [ "${searchParam}" ]: search_${varName}, ["${pageParam}"]: page_${varName}, ["${pageSizeParam}"]: ${pageSize} });`);
          writer.writeLine(`  }, ${debounceMs});`);
          writer.writeLine(`  return () => clearTimeout(handle);`);
          writer.writeLine(`}, [search_${varName}, page_${varName}]);`);
          writer.writeLine(`useEffect(() => {`);
          writer.writeLine(`  if (op_${varName}.data) setOptions_${varName}(op_${varName}.data as any);`);
          writer.writeLine(`}, [op_${varName}.data]);`);
        }

        if (f.loweredDefaultValue) {
          const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
          const deps = f.loweredDefaultValue.dependencies.map(d => d.replace(/[^a-zA-Z0-9_]/g, "_"));
          writer.writeLine(`useEffect(() => { const v = evalLogic(${JSON.stringify(f.loweredDefaultValue.logic)}, ${varName}, ctx); if (typeof v !== "undefined" && ${varName} === "" ) set_${varName}(v); }, [${deps.join(", ")}]);`);
        }

        if (f.loweredComputeValue) {
          const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
          const deps = f.loweredComputeValue.dependencies.map(d => d.replace(/[^a-zA-Z0-9_]/g, "_"));
          writer.writeLine(`useEffect(() => { const next = evalLogic(${JSON.stringify(f.loweredComputeValue.logic)}, ${varName}, ctx); if (typeof next !== "undefined" && next !== ${varName}) set_${varName}(next); }, [${deps.join(", ")}]);`);
        }
      }

      // 3. VALIDATION
      writer.writeLine(`const validate = () => {`);
      writer.writeLine(`  const n: Record<string,string> = {};`);

      for (const f of component.form.fields) {
        const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
        const rules = f.loweredValidators ?? [];
        if (rules.length === 0) continue;

        writer.writeLine(`  // ${f.name} validation`);
        for (const rule of rules) {
          const msg = JSON.stringify(rule.message);
          writer.writeLine(`  if (!n["${f.name}"]) {`);
          switch (rule.type) {
            case "required":
              writer.writeLine(`    if (isEmptyVal(${varName})) n["${f.name}"] = ${msg};`);
              break;
            case "requiredIf":
              writer.writeLine(`    if (evalLogic(${JSON.stringify(rule.logic)}, false) && isEmptyVal(${varName})) n["${f.name}"] = ${msg};`);
              break;
            case "min":
              if (rule.params?.isDate) {
                writer.writeLine(`    const d = Date.parse(${varName}); const min = Date.parse("${rule.params.value}");`);
                writer.writeLine(`    if (!isNaN(d) && !isNaN(min) && d < min) n["${f.name}"] = ${msg};`);
              } else {
                writer.writeLine(`    if (Number(${varName}) < ${rule.params?.value}) n["${f.name}"] = ${msg};`);
              }
              break;
            case "max":
              if (rule.params?.isDate) {
                writer.writeLine(`    const d = Date.parse(${varName}); const max = Date.parse("${rule.params.value}");`);
                writer.writeLine(`    if (!isNaN(d) && !isNaN(max) && d > max) n["${f.name}"] = ${msg};`);
              } else {
                writer.writeLine(`    if (Number(${varName}) > ${rule.params?.value}) n["${f.name}"] = ${msg};`);
              }
              break;
            case "minLength":
              writer.writeLine(`    if (${varName}.toString().length < ${rule.params?.value}) n["${f.name}"] = ${msg};`);
              break;
            case "maxLength":
              writer.writeLine(`    if (${varName}.toString().length > ${rule.params?.value}) n["${f.name}"] = ${msg};`);
              break;
            case "pattern":
              writer.writeLine(`    try { const re = new RegExp(${JSON.stringify(rule.params?.value)}); if (!re.test(${varName}.toString())) n["${f.name}"] = ${msg}; } catch (_) {}`);
              break;
            case "format":
              if (rule.params?.value === "email") {
                writer.writeLine(`    if (${varName} && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(${varName}.toString())) n["${f.name}"] = ${msg};`);
              } else if (rule.params?.value === "url") {
                writer.writeLine(`    if (${varName}) { try { new URL(${varName}.toString()); } catch (_) { n["${f.name}"] = ${msg}; } }`);
              }
              break;
            case "equalsField":
              writer.writeLine(`    if (${varName} != getFieldVal("${rule.params?.value}")) n["${f.name}"] = ${msg};`);
              break;
            case "notEqualsField":
              writer.writeLine(`    if (${varName} == getFieldVal("${rule.params?.value}")) n["${f.name}"] = ${msg};`);
              break;
            case "greaterThanField":
              writer.writeLine(`    { const other = getFieldVal("${rule.params?.value}"); const lhs = Number(${varName}); const rhs = Number(other); if (!isNaN(lhs) && !isNaN(rhs) && lhs <= rhs) n["${f.name}"] = ${msg}; }`);
              break;
            case "lessThanField":
              writer.writeLine(`    { const other = getFieldVal("${rule.params?.value}"); const lhs = Number(${varName}); const rhs = Number(other); if (!isNaN(lhs) && !isNaN(rhs) && lhs >= rhs) n["${f.name}"] = ${msg}; }`);
              break;
            case "custom":
              writer.writeLine(`    if (!evalLogic(${JSON.stringify(rule.logic)}, false)) n["${f.name}"] = ${msg};`);
              break;
            case "uniqueIn":
              writer.writeLine(`    if (${JSON.stringify(rule.params?.value)}.includes(${varName})) n["${f.name}"] = ${msg};`);
              break;
          }
          writer.writeLine(`  }`);
        }
      }

      writer.writeLine(`  set_errors(n);`);
      writer.writeLine(`  return Object.keys(n).length === 0;`);
      writer.writeLine(`};`);

      writer.writeLine(`const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);`);
      writer.writeLine(`const [submitError, setSubmitError] = useState<string | null>(null);`);
      if (component.form.submit?.draftKey) {
        writer.writeLine(`useEffect(() => {`);
        writer.writeLine(`  try { const raw = localStorage.getItem("${component.form.submit.draftKey}"); if (raw) { const obj = JSON.parse(raw);`);
        for (const f of component.form.fields) {
          const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
          writer.writeLine(`    if (obj["${varName}"] !== undefined) set_${varName}(obj["${varName}"]);`);
        }
        writer.writeLine(`  } } catch (_) {}`);
        writer.writeLine(`}, []);`);
        writer.writeLine(`useEffect(() => {`);
        writer.writeLine(`  const data = { ${stateVars.map(s => `${s}: ${s}`).join(", ")} };`);
        writer.writeLine(`  try { localStorage.setItem("${component.form.submit.draftKey}", JSON.stringify(data)); } catch (_) {}`);
        writer.writeLine(`}, [${stateVars.join(", ")}]);`);
      }
      const submitOpId = component.form.submit?.operationId ?? component.form.submit?.url ?? "";
      writer.writeLine(`const submitOp = useOperation("${submitOpId}");`);
      writer.writeLine(`const onSubmit = async (e: any) => { e.preventDefault(); setSubmitSuccess(null); setSubmitError(null);`);
      if (component.form.submit?.confirmMessage) {
        writer.writeLine(`  if (!window.confirm(${JSON.stringify(component.form.submit.confirmMessage)})) return;`);
      }
      writer.writeLine(`  if (!validate()) return;`);
      writer.writeLine(`  const payload = { ${stateVars.map(s => `${s}: ${s}`).join(", ")} };`);
      writer.writeLine(`  if (${component.form.submit?.beforeSubmit ? "true" : "false"}) {`);
      writer.writeLine(`    const hookCtx = { ...ctx, payload };`);
      writer.writeLine(`    const shouldContinue = evalLogic(${component.form.submit?.beforeSubmit ? JSON.stringify(component.form.submit.beforeSubmit) : "null"}, true, hookCtx);`);
      writer.writeLine(`    if (shouldContinue === false) { setSubmitError("Submission cancelled"); return; }`);
      writer.writeLine(`  }`);
      writer.writeLine(`  if (!${component.form.submit ? "true" : "false"}) { setSubmitSuccess("Saved (mock)"); return; }`);
      writer.writeLine(`  const res = await submitOp.execute(payload);`);
      writer.writeLine(`  if (res.ok) {`);
      writer.writeLine(`    setSubmitSuccess(${component.form.submit?.successMessage ? JSON.stringify(component.form.submit.successMessage) : `"Saved"`});`);
      writer.writeLine(`    const hookCtx = { ...ctx, payload, response: res.data };`);
      if (component.form.submit?.onSuccess) {
        writer.writeLine(`    evalLogic(${JSON.stringify(component.form.submit.onSuccess)}, undefined, hookCtx);`);
      }
      if (component.form.submit?.redirect) {
        writer.writeLine(`    const redirectTo = ${JSON.stringify(component.form.submit.redirect)};`);
        writer.writeLine(`    if (typeof window !== "undefined") {`);
        writer.writeLine(`      const nav = (window as any).__IRGEN_NAVIGATE__;`);
        writer.writeLine(`      if (typeof nav === "function") { nav(String(redirectTo)); } else {`);
        writer.writeLine(`        const base = (window as any).__IRGEN_BASE_PATH__ || "";`);
        writer.writeLine(`        const target = (typeof redirectTo === "string" && redirectTo.startsWith("/") && base && base !== "/")`);
        writer.writeLine(`          ? String(base).replace(/\\/$/, "") + String(redirectTo)`);
        writer.writeLine(`          : String(redirectTo);`);
        writer.writeLine(`        window.location.assign(target);`);
        writer.writeLine(`      }`);
        writer.writeLine(`    }`);
      }
      writer.writeLine(`  } else {`);
      writer.writeLine(`    setSubmitError(res.error?.message ?? ${component.form.submit?.errorMessage ? JSON.stringify(component.form.submit.errorMessage) : `"Submit error"`});`);
      writer.writeLine(`    const hookCtx = { ...ctx, payload, error: res.error };`);
      if (component.form.submit?.onError) {
        writer.writeLine(`    evalLogic(${JSON.stringify(component.form.submit.onError)}, undefined, hookCtx);`);
      }
      writer.writeLine(`  }`);
      if (component.form.submit?.afterSubmit) {
        writer.writeLine(`  const hookCtx = { ...ctx, payload };`);
        writer.writeLine(`  evalLogic(${JSON.stringify(component.form.submit.afterSubmit)}, undefined, hookCtx);`);
      }
      writer.writeLine(`};`);

      // 4. RENDER
      writer.writeLine(`return (`);
      writer.writeLine(`  <form className=\"${formClass}${formLayoutClass ? ` ${formLayoutClass}` : ""}\" onSubmit={onSubmit}>`);

      for (const f of component.form.fields) {
        const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
        const label = f.label ?? f.name;

        const visibleExpr = f.loweredVisibleIf ? JSON.stringify(f.loweredVisibleIf.logic) : undefined;
        writer.writeLine(`    {(() => {`);
        if (visibleExpr) {
          writer.writeLine(`      const visible = evalLogic(${visibleExpr}, true, ctx);`);
          writer.writeLine(`      if (!visible) return null;`);
        }
        const disabledExpr = f.loweredDisabledIf ? JSON.stringify(f.loweredDisabledIf.logic) : undefined;
        writer.writeLine(`      const disabledVal = ${disabledExpr ? `evalLogic(${disabledExpr}, false, ctx)` : "false"};`);

        writer.writeLine(`      return (`);
        writer.writeLine(`    <div className="${f.className ?? ""}">`);
        writer.writeLine(`      <div className="flex items-center gap-2">`);
        writer.writeLine(`        <label className=\"${labelClass}\">${label}</label>`);
        if (f.tooltip) {
          writer.writeLine(`        <span className="text-gray-400 dark:text-gray-500" title="${f.tooltip}">ℹ️</span>`);
        }
        writer.writeLine(`      </div>`);

        // Icon wrapper
        if (f.icon) {
          writer.writeLine(`      <div className="relative mt-1 rounded-md shadow-sm">`);
          writer.writeLine(`        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">`);
          writer.writeLine(`          {(Icons as any)["${f.icon}"] && React.createElement((Icons as any)["${f.icon}"], { size: 16, className: "text-gray-400 dark:text-gray-500" })}`);
          writer.writeLine(`        </div>`);
        } else {
          writer.writeLine(`      <div className="${(f.prefix || f.suffix) ? "relative mt-1" : "mt-1"}">`);
        }

        const baseInput = f.className ? `${inputClass} ${f.className}` : inputClass;
        const paddedInput = f.icon ? `${baseInput} pl-10` : baseInput;
        const inputClassName = (f.prefix ? `${paddedInput} pl-10` : paddedInput) + (f.suffix ? " pr-10" : "");
        if (f.prefix) {
          writer.writeLine(`        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm pointer-events-none">${f.prefix}</span>`);
        }

        if (f.type === "select") {
          if (f.dataSource) {
            writer.writeLine(`        {loading_${varName} && <div className="animate-pulse space-y-2 mb-2" aria-busy="true">`);
            writer.writeLine(`          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full"></div>`);
            writer.writeLine(`          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-2/3"></div>`);
            writer.writeLine(`        </div>}`);
            writer.writeLine(`        {error_${varName} && <p className="text-xs font-semibold text-red-500 mb-2">{error_${varName}}</p>}`);
            writer.writeLine(`        <div className="relative mb-3">`);
            writer.writeLine(`          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />`);
            writer.writeLine(`          <input className="${inputClass} pl-9" placeholder="${f.searchPlaceholder ?? "Type to filter..."}" value={search_${varName}} onChange={e => { setSearch_${varName}(e.target.value); setPage_${varName}(1); }} aria-label="${f.ariaLabel ?? label} search" />`);
            writer.writeLine(`        </div>`);
            writer.writeLine(`        {(() => { const filtered = options_${varName}; return (`);
            writer.writeLine(`          <div className="relative">`);
            writer.writeLine(`            <select className=\"appearance-none ${inputClassName}\" name=\"${f.name}\" ${f.multiple ? "multiple" : ""} value={${f.multiple ? varName : `${varName} || ""`}} onChange={(e) => {`);
            writer.writeLine(`              set_${varName}(${f.multiple ? "Array.from(e.target.selectedOptions).map(o => o.value)" : "e.target.value"});`);
            writer.writeLine(`            }} disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" aria-busy={loading_${varName}} aria-invalid={Boolean(errors["${f.name}"])}>`);
            if (!f.multiple) writer.writeLine(`            <option value="">Select an option...</option>`);
            writer.writeLine(`            {filtered.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}`);
            writer.writeLine(`            </select>`);
            if (!f.multiple) {
              writer.writeLine(`            <Icons.ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />`);
            }
            writer.writeLine(`          </div>`);
            writer.writeLine(`        ); })()}`);
            writer.writeLine(`        <div className="flex items-center justify-between mt-3 px-1">`);
            writer.writeLine(`          <div className="flex gap-2">`);
            writer.writeLine(`            <button type="button" className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setPage_${varName}(p => Math.max(1, p - 1))} disabled={page_${varName} <= 1}>{React.createElement((Icons as any)["${iconPaginationPrev}"] || Icons.ChevronLeft, { size: 16 })}</button>`);
            writer.writeLine(`            <button type="button" className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setPage_${varName}(p => hasMore_${varName} ? p + 1 : p)} disabled={!hasMore_${varName}}>{React.createElement((Icons as any)["${iconPaginationNext}"] || Icons.ChevronRight, { size: 16 })}</button>`);
            writer.writeLine(`          </div>`);
            writer.writeLine(`          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Page {page_${varName}}</span>`);
            if (f.clearable) {
              writer.writeLine(`          <button type="button" className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => set_${varName}(${f.multiple ? "[]" : '""'})}>Reset</button>`);
            }
            writer.writeLine(`        </div>`);
          } else {
            writer.writeLine(`        <div className="relative">`);
            writer.writeLine(`          <select className=\"appearance-none ${inputClassName}\" name=\"${f.name}\" ${f.multiple ? "multiple" : ""} value={${f.multiple ? varName : `${varName} || ""`}} onChange={(e) => {`);
            if (f.multiple) {
              writer.writeLine(`            const vals = Array.from(e.target.selectedOptions).map(o => o.value); set_${varName}(vals);`);
            } else {
              writer.writeLine(`            set_${varName}(e.target.value);`);
            }
            writer.writeLine(`          }} disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" aria-invalid={Boolean(errors["${f.name}"])}>`);
            if (!f.multiple) writer.writeLine(`            <option value="">Select...</option>`);
            if (f.options) {
              for (const opt of f.options) {
                writer.writeLine(`            <option value="${opt.value}">${opt.label}</option>`);
              }
            }
            writer.writeLine(`          </select>`);
            if (!f.multiple) {
              writer.writeLine(`          <Icons.ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />`);
            }
            writer.writeLine(`        </div>`);
            if (f.clearable) {
              writer.writeLine(`        <button type="button" className="mt-2 text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-widest" onClick={() => set_${varName}(${f.multiple ? "[]" : '""'})}>Reset selection</button>`);
            }
          }
        } else if (f.type === "tags") {
          writer.writeLine(`        <div className="flex flex-wrap gap-2 mb-2">`);
          writer.writeLine(`          {${varName}.map((tag: string, idx: number) => (`);
          writer.writeLine(`            <span key={idx} className="inline-flex items-center gap-1.5 bg-slate-900 text-white pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold shadow-sm ${tagEnterClass}">`);
          writer.writeLine(`              {tag}`);
          writer.writeLine(`              <button type="button" onClick={() => set_${varName}(${varName}.filter((_: any,i: number)=>i!==idx))} className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors" aria-label="Remove tag">`);
          writer.writeLine(`                {React.createElement((Icons as any)["${iconTagRemove}"] || Icons.X, { size: 10 })}`);
          writer.writeLine(`              </button>`);
          writer.writeLine(`            </span>`);
          writer.writeLine(`          ))}`);
          writer.writeLine(`        </div>`);
          writer.writeLine(`        <div className="relative">`);
          writer.writeLine(`          <Icons.Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />`);
          writer.writeLine(`          <input className="${inputClassName} pl-9" placeholder="${f.placeholder ?? "New tag..."}" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const val = (e.target as HTMLInputElement).value.trim(); if (val) { set_${varName}([...${varName}, val]); (e.target as HTMLInputElement).value = ""; } } }} disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" />`);
          writer.writeLine(`        </div>`);
          writer.writeLine(`        <div className="relative group/file">`);
          writer.writeLine(`          <input className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" name="${f.name}" type="file" ${f.accept ? `accept="${f.accept}"` : ""} ${f.multiple ? "multiple" : ""} onChange={(e) => { const files = e.target.files; if (!files) return; ${f.multiple ? `set_${varName}(Array.from(files));` : `set_${varName}(files[0] ?? null);`} }} disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" />`);
          writer.writeLine(`          <div className="\${inputClassName} flex items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 group-hover/file:border-slate-400 dark:group-hover/file:border-slate-600 transition-colors text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">`);
          writer.writeLine(`            <div className="text-center">`);
          writer.writeLine(`              <Icons.UploadCloud size={24} className="mx-auto mb-2 opacity-50" />`);
          writer.writeLine(`              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Click or drag to upload</p>`);
          writer.writeLine(`              <p className="text-[10px] mt-1 italic text-slate-400">${f.multiple ? 'Multiple files supported' : (f.accept ? `Accepted: ${f.accept}` : 'All file types')}</p>`);
          writer.writeLine(`            </div>`);
          writer.writeLine(`          </div>`);
          writer.writeLine(`        </div>`);
          writer.writeLine(`        {${varName} && (`);
          writer.writeLine(`          <div className="mt-3 space-y-2">`);
          if (f.multiple) {
            writer.writeLine(`            {(${varName} as File[]).map((file, i) => (`);
            writer.writeLine(`              <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400">`);
            writer.writeLine(`                <Icons.File size={14} className="text-slate-400 dark:text-slate-500" />`);
            writer.writeLine(`                <span className="truncate flex-1">{file.name}</span>`);
            writer.writeLine(`                <span className="text-[10px] text-slate-300 dark:text-slate-600">{(file.size / 1024).toFixed(1)}KB</span>`);
            writer.writeLine(`              </div>`);
            writer.writeLine(`            ))}`);
          } else {
            writer.writeLine(`            <div className="flex items-center gap-2 p-2 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200">`);
            writer.writeLine(`              <Icons.FileCheck size={14} className="text-emerald-500 dark:text-emerald-400" />`);
            writer.writeLine(`              <span className="truncate flex-1">{(${varName} as File).name}</span>`);
            writer.writeLine(`              <button type="button" onClick={() => set_${varName}(null)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"><Icons.X size={14}/></button>`);
            writer.writeLine(`            </div>`);
          }
          writer.writeLine(`          </div>`);
          writer.writeLine(`        )}`);
          const minVal = (f.validators && typeof f.validators.min !== "undefined") ? f.validators.min : 0;
          const maxVal = (f.validators && typeof f.validators.max !== "undefined") ? f.validators.max : 100;
          const stepVal = f.step ?? 1;
          writer.writeLine(`        <div className="py-4 px-1">`);
          writer.writeLine(`          <input className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white" type="range" min="${minVal}" max="${maxVal}" step="${stepVal}" value={${varName} || ${minVal}} onChange={(e) => set_${varName}(e.target.value)} disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" />`);
          writer.writeLine(`          <div className="flex justify-between mt-3">`);
          writer.writeLine(`            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase underline decoration-slate-200 dark:decoration-slate-800 decoration-2 underline-offset-4">${minVal}</span>`);
          writer.writeLine(`            <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-slate-900/20 dark:shadow-white/10">{${varName} || ${minVal}}</span>`);
          writer.writeLine(`            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase underline decoration-slate-200 dark:decoration-slate-800 decoration-2 underline-offset-4">${maxVal}</span>`);
          writer.writeLine(`          </div>`);
          writer.writeLine(`        </div>`);
          writer.writeLine(`        <div className="relative group/currency">`);
          writer.writeLine(`          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none group-focus-within/currency:text-slate-900 dark:group-focus-within/currency:text-white transition-colors">${f.defaultCurrency ?? "Rp"}</div>`);
          writer.writeLine(`          <input className="${inputClassName} pl-10 font-bold text-slate-900 dark:text-white" name="${f.name}" type="number" value={${varName}} onChange={(e) => set_${varName}(e.target.value)} placeholder="${f.placeholder ?? '0.00'}" disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" />`);
          writer.writeLine(`        </div>`);
          writer.writeLine(`        <div className="flex gap-3">`);
          writer.writeLine(`          <div className="relative flex-1">`);
          writer.writeLine(`            <Icons.Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />`);
          writer.writeLine(`            <input className="${inputClassName} pl-9" type="date" value={${varName}.start} onChange={(e)=> set_${varName}({...${varName}, start: e.target.value})} disabled={disabledVal} aria-label="${f.ariaLabel ?? label} start" />`);
          writer.writeLine(`          </div>`);
          writer.writeLine(`          <div className="flex items-center text-slate-300 dark:text-slate-600 font-bold">→</div>`);
          writer.writeLine(`          <div className="relative flex-1">`);
          writer.writeLine(`            <Icons.Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />`);
          writer.writeLine(`            <input className="${inputClassName} pl-9" type="date" value={${varName}.end} onChange={(e)=> set_${varName}({...${varName}, end: e.target.value})} disabled={disabledVal} aria-label="${f.ariaLabel ?? label} end" />`);
          writer.writeLine(`          </div>`);
          writer.writeLine(`        </div>`);
          writer.writeLine(`        <div className="relative group/sig">`);
          writer.writeLine(`          <div className="absolute top-3 right-3 opacity-20 group-hover/sig:opacity-40 transition-opacity">`);
          writer.writeLine(`            <Icons.PenTool size={32} className="text-slate-300 dark:text-slate-600" />`);
          writer.writeLine(`          </div>`);
          writer.writeLine(`          <textarea className="${inputClassName} min-h-[120px] font-mono text-xs border-2 border-slate-100 dark:border-slate-800 italic" name="${f.name}" value={${varName}} onChange={(e)=> set_${varName}(e.target.value)} placeholder="${f.placeholder ?? 'Signature trace or base64...'}" disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" />`);
          writer.writeLine(`          <div className="mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 uppercase tracking-tighter">`);
          writer.writeLine(`            <Icons.ShieldCheck size={12} className="text-emerald-500 dark:text-emerald-400" /> Secure digital verification trace`);
          writer.writeLine(`          </div>`);
          writer.writeLine(`        </div>`);
        } else {
          const inputType = (["number", "email", "password", "date", "datetime", "time", "url", "phone"].includes(f.type)) ? (f.type === "phone" ? "tel" : f.type) : "text";
          if (f.type === "textarea") {
            writer.writeLine(`        <textarea className=\"${inputClassName} min-h-[140px] resize-none\" name=\"${f.name}\" value={${varName}} onChange={(e) => set_${varName}(e.target.value)} placeholder=\"${f.placeholder ?? ''}\" disabled={disabledVal} />`);
          } else if (f.type === "checkbox") {
            writer.writeLine(`        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4 transition-all hover:bg-slate-100/50">`);
            writer.writeLine(`          <input className=\"${checkboxClass} w-5 h-5 cursor-pointer\" name=\"${f.name}\" checked={${varName}} onChange={(e) => set_${varName}(e.target.checked)} type="checkbox" disabled={disabledVal} />`);
            writer.writeLine(`          <div className="flex-1">`);
            writer.writeLine(`            <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">Confirm Selection</p>`);
            writer.writeLine(`            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Check to acknowledge that the data above is correct.</p>`);
            writer.writeLine(`          </div>`);
            writer.writeLine(`        </div>`);
          } else if (f.type === "radio") {
            if (f.options) {
              writer.writeLine(`        <div className="grid gap-3">`);
              for (const opt of (f.options ?? [])) {
                writer.writeLine(`          <label className={\`relative flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all \${${varName} === "${opt.value}" ? 'border-slate-950 dark:border-white bg-slate-50 dark:bg-slate-900 shadow-inner' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}\`}>`);
                writer.writeLine(`            <input className="sr-only" type="radio" name="${f.name}" value="${opt.value}" checked={${varName} === "${opt.value}"} onChange={(e) => set_${varName}(e.target.value)} disabled={disabledVal} />`);
                writer.writeLine(`            <div className="flex-1">`);
                writer.writeLine(`              <p className={\`text-sm font-bold \${${varName} === "${opt.value}" ? 'text-slate-950 dark:text-white' : 'text-slate-600 dark:text-slate-400'}\`}>${opt.label}</p>`);
                writer.writeLine(`              <p className="text-[10px] text-slate-400 dark:text-slate-500">Option preference identifier: ${opt.value}</p>`);
                writer.writeLine(`            </div>`);
                writer.writeLine(`            <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center \${${varName} === "${opt.value}" ? 'border-slate-950 dark:border-white bg-white dark:bg-slate-900' : 'border-slate-200 dark:border-slate-700'}\`}>`);
                writer.writeLine(`              {${varName} === "${opt.value}" && <div className="w-2.5 h-2.5 rounded-full bg-slate-950 dark:bg-white animate-in zoom-in-50" />}`);
                writer.writeLine(`            </div>`);
                writer.writeLine(`          </label>`);
              }
              writer.writeLine(`        </div>`);
            } else {
              writer.writeLine(`        <input className=\"${inputClassName}\" name=\"${f.name}\" value={${varName}} onChange={(e) => set_${varName}(e.target.value)} type="text" placeholder=\"${f.placeholder ?? ''}\" disabled={disabledVal} />`);
            }
          } else {
            writer.writeLine(`        <input className=\"${inputClassName} h-11\" name=\"${f.name}\" value={${varName}} onChange={(e) => set_${varName}(e.target.value)} type=\"${inputType}\" placeholder=\"${f.placeholder ?? ''}\" disabled={disabledVal} />`);
          }
        }

        if (f.suffix) {
          writer.writeLine(`        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 text-sm pointer-events-none">${f.suffix}</span>`);
        }

        writer.writeLine(`      </div>`); // End relative wrapper/mt-1

        if (f.description) {
          writer.writeLine(`      <p className="mt-2.5 text-xs font-medium text-slate-400 dark:text-slate-500 leading-relaxed">${f.description}</p>`);
        }
        writer.writeLine(`      {errors["${f.name}"] && <div className=\"${errorClass}\"><Icons.AlertCircle size={12}/> {errors["${f.name}"]}</div>}`);
        if (f.helpHtml) {
          writer.writeLine(`      <div className="mt-3 p-3 bg-slate-900/5 dark:bg-white/5 rounded-lg border border-slate-950/5 dark:border-white/5 text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-normal italic" dangerouslySetInnerHTML={{ __html: ${JSON.stringify(f.helpHtml)} }} />`);
        }
        writer.writeLine(`    </div>`);
        writer.writeLine(`      );`);
        writer.writeLine(`    })()}`);
        writer.writeLine("");
      }

      writer.writeLine(`    {submitSuccess && <div className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 px-4 py-3 rounded-xl text-sm font-medium ${alertEnterClass}">{submitSuccess}</div>}`);
      writer.writeLine(`    {submitError && <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 px-4 py-3 rounded-xl text-sm font-medium ${alertEnterClass}">{submitError}</div>}`);
      writer.writeLine(`    <button className="${btnClass} w-full shadow-lg" style={{ backgroundColor: "${primaryColor}" }} type="submit" disabled={submitOp.loading}>`);
      writer.writeLine(`      {submitOp.loading ? (`);
      writer.writeLine(`        <span className="flex items-center gap-2">`);
      writer.writeLine(`          <Icons.Loader2 className="animate-spin" size={18} />`);
      writer.writeLine(`          Submitting...`);
      writer.writeLine(`        </span>`);
      const submitLabel = component.form.submit?.label ?? "Submit";
      writer.writeLine(`      ) : ${JSON.stringify(submitLabel)}}`);
      writer.writeLine(`    </button>`);
      writer.writeLine(`  </form>`);
      writer.writeLine(`);`);

    } else {
      if (component.table) {
        const opId = component.table.operationId || (component.table.resourceId ? `${component.table.resourceId}.list` : "");
        writer.writeLine(`const op = useOperation("${opId}");`);
        if (hasTableRowNav || hasTableRowActions) {
          writer.writeLine(`const navigate = useNavigate();`);
        }
        if (hasTableRowActions) {
          tableRowActions.forEach((action, idx) => {
            if (action.onClick?.kind === "invoke") {
              writer.writeLine(`const rowActionOp_${idx} = useOperation("${action.onClick.operationId}");`);
            }
          });
        }
        writer.writeLine(`const invalidateKey = (typeof window !== "undefined" && (window as any).__IRGEN_INVALIDATE_KEY__) ? (window as any).__IRGEN_INVALIDATE_KEY__ : 0;`);
        writer.writeLine(`useEffect(() => { op.execute(); }, [invalidateKey]);`);
        writer.writeLine(`const data = op.data || [];`);
        const tableVisual = (ir.policies.frontend as any).visual?.table ?? {};
        const tableContainerClass = tableVisual.containerClass || "bg-[var(--irgen-color-surface)] dark:bg-[var(--irgen-color-surface-dark)] border border-slate-100 dark:border-slate-800 shadow-[var(--irgen-shadow-md)] rounded-[var(--irgen-radius-lg)] overflow-hidden";
        const tableTableClass = tableVisual.tableClass || "min-w-full divide-y divide-slate-100 dark:divide-slate-800";
        const tableHeadClass = tableVisual.headClass || "bg-slate-50/50 dark:bg-slate-900/50";
        const tableHeaderCellClass = tableVisual.headerCellClass || "px-[var(--irgen-space-lg)] py-[var(--irgen-space-sm)] text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider";
        const tableBodyClass = tableVisual.bodyClass || "divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900";
        const tableRowClass = tableVisual.rowClass || "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150";
        const tableRowClickableClass = tableVisual.rowClickableClass || "cursor-pointer";
        const tableCellClass = tableVisual.cellClass || "px-[var(--irgen-space-lg)] py-[var(--irgen-space-sm)] whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 font-medium";
        const tableActionsCellClass = tableVisual.actionsCellClass || tableCellClass;
        const tableActionsWrapClass = tableVisual.actionsWrapClass || "flex items-center gap-2";
        const tableActionButtonClass = tableVisual.actionButtonClass || "px-3 py-1.5 rounded-[var(--irgen-radius-md)] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors";
        const tableLoadingClass = tableVisual.loadingClass || "px-6 py-10 text-center text-slate-400";
        const tableEmptyClass = tableVisual.emptyClass || "px-6 py-10 text-center text-slate-400";

        writer.writeLine(`return (`);
        writer.writeLine(`  <div className="${tableContainerClass}">`);
        const tableWrapperClass = (ir.policies.frontend as any).visual?.breakpoints?.tableWrapperClass || "";
        writer.writeLine(`    <div className="overflow-x-auto${tableWrapperClass ? ` ${tableWrapperClass}` : ""}">`);
        writer.writeLine(`      <table className="${tableTableClass}">`);
        writer.writeLine(`        <thead className="${tableHeadClass}">`);
        writer.writeLine(`          <tr>`);
        for (const col of component.table.columns ?? []) {
          writer.writeLine(`            <th className="${tableHeaderCellClass}">${col.header}</th>`);
        }
        if (hasTableRowActions) {
          writer.writeLine(`            <th className="${tableHeaderCellClass}">Actions</th>`);
        }
        writer.writeLine(`          </tr>`);
        writer.writeLine(`        </thead>`);
        writer.writeLine(`        <tbody className="${tableBodyClass}">`);
        writer.writeLine(`          {op.loading && <tr><td colSpan={${(component.table.columns?.length ?? 1) + (hasTableRowActions ? 1 : 0)}} className="${tableLoadingClass}">${copyTableLoading}</td></tr>}`);
        writer.writeLine(`          {!op.loading && data.length === 0 && <tr><td colSpan={${(component.table.columns?.length ?? 1) + (hasTableRowActions ? 1 : 0)}} className="${tableEmptyClass}">${copyNoData}</td></tr>}`);
        writer.writeLine(`          {data.map((item: any, i: number) => (`);
        const rowClass = hasTableRowNav
          ? `${tableRowClass} ${tableRowClickableClass}`.trim()
          : tableRowClass;
        const rowClick = hasTableRowNav
          ? ` onClick={() => { const tmpl = ${JSON.stringify(component.table?.rowNavigateTo)}; const path = tmpl.replace(/:([A-Za-z0-9_]+)/g, (_: any, key: string) => String(item[key] ?? "")); if (path) navigate(path); }}`
          : "";
        writer.writeLine(`            <tr key={i} className="${rowClass}"${rowClick}>`);
        for (const col of component.table.columns ?? []) {
          writer.writeLine(`              <td className="${tableCellClass}">{String(item["${col.accessor}"])}</td>`);
        }
        if (hasTableRowActions) {
          writer.writeLine(`              <td className="${tableActionsCellClass}">`);
          writer.writeLine(`                <div className="${tableActionsWrapClass}">`);
          tableRowActions.forEach((action, idx) => {
            const label = action.label;
            if (action.onClick?.kind === "navigate") {
              const toExpr = actionExpr(action.onClick.to);
              const confirmMsg = action.onClick.confirmMessage;
              const confirmSnippet = confirmMsg ? `if (!window.confirm(${JSON.stringify(confirmMsg)})) return; ` : "";
              const iconName = rowActionIcons[label];
              const iconSnippet = iconName ? `React.createElement((Icons as any)["${iconName}"] || Icons.Square, { size: 14, className: "mr-1.5" })` : "null";
              writer.writeLine(`                  <button type="button" className="${tableActionButtonClass}" onClick={(e) => { e.stopPropagation(); ${confirmSnippet} let target = evalLogic(${toExpr}, undefined, { item }); if (typeof target === "string" && target.includes(":")) { target = target.replace(/:([A-Za-z0-9_]+)/g, (_: any, key: string) => String(item[key] ?? "")); } if (target) navigate(String(target)); }}>`);
              writer.writeLine(`                    {${iconSnippet}}`);
              writer.writeLine(`                    ${label}`);
              writer.writeLine(`                  </button>`);
            } else if (action.onClick?.kind === "invoke") {
              const argsExpr = actionExpr(action.onClick.args);
              const argsCode = argsExpr !== "undefined" ? `evalLogic(${argsExpr}, undefined, { item })` : "{}";
              const confirmMsg = action.onClick.confirmMessage;
              const confirmSnippet = confirmMsg ? `if (!window.confirm(${JSON.stringify(confirmMsg)})) return; ` : "";
              const iconName = rowActionIcons[label];
              const iconSnippet = iconName ? `React.createElement((Icons as any)["${iconName}"] || Icons.Square, { size: 14, className: "mr-1.5" })` : "null";
              writer.writeLine(`                  <button type="button" className="${tableActionButtonClass}" onClick={(e) => { e.stopPropagation(); ${confirmSnippet} const input = ${argsCode}; rowActionOp_${idx}.execute(input, { kind: "tableRow", pageId: "", rowId: String(item["slug"] ?? i) }); }}>`);
              writer.writeLine(`                    {${iconSnippet}}`);
              writer.writeLine(`                    ${label}`);
              writer.writeLine(`                  </button>`);
            }
          });
          writer.writeLine(`                </div>`);
          writer.writeLine(`              </td>`);
        }
        writer.writeLine(`            </tr>`);
        writer.writeLine(`          ))}`);
        writer.writeLine(`        </tbody>`);
        writer.writeLine(`      </table>`);
        writer.writeLine(`    </div>`);
        writer.writeLine(`  </div>`);
        writer.writeLine(`);`);
        return;
      }

      writer.writeLine(`return (`);
      writer.writeLine(`  <div className=\"p-6 bg-white shadow rounded-lg\">`);
      if (component.entityRef) {
        writer.writeLine(`    <h3 className=\"text-lg font-medium leading-6 text-gray-900 dark:text-white\">${component.name}</h3>`);
        writer.writeLine(`    <p className=\"mt-1 text-sm text-gray-500 dark:text-gray-400\">Entity: ${component.entityRef}</p>`);
      } else {
        writer.writeLine(`    <h3 className=\"text-lg font-medium leading-6 text-gray-900\">${component.name}</h3>`);
        writer.writeLine(`    <div className=\"mt-4 border-t border-gray-200 pt-4\">`);
        if (component.props) {
          writer.writeLine(`      <dl className=\"grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2\">`);
          for (const [key, type] of Object.entries(component.props)) {
            writer.writeLine(`        <div className=\"sm:col-span-1\">`);
            writer.writeLine(`          <dt className=\"text-sm font-medium text-gray-500 dark:text-gray-400\">${key}</dt>`);
            writer.writeLine(`          <dd className=\"mt-1 text-sm text-gray-900 dark:text-gray-100\">{${JSON.stringify(type)}}</dd>`); // Escape via JSX expression
            writer.writeLine(`        </div>`);
          }
          writer.writeLine(`      </dl>`);
        }
        writer.writeLine(`    </div>`);
      }
      writer.writeLine(`  </div>`);
      writer.writeLine(`);`);
    }
  });
}

export function emitMarketingComponent(writer: any, m: FrontendMarketing, policy: FrontendPolicy, actionHandlers?: Array<string | null>) {
  const primaryColor = policy.styling.theme.primaryColor;
  const basePath = policy.framework?.rendering?.basePath ?? "/";
  const normalizeBasePath = (value: string) => {
    if (!value || value === "/") return "";
    let normalized = value.trim();
    if (!normalized.startsWith("/")) normalized = `/${normalized}`;
    if (normalized.endsWith("/")) normalized = normalized.slice(0, -1);
    return normalized;
  };
  const resolveHref = (href?: string) => {
    if (!href) return "#";
    if (href.startsWith("#")) return href;
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href) || href.startsWith("//")) return href;
    const base = normalizeBasePath(basePath);
    if (!base) return href;
    if (!href.startsWith("/")) return `${base}/${href}`;
    if (href === base || href.startsWith(`${base}/`)) return href;
    return `${base}${href}`;
  };
  const marketingVisual = (policy as any).visual?.marketing ?? {};
  const radiusMap: Record<string, string> = { none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", full: "rounded-full" };
  const radius = radiusMap[policy.styling.theme.borderRadius] || "rounded-xl";

  if (m.kind === "hero") {
    const heroVisual = marketingVisual.hero ?? {};
    const heroContainerClass = heroVisual.containerClass || `relative overflow-hidden ${radius} bg-slate-950 dark:bg-black text-white p-[var(--irgen-space-xl)] md:p-[calc(var(--irgen-space-xl)*1.5)]`;
    const heroTitleClass = heroVisual.titleClass || "text-4xl md:text-6xl font-bold tracking-tight leading-tight";
    const heroSubtitleClass = heroVisual.subtitleClass || "text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed";
    writer.writeLine(`    <div className="${heroContainerClass}">`);
    writer.writeLine(`      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, ${primaryColor}, transparent)' }}></div>`);
    writer.writeLine(`      <div className="relative max-w-4xl space-y-[var(--irgen-space-xl)]">`);
    if (m.badge) {
      writer.writeLine(`        <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium border border-white/10 text-slate-300">`);
      writer.writeLine(`          {${JSON.stringify(m.badge)}}`);
      writer.writeLine(`        </div>`);
    }
    writer.writeLine(`        <h1 className="${heroTitleClass}">`);
    writer.writeLine(`          {${JSON.stringify(m.title)}}`);
    writer.writeLine(`        </h1>`);
    writer.writeLine(`        <p className="${heroSubtitleClass}">`);
    writer.writeLine(`          {${JSON.stringify(m.subtitle)}}`);
    writer.writeLine(`        </p>`);
    if (m.actions && m.actions.length > 0) {
      writer.writeLine(`        <div className="flex flex-wrap gap-[var(--irgen-space-sm)]">`);
      m.actions.forEach((a, idx) => {
        const btnCls = a.variant === "primary" ? `bg-[${primaryColor}] text-white` : "bg-white/10 text-white border border-white/20 hover:bg-white/20";
        const handler = actionHandlers?.[idx];
        const href = resolveHref(a.href);
        if (handler) {
          writer.writeLine(`          <button type="button" onClick={${handler}} className="inline-flex items-center gap-2 px-6 py-3 font-semibold ${radius} transition-all ${btnCls}">`);
        } else {
          writer.writeLine(`          <a href="${href}" className="inline-flex items-center gap-2 px-6 py-3 font-semibold ${radius} transition-all ${btnCls}">`);
        }
        if (a.icon) writer.writeLine(`            {React.createElement((Icons as any)["${a.icon}"], { size: 20 })}`);
        writer.writeLine(`            {${JSON.stringify(a.label)}}`);
        writer.writeLine(handler ? `          </button>` : `          </a>`);
      });
      writer.writeLine(`        </div>`);
    }
    writer.writeLine(`      </div>`);
    writer.writeLine(`    </div>`);
  } else if (m.kind === "features") {
    const featuresVisual = marketingVisual.features ?? {};
    const featuresContainerClass = featuresVisual.containerClass || "py-[var(--irgen-space-xl)] px-[var(--irgen-space-xs)]";
    const featuresTitleClass = featuresVisual.titleClass || "text-3xl font-bold text-slate-900 dark:text-white";
    const featuresSubtitleClass = featuresVisual.subtitleClass || "text-slate-500 dark:text-slate-400";
    const featuresGridClass = featuresVisual.gridClass || "grid grid-cols-1 md:grid-cols-3 gap-[var(--irgen-space-lg)]";
    const align = m.align ?? "left";
    const headerAlign = align === "center" ? "text-center" : "text-left";
    const cardAlign = align === "center" ? "text-center items-center" : "text-left";
    const iconWrap = align === "center" ? "mx-auto" : "";
    const featuresCardClass = featuresVisual.cardClass || `p-6 border border-slate-100 dark:border-slate-800 ${radius} bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow ${cardAlign}`;
    writer.writeLine(`    <div className="${featuresContainerClass}">`);
    if (m.title || m.subtitle) {
      writer.writeLine(`      <div className="${headerAlign} mb-[var(--irgen-space-xl)] space-y-[var(--irgen-space-xs)]">`);
      if (m.title) writer.writeLine(`        <h2 className="${featuresTitleClass}">{${JSON.stringify(m.title)}}</h2>`);
      if (m.subtitle) {
        const subtitleClass = align === "center" ? "max-w-2xl mx-auto" : "max-w-2xl";
        writer.writeLine(`        <p className="${featuresSubtitleClass} ${subtitleClass}">{${JSON.stringify(m.subtitle)}}</p>`);
      }
      writer.writeLine(`      </div>`);
    }
    writer.writeLine(`      <div className="${featuresGridClass}">`);
    for (const item of (m.items || [])) {
      writer.writeLine(`        <div className="${featuresCardClass}">`);
      if (item.icon) {
        writer.writeLine(`          <div className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 text-[${primaryColor}] ${iconWrap}">`);
        writer.writeLine(`            {React.createElement((Icons as any)["${item.icon}"], { size: 24 })}`);
        writer.writeLine(`          </div>`);
      }
      writer.writeLine(`          <h3 className="text-lg font-semibold mb-2 dark:text-white">{${JSON.stringify(item.title)}}</h3>`);
      writer.writeLine(`          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{${JSON.stringify(item.description)}}</p>`);
      writer.writeLine(`        </div>`);
    }
    writer.writeLine(`      </div>`);
    writer.writeLine(`    </div>`);
  } else if (m.kind === "logos") {
    const logosVisual = marketingVisual.logos ?? {};
    const logosContainerClass = logosVisual.containerClass || "py-[var(--irgen-space-xl)] border-y border-slate-100 dark:border-slate-800";
    const logosTitleClass = logosVisual.titleClass || "text-center text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-[var(--irgen-space-lg)]";
    const logosGridClass = logosVisual.gridClass || "flex flex-wrap items-center justify-center gap-x-12 gap-y-10 opacity-50 grayscale hover:grayscale-0 transition-all";
    writer.writeLine(`    <div className="${logosContainerClass}">`);
    if (m.title) writer.writeLine(`      <p className="${logosTitleClass}">{${JSON.stringify(m.title)}}</p>`);
    writer.writeLine(`      <div className="${logosGridClass}">`);
    for (const item of (m.items || [])) {
      writer.writeLine(`        <div className="flex items-center gap-2 group text-slate-900 dark:text-white">`);
      if (item.icon) writer.writeLine(`          {React.createElement((Icons as any)["${item.icon}"], { size: 24, className: "opacity-60 group-hover:opacity-100 transition-opacity" })}`);
      writer.writeLine(`          <span className="font-black text-2xl group-hover:text-[${primaryColor}] transition-colors">{${JSON.stringify(item.title)}}</span>`);
      writer.writeLine(`        </div>`);
    }
    writer.writeLine(`      </div>`);
    writer.writeLine(`    </div>`);
  } else if (m.kind === "testimonials") {
    const testimonialsVisual = marketingVisual.testimonials ?? {};
    const testimonialsContainerClass = testimonialsVisual.containerClass || "py-[var(--irgen-space-xl)] space-y-[var(--irgen-space-lg)]";
    const testimonialsTitleClass = testimonialsVisual.titleClass || "text-3xl font-bold text-center mb-[var(--irgen-space-xl)] dark:text-white";
    const testimonialsGridClass = testimonialsVisual.gridClass || "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--irgen-space-md)]";
    const testimonialsCardClass = testimonialsVisual.cardClass || `p-6 ${radius} border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4`;
    writer.writeLine(`    <div className="${testimonialsContainerClass}">`);
    if (m.title) writer.writeLine(`      <h2 className="${testimonialsTitleClass}">{${JSON.stringify(m.title)}}</h2>`);
    writer.writeLine(`      <div className="${testimonialsGridClass}">`);
    for (const item of (m.items || [])) {
      writer.writeLine(`        <div className="${testimonialsCardClass}">`);
      writer.writeLine(`          <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">"{${JSON.stringify(item.description)}}"</p>`);
      writer.writeLine(`          <div className="flex items-center gap-3">`);
      if (item.image) writer.writeLine(`            <img src="${item.image}" className="w-10 h-10 rounded-full border border-white/20" alt="" />`);
      writer.writeLine(`            <div>`);
      writer.writeLine(`              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{${JSON.stringify(item.author)}}</p>`);
      writer.writeLine(`              <p className="text-xs text-slate-500 dark:text-slate-400">{${JSON.stringify(item.role)}}</p>`);
      writer.writeLine(`            </div>`);
      writer.writeLine(`          </div>`);
      writer.writeLine(`        </div>`);
    }
    writer.writeLine(`      </div>`);
    writer.writeLine(`    </div>`);
  } else if (m.kind === "faq") {
    const faqVisual = marketingVisual.faq ?? {};
    const faqContainerClass = faqVisual.containerClass || "max-w-3xl mx-auto py-[var(--irgen-space-xl)]";
    const faqTitleClass = faqVisual.titleClass || "text-3xl font-bold text-center mb-[var(--irgen-space-lg)] dark:text-white";
    const faqItemClass = faqVisual.itemClass || `border border-slate-100 dark:border-slate-800 ${radius} bg-white dark:bg-slate-900 px-6 py-4 group transition-colors`;
    writer.writeLine(`    <div className="${faqContainerClass}">`);
    if (m.title) writer.writeLine(`      <h2 className="${faqTitleClass}">{${JSON.stringify(m.title)}}</h2>`);
    writer.writeLine(`      <div className="space-y-[var(--irgen-space-sm)]">`);
    for (const item of (m.items || [])) {
      writer.writeLine(`        <details className="${faqItemClass}">`);
      writer.writeLine(`          <summary className="flex items-center justify-between font-semibold cursor-pointer list-none dark:text-slate-200">`);
      writer.writeLine(`            {${JSON.stringify(item.title)}}`);
      writer.writeLine(`            <Icons.ChevronDown size={20} className="group-open:rotate-180 transition-transform text-slate-400 dark:text-slate-500" />`);
      writer.writeLine(`          </summary>`);
      writer.writeLine(`          <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{${JSON.stringify(item.description)}}</p>`);
      writer.writeLine(`        </details>`);
    }
    writer.writeLine(`      </div>`);
    writer.writeLine(`    </div>`);
  } else if (m.kind === "cta") {
    const ctaVisual = marketingVisual.cta ?? {};
    const ctaContainerClass = ctaVisual.containerClass || `my-[var(--irgen-space-xl)] p-[var(--irgen-space-xl)] md:p-[calc(var(--irgen-space-xl)*1.5)] ${radius} bg-slate-900 text-center space-y-[var(--irgen-space-md)]`;
    const ctaTitleClass = ctaVisual.titleClass || "text-3xl md:text-5xl font-black text-white";
    const ctaSubtitleClass = ctaVisual.subtitleClass || "text-lg text-slate-400 max-w-2xl mx-auto";
    writer.writeLine(`    <div className="${ctaContainerClass}">`);
    writer.writeLine(`      <h2 className="${ctaTitleClass}">{${JSON.stringify(m.title)}}</h2>`);
    if (m.subtitle) writer.writeLine(`      <p className="${ctaSubtitleClass}">{${JSON.stringify(m.subtitle)}}</p>`);
    if (m.actions && m.actions.length > 0) {
      writer.writeLine(`      <div className="flex justify-center gap-4 pt-4">`);
      m.actions.forEach((a, idx) => {
        const handler = actionHandlers?.[idx];
        const href = resolveHref(a.href);
        if (handler) {
          writer.writeLine(`        <button type="button" onClick={${handler}} className="inline-flex items-center gap-2 px-8 py-3.5 font-bold ${radius} bg-[${primaryColor}] text-white hover:scale-105 active:scale-95 shadow-xl shadow-[${primaryColor}]/20 transition-all">`);
        } else {
          writer.writeLine(`        <a href="${href}" className="inline-flex items-center gap-2 px-8 py-3.5 font-bold ${radius} bg-[${primaryColor}] text-white hover:scale-105 active:scale-95 shadow-xl shadow-[${primaryColor}]/20 transition-all">`);
        }
        if (a.icon) writer.writeLine(`          {React.createElement((Icons as any)["${a.icon}"], { size: 20 })}`);
        writer.writeLine(`          {${JSON.stringify(a.label)}}`);
        writer.writeLine(handler ? `        </button>` : `        </a>`);
      });
      writer.writeLine(`      </div>`);
    }
    writer.writeLine(`    </div>`);
  } else if (m.kind === "stats") {
    const statsVisual = marketingVisual.stats ?? {};
    const statsContainerClass = statsVisual.containerClass || "grid grid-cols-2 lg:grid-cols-4 gap-[var(--irgen-space-lg)] py-[var(--irgen-space-xl)] border-y border-slate-100 dark:border-slate-800";
    const statsValueClass = statsVisual.valueClass || `text-5xl font-black text-slate-900 dark:text-white group-hover:text-[${primaryColor}] transition-colors`;
    const statsLabelClass = statsVisual.labelClass || "text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]";
    writer.writeLine(`    <div className="${statsContainerClass}">`);
    for (const item of (m.items || [])) {
      writer.writeLine(`      <div className="text-center space-y-1 group">`);
      writer.writeLine(`        <p className="${statsValueClass}">{${JSON.stringify(item.value)}}</p>`);
      writer.writeLine(`        <p className="${statsLabelClass}">{${JSON.stringify(item.label)}}</p>`);
      writer.writeLine(`      </div>`);
    }
    writer.writeLine(`    </div>`);
  } else if (m.kind === "timeline") {
    const timelineVisual = marketingVisual.timeline ?? {};
    const timelineContainerClass = timelineVisual.containerClass || "py-[var(--irgen-space-xl)] px-[var(--irgen-space-sm)]";
    const timelineTitleClass = timelineVisual.titleClass || "text-3xl font-bold text-center mb-[var(--irgen-space-xl)] dark:text-white";
    const timelineTrackClass = timelineVisual.trackClass || "relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 md:ml-0 md:border-l-0 md:flex md:justify-between md:gap-4 md:before:absolute md:before:top-6 md:before:left-0 md:before:w-full md:before:h-0.5 md:before:bg-slate-100 dark:md:before:bg-slate-800";
    writer.writeLine(`    <div className="${timelineContainerClass}">`);
    if (m.title) writer.writeLine(`      <h2 className="${timelineTitleClass}">{${JSON.stringify(m.title)}}</h2>`);
    writer.writeLine(`      <div className="${timelineTrackClass}">`);
    for (const item of (m.items || [])) {
      writer.writeLine(`        <div className="relative pl-8 pb-10 md:pl-0 md:pt-12 md:pb-0 md:flex-1 text-left md:text-center">`);
      writer.writeLine(`          <div className="absolute top-0 left-[-9px] md:left-1/2 md:-translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-4 border-[${primaryColor}] z-10 transition-transform hover:scale-125"></div>`);
      writer.writeLine(`          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">{${JSON.stringify(item.title)}}</h3>`);
      writer.writeLine(`          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{${JSON.stringify(item.description)}}</p>`);
      writer.writeLine(`        </div>`);
    }
    writer.writeLine(`      </div>`);
    writer.writeLine(`    </div>`);
  }
}
