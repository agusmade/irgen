import { registerMacro } from "./registry.js";
import { expandTablePage } from "./tablePage.js";
import { expandAuthPage, expandEditorPage } from "./pages.js";
import { expandPricingTable } from "./pricing.js";

let initialized = false;
export function initMacros() {
    if (initialized) return;
    registerMacro("TablePage", expandTablePage);
    registerMacro("AuthPage", expandAuthPage);
    registerMacro("EditorPage", expandEditorPage);
    registerMacro("PricingTable", expandPricingTable);
    initialized = true;
}

export { getMacro } from "./registry.js";
