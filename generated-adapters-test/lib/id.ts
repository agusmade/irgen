// Generated: single point of truth for ID generation
import crypto from "node:crypto";
export function newId(): string {
  return crypto.randomBytes(4).toString("hex");
}


