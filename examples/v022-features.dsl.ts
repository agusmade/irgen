import { frontend } from "../src/dsl/frontend-runtime.js";

frontend("V022Features", (f) => {
  f.requiredComponents(["LegacyShell", "AnalyticsBridge"]);

  f.datasource("api", {
    baseUrl: "https://example.com",
  });

  f.operation("ping", {
    datasourceId: "api",
    method: "GET",
    path: "/ping",
    response: { type: "json" },
    resultHandling: {
      toastOnSuccess: { kind: "success", message: "Ping OK" },
      redirectTo: "/docs",
      openUrl: "https://example.com/docs",
      downloadAs: { filename: "ping.json" },
    },
  });

  f.page("Home", { path: "/" }, (p) => {
    p.component("ActionCard");
    p.component("MacroSurface");
    p.component("HeroCta");
  });

  f.component("ActionCard", (c) => {
    c.content = "Trigger a runtime action and verify signals.";
    c.button = {
      label: "Run Ping",
      variant: "primary",
      onClick: {
        kind: "invoke",
        operationId: "ping",
        args: { source: "action-card" },
      },
    };
  });

  f.component("MacroSurface", (c) => {
    c.useMacro("PricingTable", {
      tier: "Pro",
      accent: "emerald",
      badge: "New",
    });
  });

  f.component("HeroCta", (c) => {
    c.hero({
      title: "Universal Action Model",
      subtitle: "Actions can invoke operations, navigate, and emit runtime signals.",
      actions: [
        {
          label: "Open Docs",
          onClick: { kind: "navigate", to: "/docs" },
          variant: "primary",
          icon: "ArrowRight",
        },
      ],
    });
  });
});
