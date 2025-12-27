import { app } from "../src/dsl/runtime.js";

app("DemoApp", (a) => {
  a.meta("owner", "Bli Agus");
  // enable frontend generation and opt into Tailwind
  a.meta("frontend", { react: true, tailwind: true });

  a.entity("Product", (e) => {
    e.model({ id: "string", name: "string", price: "number" });
    e.create();
    e.get();
    e.update();
    e.remove();
    e.list("listAll");
  });

  a.entity("Category", (e) => {
    e.model({ id: "string", name: "string" });
    e.create();
    e.get();
    e.update();
    e.remove();
    e.list();
  });
});
