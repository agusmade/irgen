import type { DeclComponent } from "../../../ir/decl/frontend.raw.schema.js";
import type { MacroExpander } from "./registry";

export const expandTablePage: MacroExpander = (props: any, original: DeclComponent): DeclComponent[] => {
    const result: DeclComponent[] = [];
    const baseName = original.name;

    // Simplified V0 Implementation:
    // Since we don't want to over-engineer the generated components tree blindly,
    // let's look at what `admin-preset.ts` expects.
    // It expects `TablePage` to render a full page with title, actions, filters, table.

    // We will generate:
    // 1. Main Container (Layout: column) -> [Header, Table]
    // 2. Header (Layout: row, items: [TitleComp, TopActionsComp...])
    // 3. Table (Table primitive)

    const children: string[] = [];

    // -- Header --
    if (props.title || (props.topActions && props.topActions.length > 0)) {
        const headerName = `${baseName}_Header`;
        children.push(headerName);

        const headerItems: string[] = [];

        // Title
        if (props.title) {
            const titleName = `${baseName}_Title`;
            headerItems.push(titleName);
            result.push({
                type: "component",
                name: titleName,
                props: {
                    uiVariant: "header"
                },
                content: `<h1 class="text-2xl font-bold tracking-tight">${props.title}</h1>`
            });
        }

        // Top Actions
        if (props.topActions) {
            props.topActions.forEach((action: any, idx: number) => {
                const actionName = `${baseName}_Action_${idx}`;
                headerItems.push(actionName);
                result.push({
                    type: "component",
                    name: actionName,
                    props: {
                        uiVariant: "header"
                    },
                    button: {
                        label: action.label,
                        variant: "primary", // Default to primary for top actions
                        onClick: action.onClick, // Pass through ActionSpec
                        // We might need to handle 'action: dialog' (nested form)
                        // For now, only simple onClick is supported by schema directly.
                        // AdminPreset uses complex objects (dialog: {...}). 
                        // This requires 'universal actions' support in schema (which isn't fully there yet for 'dialog').
                        // We'll rely on the existing schema support.
                    }
                });

                // TODO: Handle nested dialogs from action.dialog
            });
        }

        result.push({
            type: "component",
            name: headerName,
            props: {
                layoutVariant: "header"
            },
            layout: {
                kind: "row",
                items: headerItems,
                // Alignment? Schema doesn't specify.
            }
        });
    }

    // -- Filters (Skipped for V0 minimal patch) --

    // -- Table --
    const tableName = `${baseName}_Table`;
    children.push(tableName);

    const mappedColumns = (props.columns ?? []).map((col: any) => ({
        header: col.header ?? col.label ?? col.key ?? col.accessor ?? "Column",
        accessor: col.accessor ?? col.key ?? col.field ?? col.header ?? "value",
        render: col.render,
    }));

    result.push({
        type: "component",
        name: tableName,
        table: {
            operationId: props.queryOperationId,
            columns: mappedColumns,
            rowNavigateTo: props.rowNavigateTo,
            rowActions: props.rowActions,
            // rowActions, rowKey, etc are not yet in DeclTableSchema?
            // Schema says: columns: { header, accessor, render }
            // We need to map props.columns to schema columns.
        }
    });

    // Main Container (Replacing the original macro component)
    result.push({
        type: "component",
        name: baseName, // Reuse the original name so references work
        layout: {
            kind: "column",
            items: children
        }
    });

    return result;
};
