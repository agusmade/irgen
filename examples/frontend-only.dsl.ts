import { frontend } from "../src/dsl/frontend-runtime";

// Note: Ensure this is run with --mode=frontend
frontend("FrontendApp", (a) => {
    // No DB meta needed

    a.component("Dashboard", (c) => {
        c.prop("title", "string");
        c.prop("isAdmin", "boolean");
    });

    a.component("UserProfile", (c) => {
        c.prop("username", "string");
        c.prop("avatarUrl", "string");
    });

    a.component("SettingsForm", (c) => {
        c.prop("initialValues", "object");
    });
});
