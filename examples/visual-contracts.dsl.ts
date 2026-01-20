import { frontend } from "../src/dsl/frontend-runtime.js";

frontend("VisualTest", {
    policies: {
        frontend: {
            visual: {
                navLayout: "sidebar",
                contentWidth: "narrow",
                density: "spacious",
                topbarControls: {
                    enabled: true,
                    items: ["search", "avatar"],
                    avatar: { src: "https://example.com/me.png" }
                },
                brand: {
                    logoText: "CustomLogo",
                    logoIcon: "Zap"
                },
                footer: {
                    enabled: true,
                    text: "Custom Footer Text"
                },
                form: {
                    inputClass: "custom-input-class",
                    buttonClass: "custom-button-class"
                },
                table: {
                    rowClass: "custom-row-class"
                },
                copy: {
                    navSection: "Custom Nav Section",
                    footerDefault: "Custom Footer Default"
                },
                icons: {
                    search: "SearchIcon"
                },
                breakpoints: {
                    sidebarWidth: "w-80",
                    topbarHeightAdmin: "h-20"
                }
            }
        }
    }
}, (f) => {
    f.page("Home", { path: "/" }, (p) => {
        p.component("MainForm");
        p.component("MainTable");
    });

    f.component("MainForm", (c) => {
        c.form = {
            fields: [{ name: "email", type: "email", label: "Email" }]
        };
    });

    f.component("MainTable", (c) => {
        c.table({ resourceId: "users" });
    });
});
