import type { BackendIR } from "../domain/backend.js";

/**
 * TargetIR for backend emitters. Currently mirrors BackendIR but
 * exists as a separate layer to decouple domain decisions from
 * emitter-facing shapes.
 */
export type BackendTargetIR = BackendIR;

