
import { frontend } from "../src/dsl/frontend-runtime";

const app = frontend("FormIOApp", (app) => {
    app.page("UserPage", { path: "/users" }, (page) => {
        page.component("UserForm", (c) => {
            // Standard Input
            c.field("fullName", "text", "Full Name", { required: true });

            // Input with Icon & Placeholder
            c.field("email", "text", "Email Address", { required: true }, {
                icon: "Mail",
                placeholder: "user@example.com",
                description: "We'll never share your email."
            });

            // Static Select
            c.field("role", "select", "User Role", { required: true }, {
                options: [
                    { label: "Admin", value: "admin" },
                    { label: "User", value: "user" },
                    { label: "Guest", value: "guest" }
                ]
            });

            // Async Select
            c.field("department", "select", "Department", {}, {
                dataSource: {
                    url: "https://api.example.com/departments",
                    labelKey: "name",
                    valueKey: "id"
                },
                placeholder: "Select Department..."
            });

            // Number with Icon & Validation
            c.field("age", "number", "Age", { min: 18 }, {
                icon: "Hash"
            });
        });
    });
});
