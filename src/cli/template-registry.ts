
export type TemplateDefinition = {
    id: string;
    title: string;
    description?: string;
    generate: (projectDir: string, options: any) => Promise<void> | void;
};

class TemplateRegistry {
    private templates: Map<string, TemplateDefinition> = new Map();

    register(template: TemplateDefinition) {
        this.templates.set(template.id, template);
    }

    getTemplates(): TemplateDefinition[] {
        return Array.from(this.templates.values());
    }

    getTemplate(id: string): TemplateDefinition | undefined {
        return this.templates.get(id);
    }

    clear() {
        this.templates.clear();
    }
}

export const templateRegistry = new TemplateRegistry();
