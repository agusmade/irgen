import type { DeclComponent } from "../../../ir/decl/frontend.raw.schema.js";

export type MacroExpander = (props: any, original: DeclComponent) => DeclComponent[];

const registry = new Map<string, MacroExpander>();

export function registerMacro(name: string, expander: MacroExpander) {
    if (registry.has(name)) {
        throw new Error(`Macro already registered: ${name}`);
    }
    registry.set(name, expander);
}

export function getMacro(name: string): MacroExpander | undefined {
    return registry.get(name);
}

export function listMacros(): string[] {
    return Array.from(registry.keys());
}
