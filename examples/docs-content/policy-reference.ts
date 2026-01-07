import type { DocSection } from "./types.js";

export const policyReferenceSection: DocSection = {
  id: "policy-reference",
  title: "Policy Reference",
  subtitle: "Quick knobs per target.",
  description: "A condensed map of policy blocks. See Policies for rationale.",
  content: [
    "Policies are grouped by target. This page lists the most common keys so you",
    "can locate the right block quickly.",
  ].join(" "),
  subsections: [
    {
      title: "Backend",
      content: [
        "backend.core (generateId/loggerImpl/httpClient/formatter), backend.auth,",
        "backend.interfaces, backend.pagination, backend.envelope.",
      ].join(" "),
    },
    {
      title: "Frontend",
      content: [
        "frontend.framework (rendering.mode, prerender), frontend.styling, frontend.pwa.",
      ].join(" "),
    },
    {
      title: "Static Site",
      content: [
        "staticSite.enhancements, staticSite.search, staticSite.codeHighlight,",
        "staticSite.assets, staticSite.seo, staticSite.theme, staticSite.navbar.",
      ].join(" "),
    },
    {
      title: "Electron",
      content: [
        "electron.security, electron.loading, electron.packaging, electron.autoUpdate,",
        "electron.reliability.",
      ].join(" "),
    },
    {
      title: "CLI",
      content: "cli has an empty policy schema today (no special knobs).",
    },
  ],
};
