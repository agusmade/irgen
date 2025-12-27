
import { frontend } from "../src/dsl/frontend-runtime";

frontend("DebugApp", (app) => {
    console.log("Inside frontend callback");
    app.page("P1", { path: "/" }, (p) => {
        console.log("Inside page callback");
        p.component("C1", (c) => {
            console.log("Inside component callback");
            c.field("test", "text");
        });
    });
});
