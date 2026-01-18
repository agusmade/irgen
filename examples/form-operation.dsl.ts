import { frontend, datasource, operation } from "../src/dsl/frontend-runtime.js";

frontend("FormOperationDemo", (app) => {
  datasource("api", { baseUrl: "https://api.example.com", envelopeAdapterId: "ok_data_meta" });

  operation("signup", {
    datasourceId: "api",
    method: "POST",
    path: "/signup",
    response: { type: "json" },
    resultHandling: {
      toastOnSuccess: { kind: "success", message: "Signup completed." },
    },
  });

  app.page("Home", { path: "/" }, (p) => {
    p.component("SignupForm");
  });

  app.component("SignupForm", (c) => {
    c.form = {
      fields: [
        { name: "name", type: "text", label: "Full Name" },
        { name: "email", type: "email", label: "Email" },
      ],
      submit: {
        operationId: "signup",
        successMessage: "Signed up!",
      },
    };
  });
});
