import { frontend } from "../src/dsl/frontend-runtime.js";
frontend("DemoFrontend", (f) => {
    // Home page: header + list
    f.page("Home", { path: "/" }, (p) => {
        p.component("Header");
        p.component("ProductList");
    });
    // Product detail page
    f.page("Product", { path: "/product/:id" }, (p) => {
        p.component("ProductDetail");
        p.component("ProductCard");
    });
    // Admin page: a form for creating/editing products (Form.io-like)
    f.page("Admin", { path: "/admin" }, (p) => {
        p.component("ProductForm");
    });
    // Shared components
    f.component("Header", (c) => { });
    f.component("ProductList", (c) => { c.entityRef = "Product"; });
    f.component("ProductCard", (c) => { });
    // form component: structured fields (Form.io-like)
    f.component("ProductForm", (c) => { c.field("id", "string", "ID", { required: true }); c.field("name", "string", "Name", { required: true }); c.field("price", "number", "Price", { required: true, min: 0 }); c.entityRef = "Product"; });
    f.component("ProductDetail", (c) => { c.entityRef = "Product"; });
});
