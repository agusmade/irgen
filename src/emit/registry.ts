const mapping = new Map<string, string>();

export function registerTargetEmitter(target: string, emitterName: string, options?: { force?: boolean }) {
  if (mapping.has(target) && !options?.force) throw new Error(`target already has emitter: ${target}`);
  mapping.set(target, emitterName);
}

// register noop defaults to keep registry populated for known targets
try {
  registerTargetEmitter("cli", "cli-fake", { force: false });
} catch (e) {
  // ignore if already set
}

export function getEmitterForTarget(target: string) {
  return mapping.get(target);
}

export function listTargetMappings() {
  return Array.from(mapping.entries()).map(([t, e]) => ({ target: t, emitter: e }));
}

export function setMappings(obj: Record<string, string>) {
  for (const k of Object.keys(obj)) {
    mapping.set(k, obj[k]);
  }
}

export default { registerTargetEmitter, getEmitterForTarget, listTargetMappings, setMappings };
