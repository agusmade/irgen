import type { DeclComponent } from "../../../ir/decl/frontend.raw.schema.js";
import type { MacroExpander } from "./registry";

export const expandAuthPage: MacroExpander = (props: any, original: DeclComponent): DeclComponent[] => {
    // AuthPage -> Just a simple Form component for now
    // In a real implementation, this might be a Card layout centered on screen.

    return [{
        type: "component",
        name: original.name,
        form: {
            submit: {
                operationId: props.loginOperationId,
                redirect: props.redirectOnSuccess
            },
            fields: [
                {
                    name: "username",
                    type: "text",
                    label: "Username",
                    validators: { required: true }
                },
                {
                    name: "password",
                    type: "password",
                    label: "Password",
                    validators: { required: true }
                }
            ]
        }
    }];
};

export const expandEditorPage: MacroExpander = (props: any, original: DeclComponent): DeclComponent[] => {
    const result: DeclComponent[] = [];
    const baseName = original.name;
    const children: string[] = [];

    // 1. Header (Title + Actions)
    if (props.title || (props.actions && props.actions.length > 0)) {
        const headerName = `${baseName}_Header`;
        children.push(headerName);
        const headerItems: string[] = [];

        if (props.title) {
            const titleName = `${baseName}_Title`;
            headerItems.push(titleName);
            result.push({
                type: "component",
                name: titleName,
                content: `<h1 class="text-2xl font-bold">${props.title}</h1>`
            });
        }

        if (props.actions) {
            props.actions.forEach((action: any, idx: number) => {
                const actionName = `${baseName}_Action_${idx}`;
                headerItems.push(actionName);

                // Handle different action types
                let onClick = action.onClick;
                if (action.type === 'submit') {
                    // Submit is special, it needs to trigger the form.
                    // But here buttons are outside the form.
                    // For v0, we might need to put buttons INSIDE the form if we can't link them easily.
                    // Or we assume the "saveOperationId" on the form handles it, and we just use the form's implicit submit button?
                    // Let's make this a "ghost" button that invokes the submit operation manually?
                    // No, simpler: Just render the button. The Form component usually has its own submit button.
                    // But EditorPage wants custom top-right actions.

                    // Workaround: We map the "Save" action to the Form's submit button configuration directly?
                    // Or we assume the Form has a submit button.
                    onClick = { kind: "invoke", operationId: props.saveOperationId }; // weak approximation
                }

                result.push({
                    type: "component",
                    name: actionName,
                    button: {
                        label: action.label,
                        variant: action.variant || "primary",
                        onClick: onClick
                    }
                });
            });
        }

        result.push({
            type: "component",
            name: headerName,
            layout: { kind: "row", items: headerItems }
        });
    }

    // 2. Editor Form
    const formName = `${baseName}_Form`;
    children.push(formName);

    // Construct fields based on editorField
    const fields = [];
    if (props.editorField) {
        fields.push({
            name: props.editorField.key,
            type: props.editorField.valueType || 'text', // 'textarea' usually for markdown
            label: '', // Hidden label for full-page editor
            // We might want to use a specific component for MarkdownEditor (custom field type?)
            // Schema has 'text', 'textarea'. CodeBlock is for viewing.
            // We'll stick to 'textarea' for v0.
        });
    }

    result.push({
        type: "component",
        name: formName,
        form: {
            submit: {
                operationId: props.saveOperationId,
                successMessage: "Saved successfully"
            },
            fields: fields,
            // loadOperationId? The form needs to load data. 
            // Current DeclFormSchema doesn't have 'loadOperationId'. 
            // It usually relies on URL params or context.
            // We'll assume the runtime handles loading based on 'entityRef' or similar context.
        }
    });

    // Main Container
    result.push({
        type: "component",
        name: baseName,
        layout: { kind: "column", items: children }
    });

    return result;
};
