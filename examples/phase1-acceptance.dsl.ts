import { frontend } from "../src/dsl/frontend-runtime.js";

// Multi-app scenario
// App 1: The "Public" site
frontend("public-site", {
    basePath: "/",
    policies: {
        frontend: {
            styling: { theme: { primaryColor: "#3b82f6" } }
        }
    }
}, (app) => {
    app.page("Home", { path: "/" }, (p) => {
        p.component("Welcome", (c) => {
            c.hero({ title: "Public Portal", subtitle: "Welcome to our public infrastructure." });
        });
        p.component("PublicStats", (c) => {
            c.stats([{ label: "Users", value: "10k+" }, { label: "Uptime", value: "99.9%" }]);
        });
    });
});

// App 2: The "Admin" dashboard (Operation-Oriented)
frontend("admin-portal", {
    basePath: "/admin",
    datasources: [
        { id: "shared-api", baseUrl: "https://api.shared.com" }
    ],
    policies: {
        frontend: {
            styling: { theme: { primaryColor: "#ef4444" } }
        }
    }
}, (app) => {

    // 1. DataSources
    app.datasource("main-api", {
        baseUrl: "https://api.example.com",
        authStrategyId: "bearer-token",
        envelopeAdapterId: "ok_data_meta"
    });

    // 2. Operations (Action-as-Atom)
    app.operation("publish-post", {
        datasourceId: "main-api",
        method: "POST",
        path: "/posts/:id/publish",
        response: { type: "json" },
        resultHandling: {
            toastOnSuccess: { kind: "success", message: "Post published!" }
        }
    });

    app.operation("get-inventory", {
        datasourceId: "main-api",
        method: "GET",
        path: "/inventory",
        response: {
            type: "json",
            envelopeAdapterId: "items_cursor",
            paginationAdapterId: "cursor_root"
        }
    });

    // 3. Resources
    app.resource("members", {
        datasourceId: "main-api",
        listOpId: "list-members",
        createOpId: "create-member"
    });

    // 4. UI Bindings
    app.page("Dashboard", { path: "/" }, (p) => {
        p.component("InventoryTable", (c) => {
            c.table({
                operationId: "get-inventory",
                columns: [
                    { header: "SKU", accessor: "sku" },
                    { header: "Quantity", accessor: "qty" },
                    { header: "Status", accessor: "status" }
                ]
            });
        });

        p.component("QuickActions", (c) => {
            c.layout = { kind: "row", items: ["PublishAction"] };
        });
    });

    app.component("PublishAction", (c) => {
        c.button = { label: "Publish Latest", variant: "primary", icon: "Send" };
        // In the future, we'll have a first-class "Action" binding here
        c.prop("actionOp", "publish-post");
    });
});
