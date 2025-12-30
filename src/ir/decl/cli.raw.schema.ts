import { z } from "zod";

export const DeclCliCommandSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  options: z.array(z.object({
    name: z.string().min(1),
    flag: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(["string", "number", "boolean"]).optional(),
    required: z.boolean().optional(),
  })).optional(),
  action: z.string().optional(),
});

export const DeclCliAppSchema = z.object({
  type: z.literal("cli"),
  name: z.string().min(1),
  commands: z.array(DeclCliCommandSchema).default([]),
});

export type DeclCliApp = z.infer<typeof DeclCliAppSchema>;
export type DeclCliCommand = z.infer<typeof DeclCliCommandSchema>;

