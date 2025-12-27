export type EmitterFn = (ir: any, outDir: string, options?: any) => Promise<void> | void;

class EmitterEngine {
  private emitters = new Map<string, EmitterFn>();

  registerEmitter(name: string, fn: EmitterFn, options?: { force?: boolean }) {
    if (this.emitters.has(name) && !options?.force) throw new Error(`emitter already registered: ${name}`);
    this.emitters.set(name, fn);
  }

  unregisterEmitter(name: string) {
    this.emitters.delete(name);
  }

  getEmitter(name: string) {
    return this.emitters.get(name);
  }

  listEmitters() {
    return Array.from(this.emitters.keys());
  }

  async runEmitter(name: string, ir: any, outDir: string, options?: any) {
    const fn = this.emitters.get(name);
    if (!fn) throw new Error(`emitter not registered: ${name}`);
    return await fn(ir, outDir, options);
  }
}

export const emitterEngine = new EmitterEngine();
