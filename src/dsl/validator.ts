
import { DeclBundle } from "../ir/decl/index.js";
import { validatorRegistry } from "./validator-registry.js";

export interface ValidationMessage {
    type: "error" | "warning";
    message: string;
    location?: string; // e.g., "App/Page:Home/Component:List"
}

export function validateSemantics(bundle: DeclBundle): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    const entities = new Set<string>();
    const components = new Set<string>();

    // DEBUG
    // console.log("Validating bundle:", JSON.stringify(bundle, null, 2));

    // 1. Collect Definitions (Deduplicated for reference checking)
    for (const app of bundle.apps) {
        const a = app as any;
        // Entities
        if (a.entities) {
            for (const entity of a.entities) {
                if (entities.has(entity.name)) {
                    messages.push({ type: "error", message: `Duplicate Entity name: "${entity.name}"` });
                }
                entities.add(entity.name);
            }
        }

        // Shared Components
        if (a.components) {
            for (const comp of a.components) {
                components.add(comp.name);
            }
        }
    }

    // 2. Perform stricter checks for true duplicates (e.g. Page paths)
    for (const app of bundle.apps) {
        const a = app as any;
        if (a.pages) {
            const pathsInApp = new Set<string>();
            for (const page of a.pages) {
                if (pathsInApp.has(page.path)) {
                    messages.push({ type: "warning", message: `Duplicate Page path in app "${a.name}": "${page.path}"` });
                }
                pathsInApp.add(page.path);
            }
        }
    }

    // 3. Validate References
    for (const app of bundle.apps) {
        const a = app as any;
        // Check Shared Components references
        if (a.components) {
            for (const comp of a.components) {
                // Check entityRef
                if (comp.entityRef && !entities.has(comp.entityRef)) {
                    messages.push({
                        type: "error",
                        message: `Component "${comp.name}" references unknown Entity "${comp.entityRef}"`
                    });
                }
            }
        }

        // Check Pages
        if (a.pages) {
            for (const page of a.pages) {
                if (page.components) {
                    for (const compCall of page.components) {
                        if (!components.has(compCall.name)) {
                            messages.push({
                                type: "error",
                                message: `Page "${page.name}" references unknown Component "${compCall.name}"`
                            });
                        }
                    }
                }
            }
        }
    }

    // 4. Extension Validators (New in v0.3.1)
    const extValidators = validatorRegistry.getValidators();
    for (const v of extValidators) {
        try {
            const extMessages = v(bundle);
            messages.push(...extMessages);
        } catch (err: any) {
            messages.push({
                type: "warning",
                message: `Extension validator failed: ${err.message}`
            });
        }
    }

    return messages;
}
