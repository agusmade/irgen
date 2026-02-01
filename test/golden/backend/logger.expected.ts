// Generated: logger adapter
import pino from "pino";
export const logger = pino({
  level: "info",
  redact: ["password", "token", "secret", "authorization"],
});
