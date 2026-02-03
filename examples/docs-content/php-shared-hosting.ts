import type { DocSection } from "./types.js";

export const phpSharedHostingSection: DocSection = {
    id: "php-shared-hosting",
    title: "PHP Shared Hosting",
    subtitle: "The Hybrid App Platform.",
    description: "Deploy internal business logic and blogs to standard shared hosting environments.",
    content: [
        {
            type: "paragraph",
            text: [
                "The `php-shared-hosting` extension transforms your irgen definitions into a fully-functional PHP backend.",
                "It supports MySQL/PDO-based REST APIs, dynamic routing via `.htaccess`, and simultaneous hosting of multiple React SPAs.",
            ].join(" "),
        },
        {
            type: "section",
            title: "Hybrid App Architecture",
            blocks: [
                {
                    type: "paragraph",
                    text: [
                        "A 'Hybrid App' on irgen combines a high-performance public blog with custom internal business tools.",
                        "You can use the **Multi-DSL (Split DSL)** pattern to separate your backend logic from your UI definitions.",
                    ].join(" "),
                },
                {
                    type: "code",
                    language: "typescript",
                    snippet: [
                        "// 1. backend.dsl.ts (Logic & Data)",
                        "import { app } from \"irgen\";",
                        "app(\"MyBackend\", (t) => {",
                        "  t.meta(\"php-shared-hosting\", { /* ... */ });",
                        "  t.entity(\"Ticket\", (e) => { e.model({ status: \"string\" }); e.list(); });",
                        "});",
                        "",
                        "// 2. ui.dsl.ts (Interface)",
                        "import { frontend } from \"irgen\";",
                        "import { adminPreset, appPreset } from \"irgen-ext-php-shared-hosting\";",
                        "frontend(\"admin\", (f) => adminPreset()(f));",
                        "frontend(\"app\", (f) => appPreset()(f));",
                    ].join("\n"),
                },
            ],
        },
        {
            type: "section",
            title: "Presets",
            blocks: [
                {
                    type: "paragraph",
                    text: [
                        "The extension provides powerful presets to jumpstart your development.",
                        "- **`adminPreset`**: Generates a professional Post-Management and User-Management dashboard.",
                        "- **`appPreset`**: Configures a React app to automatically bind to the generated PHP REST API.",
                    ].join(" "),
                },
            ],
        },
        {
            type: "section",
            title: "Multi-SPA Routing",
            blocks: [
                {
                    type: "paragraph",
                    text: [
                        "The generated `.htaccess` automatically handles routing for all registered frontend applications.",
                        "For example, visits to `/admin` go to the Admin UI, `/app` go to the User App, and all other paths serve the public blog.",
                    ].join(" "),
                },
            ],
        },
        {
            type: "section",
            title: "CLI Usage",
            blocks: [
                {
                    type: "code",
                    language: "bash",
                    snippet: "irgen backend.dsl.ts ui.dsl.ts --ext=irgen-ext-php-shared-hosting --targets=frontend,php-shared-hosting",
                },
            ],
        },
    ],
};
