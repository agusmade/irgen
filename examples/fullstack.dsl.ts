import { app } from "../src/dsl/runtime";

app("FullstackApp", (a) => {
    a.meta("description", "A complete fullstack application");

    // Backend Config
    a.meta("db", { provider: "prisma", url: "file:./fullstack.db" });

    // Frontend Config
    a.meta("frontend", { react: true, tailwind: true });

    // Product Entity (Generates Backend Service + Frontend API Client if supported)
    a.entity("Product", (e) => {
        e.model({
            name: "string",
            price: "number",
            category: "string",
            inStock: "boolean",
        });
        e.create("create");
        e.get("get");
        e.list("list");
        e.update("update");
        e.remove("delete");
    });

    // Order Entity
    a.entity("Order", (e) => {
        e.model({
            userId: "string",
            total: "number",
            status: "string",
        });
        e.create("placeOrder");
        e.get("getOrder");
        e.list("listOrders");
    });
});
