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
};

export function createExtensionContext(): ExtensionContext {
  return {
    registerMapper,
    unregisterMapper,
    listMappers,
    registerTransform: loweringEngine.registerTransform.bind(loweringEngine),
    registerPolicySchema: loweringEngine.registerPolicySchema.bind(loweringEngine),
    registerEmitter: emitterEngine.registerEmitter.bind(emitterEngine),
    registerTargetEmitter,
  };
}

export type { MapperFn } from "../types/extension.js";
