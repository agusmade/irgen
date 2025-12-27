// Generated: logger adapter (pino)
// pino adapter: please add pino as a dependency in the generated project
export const logger = {
  info: (...args: any[]) => console.info("[logger:pino]", ...args),
  warn: (...args: any[]) => console.warn("[logger:pino]", ...args),
  error: (...args: any[]) => console.error("[logger:pino]", ...args),
  debug: (...args: any[]) => console.debug("[logger:pino]", ...args),
};

