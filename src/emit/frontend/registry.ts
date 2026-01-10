import type { AuthStrategy, CsrfStrategy, EnvelopeAdapter, PaginationAdapter } from "../../ir/frontend-contract.js";

class Registry<T> {
    private items = new Map<string, T>();

    register(id: string, item: T, options?: { force?: boolean }) {
        if (this.items.has(id) && !options?.force) {
            throw new Error(`Registry item already exists: ${id}`);
        }
        this.items.set(id, item);
    }

    get(id: string): T | undefined {
        return this.items.get(id);
    }

    require(id: string): T {
        const item = this.get(id);
        if (!item) throw new Error(`Registry item not found: ${id}`);
        return item;
    }

    list() {
        return Array.from(this.items.entries()).map(([id, item]) => ({ id, item }));
    }
}

export const authStrategies = new Registry<any>();
export const csrfStrategies = new Registry<any>();
export const envelopeAdapters = new Registry<EnvelopeAdapter>();
export const paginationAdapters = new Registry<PaginationAdapter>();
export const uiComponents = new Registry<any>();

// Register built-in defaults
envelopeAdapters.register("ok_data_meta", {
    id: "ok_data_meta",
    extractData: (p: any) => (p && typeof p === "object" ? p.data : undefined),
    extractMeta: (p: any) => (p && typeof p === "object" ? p.meta : undefined),
    extractErrorPayload: (p: any) => (p && typeof p === "object" ? p.error : undefined),
});

envelopeAdapters.register("items_cursor", {
    id: "items_cursor",
    extractData: (p: any) => (p && typeof p === "object" ? p.items : undefined),
    extractMeta: (p: any) => (p && typeof p === "object" ? p.meta : undefined),
    extractErrorPayload: (p: any) => (p && typeof p === "object" ? p.error : undefined),
});

paginationAdapters.register("cursor_root", {
    id: "cursor_root",
    extract: (p: any) =>
        p && typeof p === "object"
            ? { nextCursor: typeof p.nextCursor === "string" ? p.nextCursor : undefined }
            : {},
});
