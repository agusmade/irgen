import type { DocSection } from "./types.js";

export const outputStructureSection: DocSection = {
  id: "output-structure",
  title: "Output Structure",
  subtitle: "What gets generated and where.",
  description: "Output layout for each target and how to run the result.",
  content: [
    "Each target emits a self-contained output. Backend and frontend are decoupled,",
    "static-site emits ready-to-serve HTML, and Electron emits a shell project.",
  ].join(" "),
  subsections: [
    {
      title: "Backend",
      content: [
        "Outputs to a backend folder with controllers, services, and adapters. Run it",
        "with your preferred Node runtime after installing dependencies.",
      ].join(" "),
    },
    {
      title: "Frontend",
      content: [
        "Outputs a Vite-ready app under the target outDir. Install dependencies inside",
        "the generated frontend folder and run `npm run dev`.",
      ].join(" "),
    },
    {
      title: "Static Site",
      content: [
        "Outputs HTML/CSS (and optional JS enhancements) directly under outDir.",
        "Pages are folder-style routes (`/docs/x/index.html`).",
      ].join(" "),
    },
    {
      title: "Electron",
      content: [
        "Outputs main/preload/renderer scaffolding plus packaging config. Use the",
        "generated package.json for build and distribution.",
      ].join(" "),
    },
  ],
};
