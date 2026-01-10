import { registerMapper, unregisterMapper, listMappers } from "../mappers/index.js";
import { engine as loweringEngine } from "../lowering/engine.js";
import { emitterEngine } from "../emit/engine.js";
import { registerTargetEmitter } from "../emit/registry.js";
import * as frontendRegistry from "../emit/frontend/registry.js";

export type ExtensionContext = {
  registerMapper: typeof registerMapper;
  unregisterMapper: typeof unregisterMapper;
  listMappers: typeof listMappers;
  registerTransform: typeof loweringEngine.registerTransform;
  registerPolicySchema: typeof loweringEngine.registerPolicySchema;
  registerEmitter: typeof emitterEngine.registerEmitter;
  registerTargetEmitter: typeof registerTargetEmitter;
  // Frontend registries
  registerAuthStrategy: typeof frontendRegistry.authStrategies.register;
  registerCsrfStrategy: typeof frontendRegistry.csrfStrategies.register;
  registerEnvelopeAdapter: typeof frontendRegistry.envelopeAdapters.register;
  registerPaginationAdapter: typeof frontendRegistry.paginationAdapters.register;
  registerUIComponent: typeof frontendRegistry.uiComponents.register;
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
    registerAuthStrategy: (id: string, item: any, options?: any) => ctx.registerAuthStrategy(prefix(id), item, options),
    registerCsrfStrategy: (id: string, item: any, options?: any) => ctx.registerCsrfStrategy(prefix(id), item, options),
    registerEnvelopeAdapter: (id: string, item: any, options?: any) => ctx.registerEnvelopeAdapter(prefix(id), item, options),
    registerPaginationAdapter: (id: string, item: any, options?: any) => ctx.registerPaginationAdapter(prefix(id), item, options),
    registerUIComponent: (id: string, item: any, options?: any) => ctx.registerUIComponent(prefix(id), item, options),
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
    registerAuthStrategy: frontendRegistry.authStrategies.register.bind(frontendRegistry.authStrategies),
    registerCsrfStrategy: frontendRegistry.csrfStrategies.register.bind(frontendRegistry.csrfStrategies),
    registerEnvelopeAdapter: frontendRegistry.envelopeAdapters.register.bind(frontendRegistry.envelopeAdapters),
    registerPaginationAdapter: frontendRegistry.paginationAdapters.register.bind(frontendRegistry.paginationAdapters),
    registerUIComponent: frontendRegistry.uiComponents.register.bind(frontendRegistry.uiComponents),
    namespace: (ns: string) => namespaced(base, ns),
  };
  return base;
}

export type { MapperFn } from "../types/extension.js";
