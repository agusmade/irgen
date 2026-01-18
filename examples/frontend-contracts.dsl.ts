import { frontend } from "../src/dsl/frontend-runtime.js";

frontend("FrontendContracts", {
  basePath: "/admin",
  auth: {
    enabled: true,
    loginPath: "/login",
    meOperationId: "auth.me",
    logoutOperationId: "auth.logout",
    hideLoginWhenAuthed: true,
  },
}, (f) => {
  f.datasource("api", { baseUrl: "https://api.example.com" });

  f.operation("auth.me", {
    datasourceId: "api",
    method: "GET",
    path: "/auth/me",
    response: { type: "json" },
  });

  f.operation("auth.logout", {
    datasourceId: "api",
    method: "POST",
    path: "/auth/logout",
    response: { type: "json" },
  });

  f.operation("posts.list", {
    datasourceId: "api",
    method: "GET",
    path: "/posts",
    response: { type: "json" },
  });

  f.operation("posts.delete", {
    datasourceId: "api",
    method: "DELETE",
    path: "/posts/:slug",
    response: { type: "json" },
  });

  f.page("Login", { path: "/login" }, (p) => {
    p.component("LoginPanel", (c) => {
      c.content = "Login";
    });
  });

  f.page("Posts", { path: "/posts" }, (p) => {
    p.component("PostsTable", (c) => {
      c.table({
        operationId: "posts.list",
        columns: [
          { header: "Slug", accessor: "slug" },
          { header: "Title", accessor: "title" },
        ],
        rowNavigateTo: "/posts/:slug",
        rowActions: [
          {
            label: "Edit",
            onClick: { kind: "navigate", to: "/posts/:slug/edit" },
          },
          {
            label: "Delete",
            onClick: {
              kind: "invoke",
              operationId: "posts.delete",
              args: { slug: "item.slug" },
              confirmMessage: "Delete this post?",
            },
          },
        ],
      });
    });
  });
});
