import path from "node:path";
import { Project } from "ts-morph";

export function emitIdAdapter(project: Project, outDir: string, policies?: any) {
  const sf = project.createSourceFile(path.join(outDir, "lib", "id.ts"), "", { overwrite: true });
  sf.addStatements([`// Generated: single point of truth for ID generation`]);

  const gen = policies?.generateId ?? policies?.core?.generateId ?? "uuid_v4";

  if (gen === "uuid_v4") {
    sf.addStatements([
      `import { v4 as uuidv4 } from "uuid";`,
      ``,
      `export function newId(): string {`,
      `  return uuidv4();`,
      `}`,
      ``,
    ]);
  } else if (gen === "shortid") {
    sf.addStatements([
      `import crypto from "node:crypto";`,
      ``,
      `export function newId(): string {`,
      `  return crypto.randomBytes(4).toString("hex");`,
      `}`,
      ``,
    ]);
  } else {
    sf.addStatements([
      `export function newId(): string {`,
      `  throw new Error("no generateId policy implemented");`,
      `}`,
      ``,
    ]);
  }
}

export function emitLoggerAdapter(project: Project, outDir: string, policies?: any) {
  const logging = policies?.logging ?? { enabled: true, level: "info", format: "json", redact: [] };
  const impl = policies?.loggerImpl ?? policies?.core?.loggerImpl; // Fallback for legacy

  const sf = project.createSourceFile(path.join(outDir, "lib", "logger.ts"), "", { overwrite: true });
  sf.addStatements([`// Generated: logger adapter`]);

  if (logging.enabled === false) {
    sf.addStatements([
      `export const logger = {`,
      `  info: (..._args: any[]) => {},`,
      `  warn: (..._args: any[]) => {},`,
      `  error: (..._args: any[]) => {},`,
      `  debug: (..._args: any[]) => {},`,
      `  child: (_bindings: any) => logger,`,
      `};`,
    ]);
    return;
  }

  // Preference: New logging policy > legacy core.loggerImpl
  // If user explicitly asked for 'console' in legacy, we respect it IF new policy isn't set (but new policy has defaults...)
  // Actually, let's just make 'pino' the standard for now if enabled.

  sf.addStatements([
    `import pino from "pino";`,
    ``,
    `export const logger = pino({`,
    `  level: ${JSON.stringify(logging.level || "info")},`,
    ...(logging.format === "pretty" ? [`  transport: { target: "pino-pretty" },`] : []),
    ...(logging.redact && logging.redact.length > 0 ? [`  redact: ${JSON.stringify(logging.redact)},`] : []),
    `});`,
  ]);
}

export function emitContextAdapter(project: Project, outDir: string, policies?: any) {
  const sf = project.createSourceFile(path.join(outDir, "lib", "context.ts"), "", { overwrite: true });
  sf.addStatements([
    `// Generated: request context middleware (requestId + scoped logger)`,
    `import type { Request, Response, NextFunction } from "express";`,
    `import { newId } from "./id";`,
    `import { logger } from "./logger";`,
    ``,
    `export interface RequestContext {`,
    `  requestId: string;`,
    `  logger: { info: (...args: any[]) => void; warn: (...args: any[]) => void; error: (...args: any[]) => void; debug: (...args: any[]) => void; };`,
    `}`,
    ``,
    `export function requestContextMiddleware() {`,
    `  return (req: Request, res: Response, next: NextFunction) => {`,
    `    const incoming = req.headers["x-request-id"] as string | undefined;`,
    `    const requestId = incoming && incoming.trim() ? incoming : newId();`,
    `    const scopedLogger = {`,
    `      info: (...args: any[]) => logger.info(\`[req:\${requestId}]\`, ...args),`,
    `      warn: (...args: any[]) => logger.warn(\`[req:\${requestId}]\`, ...args),`,
    `      error: (...args: any[]) => logger.error(\`[req:\${requestId}]\`, ...args),`,
    `      debug: (...args: any[]) => logger.debug(\`[req:\${requestId}]\`, ...args),`,
    `    };`,
    `    (req as any).ctx = { requestId, logger: scopedLogger } as RequestContext;`,
    `    res.setHeader("x-request-id", requestId);`,
    `    next();`,
    `  };`,
    `}`,
  ]);
}

export function emitHttpAdapter(project: Project, outDir: string, policies?: any) {
  const impl = policies?.httpClient ?? policies?.core?.httpClient ?? "fetch";
  const sf = project.createSourceFile(path.join(outDir, "lib", "http.ts"), "", { overwrite: true });

  sf.addStatements([`// Generated: http client adapter (${impl})`]);

  if (impl === "fetch") {
    sf.addStatements([
      `export async function httpGet(url: string) {`,
      `  const res = await fetch(url);`,
      `  return await res.json();`,
      `}`,
      ``,
      `export async function httpPost(url: string, body: any) {`,
      `  const res = await fetch(url, { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });`,
      `  return await res.json();`,
      `}`,
      ``,
    ]);
  } else if (impl === "axios") {
    sf.addStatements([
      `// axios adapter: install axios in the generated project to use a real HTTP client`,
      `import axios from "axios";`,
      ``,
      `export async function httpGet(url: string) {`,
      `  const res = await axios.get(url);`,
      `  return res.data;`,
      `}`,
      ``,
      `export async function httpPost(url: string, body: any) {`,
      `  const res = await axios.post(url, body);`,
      `  return res.data;`,
      `}`,
      ``,
    ]);
  } else {
    sf.addStatements([
      `export async function httpGet(_url: string) {`,
      `  throw new Error("http client implementation not provided");`,
      `}`,
      ``,
      `export async function httpPost(_url: string, _body: any) {`,
      `  throw new Error("http client implementation not provided");`,
      `}`,
      ``,
    ]);
  }
}

export function emitErrorAdapter(project: Project, outDir: string, policies?: any) {
  const sf = project.createSourceFile(path.join(outDir, "lib", "errors.ts"), "", { overwrite: true });
  sf.addStatements([
    `// Generated: centralized error types and handler`,
    `import type { Request, Response, NextFunction } from "express";`,
    `import { fail } from "./response";`,
    ``,
    `export class AppError extends Error {`,
    `  code: string;`,
    `  status: number;`,
    `  details: any;`,
    `  constructor(code: string, status: number, message: string, details: any = null) {`,
    `    super(message);`,
    `    this.code = code;`,
    `    this.status = status;`,
    `    this.details = details;`,
    `  }`,
    `}`,
    ``,
    `export function toAppError(err: any, fallbackCode = "INTERNAL_ERROR", fallbackStatus = 500): AppError {`,
    `  if (err instanceof AppError) return err;`,
    `  const message = typeof err?.message === "string" ? err.message : "Internal error";`,
    `  const details = err?.details ?? null;`,
    `  return new AppError(fallbackCode, fallbackStatus, message, details);`,
    `}`,
    ``,
    `export function toHttpResponse(err: AppError) {`,
    `  const status = err.status ?? 500;`,
    `  const safeMessage = err.code === "INTERNAL_ERROR" ? "Internal error" : err.message;`,
    `  return { status, body: fail(err.code, safeMessage, err.details ?? null) };`,
    `}`,
    ``,
    `export function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {`,
    `  const appErr = toAppError(err);`,
    `  const { status, body } = toHttpResponse(appErr);`,
    `  res.status(status).json(body);`,
    `}`,
  ]);
}

export function emitPaginationAdapter(project: Project, outDir: string, policies?: any) {
  const defaults = policies?.pagination?.defaults ?? { page: 1, limit: 20, maxLimit: 100 };
  const metaKeys = policies?.pagination?.meta ?? { pageKey: "page", limitKey: "limit", totalKey: "total", hasNextKey: "hasNext" };
  const sf = project.createSourceFile(path.join(outDir, "lib", "pagination.ts"), "", { overwrite: true });
  sf.addStatements([
    `// Generated: pagination helper (page/limit)`,
    `export function parsePagination(query: any) {`,
    `  const rawPage = Number((query?.page as any) ?? ${defaults.page});`,
    `  const rawLimit = Number((query?.limit as any) ?? ${defaults.limit});`,
    `  const page = Math.max(Number.isFinite(rawPage) ? rawPage : ${defaults.page}, 1);`,
    `  const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : ${defaults.limit}, 1), ${defaults.maxLimit});`,
    `  return { page, limit };`,
    `}`,
    ``,
    `export function sliceWithMeta<T>(items: T[], page: number, limit: number) {`,
    `  const start = (page - 1) * limit;`,
    `  const slice = items.slice(start, start + limit);`,
    `  const total = items.length;`,
    `  const hasNext = start + slice.length < total;`,
    `  const meta = {`,
    `    ${metaKeys.pageKey}: page,`,
    `    ${metaKeys.limitKey}: limit,`,
    `    ${metaKeys.totalKey}: total,`,
    `    ${metaKeys.hasNextKey}: hasNext,`,
    `  };`,
    `  return { items: slice, meta };`,
    `}`,
  ]);
}

export function emitValidationAdapter(project: Project, outDir: string, policies?: any) {
  const sf = project.createSourceFile(path.join(outDir, "lib", "validation.ts"), "", { overwrite: true });
  sf.addStatements([
    `// Generated: validation helpers (zod)`,
    `import type { Request, Response, NextFunction } from "express";`,
    `import { z, type ZodTypeAny } from "zod";`,
    `import { AppError } from "./errors";`,
    ``,
    `const passthrough = z.any();`,
    ``,
    `function handleParse(result: ReturnType<ZodTypeAny["safeParse"]>, target: "body" | "params" | "query") {`,
    `  if (result.success) return result.data;`,
    `  const formatted = result.error.format();`,
    `  throw new AppError("VALIDATION_ERROR", 400, \`Invalid \${target}\`, formatted);`,
    `}`,
    ``,
    `export function validateBody(schema?: ZodTypeAny) {`,
    `  const s = schema ?? passthrough;`,
    `  return (req: Request, _res: Response, next: NextFunction) => {`,
    `    try {`,
    `      const data = handleParse(s.safeParse(req.body), "body");`,
    `      (req as any).body = data;`,
    `      next();`,
    `    } catch (err) { next(err); }`,
    `  };`,
    `}`,
    ``,
    `export function validateParams(schema?: ZodTypeAny) {`,
    `  const s = schema ?? passthrough;`,
    `  return (req: Request, _res: Response, next: NextFunction) => {`,
    `    try {`,
    `      const data = handleParse(s.safeParse(req.params), "params");`,
    `      (req as any).params = data;`,
    `      next();`,
    `    } catch (err) { next(err); }`,
    `  };`,
    `}`,
    ``,
    `export function validateQuery(schema?: ZodTypeAny) {`,
    `  const s = schema ?? passthrough;`,
    `  return (req: Request, _res: Response, next: NextFunction) => {`,
    `    try {`,
    `      const data = handleParse(s.safeParse(req.query), "query");`,
    `      (req as any).query = data;`,
    `      next();`,
    `    } catch (err) { next(err); }`,
    `  };`,
    `}`,
  ]);
}

export function emitResponseAdapter(project: Project, outDir: string, policies?: any) {
  const keys = policies?.envelope?.keys;
  const metaKeys = policies?.envelope?.meta;
  const errorKeys = policies?.envelope?.errorShape;

  const sf = project.createSourceFile(path.join(outDir, "lib", "response.ts"), "", { overwrite: true });
  sf.addStatements([
    `// Generated response helpers (envelope)`,
    `export interface Envelope<T> {`,
    `  ${keys.data}: T | null;`,
    `  ${keys.meta}: Record<string, unknown> | null;`,
    `  ${keys.error}: Record<string, unknown> | null;`,
    `}`,
    ``,
    `export interface EnvelopePayload<T> { data?: T | null; meta?: any; error?: any }`,
    ``,
    `export function envelope<T>(payload: EnvelopePayload<T>): Envelope<T> {`,
    `  return {`,
    `    ${keys.data}: payload.data ?? null,`,
    `    ${keys.meta}: payload.meta ?? null,`,
    `    ${keys.error}: payload.error ?? null,`,
    `  } as Envelope<T>;`,
    `}`,
    ``,
    `export function ok<T>(data: T, meta: any = null): Envelope<T> {`,
    `  return envelope({ data, meta, error: null });`,
    `}`,
    ``,
    `export function fail(code: string, message: string, details?: any): Envelope<null> {`,
    `  const error = {`,
    `    ${errorKeys.codeKey}: code,`,
    `    ${errorKeys.messageKey}: message,`,
    `    ${errorKeys.detailsKey}: details ?? null,`,
    `  };`,
    `  return envelope({ data: null, meta: null, error });`,
    `}`,
    ``,
    `export function withRequestId(meta: any = {}, requestId?: string): any {`,
    `  if (!requestId) return meta;`,
    `  return { ...meta, ${metaKeys.requestIdKey}: requestId };`,
    `}`,
  ]);
}

export function emitAuthAdapter(project: Project, outDir: string, policies?: any) {
  const jwt = policies?.auth?.jwt;
  const sf = project.createSourceFile(path.join(outDir, "lib", "auth.ts"), "", { overwrite: true });

  sf.addStatements([
    `// Generated: simple JWT verification middleware`,
    `import jwt from "jsonwebtoken";`,
    `import type { Request, Response, NextFunction } from "express";`,
    `import { AppError } from "./errors";`,
    ``,
    `const JWT_ENABLED = ${jwt?.enabled ?? false};`,
    `const JWT_ALG = ${JSON.stringify(jwt?.algorithm ?? "HS256")};`,
    `const JWT_SECRET = ${JSON.stringify(jwt?.secret ?? "CHANGE_ME_SUPER_SECRET_MIN_16_CHARS")};`,
    `const JWT_ISSUER = ${JSON.stringify(jwt?.issuer ?? null)};`,
    `const JWT_AUDIENCE = ${JSON.stringify(jwt?.audience ?? null)};`,
    `const JWT_CLOCK_TOLERANCE = ${jwt?.clockToleranceSec ?? 30};`,
    `const CLAIM_SUB = ${JSON.stringify(jwt?.claims?.subjectKey ?? "sub")};`,
    `const CLAIM_ROLES = ${JSON.stringify(jwt?.claims?.rolesKey ?? "roles")};`,
    ``,
    `export function verifyToken(token: string): { sub: string; roles: string[] } {`,
    `  if (!JWT_ENABLED) throw new Error("JWT disabled");`,
    `  const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALG], issuer: JWT_ISSUER ?? undefined, audience: JWT_AUDIENCE ?? undefined, clockTolerance: JWT_CLOCK_TOLERANCE });`,
    `  const payload = decoded as any;`,
    `  const sub = payload?.[CLAIM_SUB];`,
    `  const roles = payload?.[CLAIM_ROLES] ?? [];`,
    `  return { sub, roles };`,
    `}`,
    ``,
    `export function authMiddleware(publicRoutes: string[] = []) {`,
    `  return (req: Request, res: Response, next: NextFunction) => {`,
    `    if (!JWT_ENABLED) return next();`,
    `    const path = req.path;`,
    `    if (publicRoutes.some((p) => path.startsWith(p))) return next();`,
    `    const header = req.headers["authorization"];`,
    `    if (!header || typeof header !== "string" || !header.startsWith("Bearer ")) {`,
    `      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing bearer token", details: null }, data: null, meta: null });`,
    `      return;`,
    `    }`,
    `    const token = header.replace("Bearer ", "");`,
    `    try {`,
    `      const user = verifyToken(token);`,
    `      (req as any).user = user;`,
    `      next();`,
    `    } catch (err: any) {`,
    `      res.status(401).json({ error: { code: "UNAUTHORIZED", message: err?.message ?? "Invalid token", details: null }, data: null, meta: null });`,
    `    }`,
    `  };`,
    `}`,
    ``,
    `export function requireRoles(roles: string[], mode: "any" | "all" = "any") {`,
    `  const normalized = roles ?? [];`,
    `  return (req: Request, _res: Response, next: NextFunction) => {`,
    `    if (!JWT_ENABLED || normalized.length === 0) return next();`,
    `    const userRoles = (req as any).user?.roles ?? [];`,
    `    const ok = mode === "all" ? normalized.every((r) => userRoles.includes(r)) : normalized.some((r) => userRoles.includes(r));`,
    `    if (!ok) return next(new AppError("FORBIDDEN", 403, "Insufficient role"));`,
    `    return next();`,
    `  };`,
    `}`,
    ``,
    `export function isAuthEnabled() { return JWT_ENABLED; }`,
  ]);
}

export function emitHealthAdapter(project: Project, outDir: string, policies?: any) {
  const health = policies?.health ?? { enabled: true, endpoint: "/health", metrics: { enabled: false, endpoint: "/metrics" } };

  if (!health.enabled) return;

  const sf = project.createSourceFile(path.join(outDir, "lib", "health.ts"), "", { overwrite: true });
  sf.addStatements([
    `// Generated: health check and metrics adapter`,
    `import type { Request, Response } from "express";`,
    `import { logger } from "./logger";`,
    ``,
    `export async function healthCheck(req: Request, res: Response) {`,
    `  // TODO: Add database connection check if DB is enabled`,
    `  const status = {`,
    `    status: "ok",`,
    `    uptime: process.uptime(),`,
    `    timestamp: new Date().toISOString(),`,
    `  };`,
    `  res.json(status);`,
    `}`,
    ``,
  ]);

  if (health.metrics?.enabled) {
    sf.addStatements([
      `import client from "prom-client";`,
      ``,
      `// Initialize metrics`,
      `const collectDefaultMetrics = client.collectDefaultMetrics;`,
      `collectDefaultMetrics();`,
      ``,
      `export async function metricsCheck(req: Request, res: Response) {`,
      `  try {`,
      `    res.set("Content-Type", client.register.contentType);`,
      `    res.end(await client.register.metrics());`,
      `  } catch (err) {`,
      `    logger.error("Metrics error", err);`,
      `    res.status(500).end(err);`,
      `  }`,
      `}`,
    ]);
  }
}
