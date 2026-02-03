
import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { createExtensionContext } from "../extensions/context.js";

const require = createRequire(import.meta.url);

export async function loadExtensions(extModules: string[]) {
    if (!extModules.length) return;

    const ctx = createExtensionContext();

    const pickExtensionFn = (mod: any) => {
        const candidate = (mod?.default ?? mod?.extension ?? mod);
        if (typeof candidate === "function") return candidate;
        if (candidate && typeof candidate === "object") {
            if (typeof candidate.default === "function") return candidate.default;
            if (typeof candidate.extension === "function") return candidate.extension;
        }
        return null;
    };

    const resolveExtensionModule = (spec: string) => {
        const isPathLike = spec.startsWith(".") || spec.startsWith("/") || /^[A-Za-z]:[\\/]/.test(spec) || fs.existsSync(path.resolve(process.cwd(), spec));
        if (isPathLike) {
            let abs = path.isAbsolute(spec) ? spec : path.resolve(process.cwd(), spec);
            if (!fs.existsSync(abs)) {
                // Try with common extensions if not found
                let found = false;
                for (const ext of [".ts", ".js", ".mjs"]) {
                    if (fs.existsSync(abs + ext)) {
                        abs = abs + ext;
                        found = true;
                        break;
                    }
                }
                if (!found) throw new Error(`extension module not found: ${spec}`);
            }
            return pathToFileURL(abs).href;
        }
        try {
            const resolved = require.resolve(spec, { paths: [process.cwd()] });
            return pathToFileURL(resolved).href;
        } catch (e) {
            // Fallback for namespaced packages or modules that might not be in node_modules yet
            return spec;
        }
    };

    for (const modPath of extModules) {
        try {
            const modUrl = resolveExtensionModule(modPath);
            const imported = await import(modUrl);
            const fn = pickExtensionFn(imported);
            if (typeof fn === "function") {
                const metadata = imported.extensionMetadata || imported.metadata || {};
                const name = metadata.name || path.basename(modPath, path.extname(modPath)).replace(/^irgen-ext-/, "");
                const version = metadata.version ? ` v${metadata.version}` : "";

                ctx.logger.info(`Loading extension: ${name}${version}`);

                const namespacedCtx = ctx.namespace(name);
                await fn(namespacedCtx, imported.options ?? undefined);
            } else {
                console.warn(`extension module ${modPath} did not export a function`);
            }
        } catch (err: any) {
            console.error(`Failed to load extension "${modPath}": ${err.message}`);
        }
    }
}
