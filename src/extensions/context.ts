import { registerMapper, unregisterMapper, listMappers } from "../mappers/index.js";
import { engine as loweringEngine } from "../lowering/engine.js";
import { emitterEngine } from "../emit/engine.js";
import { registerTargetEmitter } from "../emit/registry.js";
import * as frontendRegistry from "../emit/frontend/registry.js";
import { validatorRegistry, ValidatorFn } from "../dsl/validator-registry.js";
import { templateRegistry, TemplateDefinition } from "../cli/template-registry.js";
import { Logger, logger as baseLogger } from "../utils/logger.js";

export type ExtensionContext = {
  registerMapper: typeof registerMapper;
  unregisterMapper: typeof unregisterMapper;
  listMappers: typeof listMappers;
  registerTransform: typeof loweringEngine.registerTransform;
  registerPolicySchema: typeof loweringEngine.registerPolicySchema;
  registerEmitter: typeof emitterEngine.registerEmitter;
  registerTargetEmitter: typeof registerTargetEmitter;
  registerAuthStrategy: typeof frontendRegistry.authStrategies.register;
  registerCsrfStrategy: typeof frontendRegistry.csrfStrategies.register;
  registerEnvelopeAdapter: typeof frontendRegistry.envelopeAdapters.register;
  registerPaginationAdapter: typeof frontendRegistry.paginationAdapters.register;
  registerUIComponent: typeof frontendRegistry.uiComponents.register;
  registerValidator: (id: string, fn: ValidatorFn) => void;
  registerTemplate: (template: TemplateDefinition) => void;
  logger: Logger;
  namespace: (ns: string) => ExtensionContext;
  root: ExtensionContext;
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
    registerValidator: (id: string, fn: ValidatorFn) => ctx.registerValidator(prefix(id), fn),
    registerTemplate: (template: TemplateDefinition) => ctx.registerTemplate({ ...template, id: prefix(template.id) }),
    logger: ctx.logger.child(ns),
    namespace: (child: string) => namespaced(ctx, `${ns}:${child}`),
    root: ctx.root,
  };
}

export function createExtensionContext(): ExtensionContext {
  const base = {} as ExtensionContext;
  return Object.assign(base, {
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
    registerValidator: (id: string, fn: ValidatorFn) => validatorRegistry.register(id, fn),
    registerTemplate: (template: TemplateDefinition) => templateRegistry.register(template),
    logger: baseLogger,
    namespace: (ns: string) => namespaced(base, ns),
    root: base,
  });
}

export type { MapperFn } from "../types/extension.js";
