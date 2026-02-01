import { app } from "../src/dsl/runtime";

app(
  "BackendAppPolicy",
  {
    policies: {
      backend: {
        interfaces: {
          rest: {
            enabled: true,
            basePath: "/api",
            openapi: { enabled: true, title: "API", version: "1.0.0" },
            publicRoutes: [],
          },
        },
        envelope: {
          type: "standard_v1",
          keys: { data: "data", meta: "meta", error: "error" },
          meta: { requestIdKey: "requestId" },
          errorShape: { codeKey: "code", messageKey: "message", detailsKey: "details" },
        },
        pagination: {
          type: "page_limit",
          defaults: { page: 1, limit: 20, maxLimit: 100 },
          meta: { pageKey: "page", limitKey: "limit", totalKey: "total", hasNextKey: "hasNext" },
        },
        auth: {
          jwt: {
            enabled: true,
            algorithm: "HS256",
            secret: "CHANGE_ME_SUPER_SECRET_MIN_16_CHARS",
            issuer: "example-api",
            audience: "example-clients",
            clockToleranceSec: 30,
            claims: { subjectKey: "sub", rolesKey: "roles" },
          },
        },
        core: {
          formatter: "prettier",
          loggerImpl: "console",
          httpClient: "fetch",
          generateId: "uuid_v4",
        },
        health: {
          enabled: true,
          endpoint: "/health",
          metrics: { enabled: true, endpoint: "/metrics" },
        },
      },
    },
  },
  (a) => {
    a.meta("description", "Backend example with inline policies");

    a.entity("User", (e) => {
      e.model({
        email: "string",
        name: "string",
        isActive: "boolean",
      });
      e.create("register");
      e.get("profile");
      e.update("updateProfile");
      e.list("listUsers");
    });

    a.entity("Post", (e) => {
      e.model({
        title: "string",
        content: "string",
        published: "boolean",
        viewCount: "number",
        authorId: "string",
      });
      e.create("createPost");
      e.get("getPost");
      e.list("listPosts");
      e.update("updatePost");
      e.remove("deletePost");
    });

    a.entity("Comment", (e) => {
      e.model({
        text: "string",
        postId: "string",
        userId: "string",
      });
      e.create("addComment");
      e.list("getComments");
    });
  }
);
