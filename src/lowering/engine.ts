import type { ZodTypeAny } from "zod";
export type LoweringTransform = (input: any, policies?: Record<string, any>) => Promise<any> | any;
export type PolicyValidator = (policies?: Record<string, any>) => void;

class LoweringEngine {
  private transforms = new Map<string, LoweringTransform>();
  private validators = new Map<string, PolicyValidator>();
  private policySchemas = new Map<string, ZodTypeAny>();

  registerTransform(name: string, fn: LoweringTransform) {
    if (this.transforms.has(name)) throw new Error(`transform already registered: ${name}`);
    this.transforms.set(name, fn);
  }

  unregisterTransform(name: string) {
    this.transforms.delete(name);
  }

  getTransform(name: string) {
    return this.transforms.get(name);
  }

  listTransforms() {
    return Array.from(this.transforms.keys());
  }

  registerPolicyValidator(name: string, v: PolicyValidator) {
    if (this.validators.has(name)) throw new Error(`validator already registered: ${name}`);
    this.validators.set(name, v);
  }

  registerPolicySchema(name: string, schema: ZodTypeAny) {
    if (this.policySchemas.has(name)) throw new Error(`policy schema already registered: ${name}`);
    this.policySchemas.set(name, schema);
  }

  runTransform(name: string, input: any, policies?: Record<string, any>) {
    // Prefer zod schema validation if available for richer errors
    const schema = this.policySchemas.get(name);
    if (schema) {
      schema.parse(policies ?? {});
    } else {
      const validator = this.validators.get(name);
      if (validator) validator(policies);
    }

    const fn = this.transforms.get(name);
    if (!fn) throw new Error(`transform not registered: ${name}`);
    return fn(input, policies);
  }
}

export const engine = new LoweringEngine();
