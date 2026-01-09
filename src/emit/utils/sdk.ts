import fs from "node:fs";
import path from "node:path";
import { pascal, camel, kebab, pluralize } from "../../utils/string.js";

/**
 * irgen Emitter SDK
 * Provides common utilities for building emitters.
 */

export const casing = {
    pascal,
    camel,
    kebab,
    plural: pluralize,
};

export function ensureDir(p: string) {
    if (!fs.existsSync(p)) {
        fs.mkdirSync(p, { recursive: true });
    }
}

export function writeIfChanged(filePath: string, content: string) {
    if (fs.existsSync(filePath)) {
        const existing = fs.readFileSync(filePath, "utf-8");
        if (existing === content) return;
    }
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, "utf-8");
}

export function writeOnce(filePath: string, content: string) {
    if (fs.existsSync(filePath)) return;
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, "utf-8");
}
