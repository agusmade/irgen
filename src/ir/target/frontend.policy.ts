import { z } from "zod";

export const FrontendStylingPolicySchema = z.object({
    cssFramework: z.enum(["tailwind", "none"]).default("tailwind"),
    theme: z.object({
        primaryColor: z.string().default("#4f46e5"), // indigo-600
        borderRadius: z.enum(["none", "sm", "md", "lg", "full"]).default("md"),
    }).default({}),
}).default({});

export const FrontendFrameworkPolicySchema = z.object({
    library: z.enum(["react"]).default("react"),
    runtime: z.enum(["vite", "none"]).default("vite"),
    router: z.enum(["react-router-dom", "none"]).default("react-router-dom"),
    iconLibrary: z.enum(["lucide-react", "none"]).default("lucide-react"),
    rendering: z.object({
        mode: z.enum(["csr", "ssg", "hybrid"]).default("csr"),
        prerender: z.object({
            enabled: z.boolean().default(false),
            routes: z.union([z.literal("auto"), z.array(z.string())]).default("auto"),
            outDir: z.string().default("dist"),
            emitSitemap: z.boolean().default(false),
            emitRobotsTxt: z.boolean().default(false),
        }).default({}),
    }).default({}),
}).default({});

export const FrontendPolicySchema = z.object({
    styling: FrontendStylingPolicySchema,
    framework: FrontendFrameworkPolicySchema,
}).default({});

export type FrontendPolicy = z.infer<typeof FrontendPolicySchema>;

export function normalizeFrontendPolicy(input: unknown): FrontendPolicy {
    return FrontendPolicySchema.parse(input || {});
}
