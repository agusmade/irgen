import { registerMapper, unregisterMapper, listMappers } from "../mappers/index.js";
import { engine as loweringEngine } from "../lowering/engine.js";
import { emitterEngine } from "../emit/engine.js";
import { registerTargetEmitter } from "../emit/registry.js";

export type ExtensionContext = {
  registerMapper: typeof registerMapper;
  unregisterMapper: typeof unregisterMapper;
  listMappers: typeof listMappers;
  registerTransform: typeof loweringEngine.registerTransform;
  registerPolicySchema: typeof loweringEngine.registerPolicySchema;
  registerEmitter: typeof emitterEngine.registerEmitter;
  registerTargetEmitter: typeof registerTargetEmitter;
  namespace: (ns: string) => ExtensionContext;
};

function namespaced(ctx: ExtensionContext, ns: string): ExtensionContext {
  const prefix = (name: string) => (name.includes(":") ? name : `${ns}:${name}`);
  return {
    ...ctx,
    registerMapper: (name: string, fn: any, options?: any) => ctx.registerMapper(prefix(name), fn, options),
    unregisterMapper: (name: string) => ctx.unregisterMapper(prefix(name)),
    registerTransform: (name: string, fn: any) => ctx.registerTransform(prefix(name), fn),
    registerPolicySchema: (name: string, schema: any) => ctx.registerPolicySchema(prefix(name), schema),
    registerEmitter: (name: string, fn: any, options?: any) => ctx.registerEmitter(prefix(name), fn, options),
    // target emitters remain un-namespaced because targets are resolved externally (CLI/engine)
    registerTargetEmitter: ctx.registerTargetEmitter,
    namespace: (child: string) => namespaced(ctx, `${ns}:${child}`),
  };
}

export function createExtensionContext(): ExtensionContext {
  const base: ExtensionContext = {
    registerMapper,
    unregisterMapper,
    listMappers,
    registerTransform: loweringEngine.registerTransform.bind(loweringEngine),
    registerPolicySchema: loweringEngine.registerPolicySchema.bind(loweringEngine),
    registerEmitter: emitterEngine.registerEmitter.bind(emitterEngine),
    registerTargetEmitter,
    namespace: (ns: string) => namespaced(base, ns),
  };
  return base;
}

export type { MapperFn } from "../types/extension.js";
