import type { DeclComponent } from "../../../ir/decl/frontend.raw.schema.js";
import type { MacroExpander } from "./registry";

export const expandPricingTable: MacroExpander = (props: any, original: DeclComponent): DeclComponent[] => {
    const { tier, accent, badge } = props;
    // Use a card-like layout for pricing
    return [{
        type: "component",
        name: original.name,
        layout: {
            kind: "column",
            items: [`${original.name}_Card`]
        }
    }, {
        type: "component",
        name: `${original.name}_Card`,
        content: `
<div class="p-6 rounded-2xl border border-${accent}-200 bg-${accent}-50">
  <h3 class="text-xl font-bold text-${accent}-900">${tier}</h3>
  ${badge ? `<span class="inline-block px-2 py-1 text-xs font-semibold text-${accent}-700 bg-${accent}-100 rounded-full">${badge}</span>` : ''}
  <p class="mt-4 text-${accent}-600">Great for growing businesses.</p>
</div>
`
    }];
};
