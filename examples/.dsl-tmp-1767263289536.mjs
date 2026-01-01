import { frontend } from "../src/ir/decl/frontend.js";
export const logicDemo = frontend("LogicDemo", (app) => {
    app.page("LogicPage", "/logic", (p) => {
        p.component("LogicForm", (c) => {
            c.form((f) => {
                f.field("a", "number", { label: "Value A" });
                f.field("b", "number", { label: "Value B" });
                f.field("sum", "number", {
                    label: "Sum (A + B)",
                    computeValue: '{" + ": [{"var":"a"}, {"var":"b"}]}',
                    description: "Calculated automatically when A or B changes"
                });
                f.field("showExtra", "checkbox", { label: "Show Extra Field?" });
                f.field("extra", "text", {
                    label: "Extra Info",
                    visibleIf: '{"var": "showExtra"}',
                    disabledIf: '{" == ": [{"var": "a"}, 10]}',
                    description: "Visible if 'Show Extra' is checked, disabled if A is 10"
                });
            });
        });
    });
});
export default [logicDemo];
