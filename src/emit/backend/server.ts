import path from "node:path";
import { Project } from "ts-morph";
import type { BackendTargetIR } from "../../ir/target/backend.js";

export function emitHttpServer(project: Project, outDir: string, ir: BackendTargetIR, policies?: any) {
  const rest = policies?.interfaces?.rest;
  if (!rest || !rest.enabled) return;

  const sf = project.createSourceFile(path.join(outDir, "server.ts"), "", { overwrite: true });

  sf.addStatements([
    `import express from "express";`,
    `import cors from "cors";`,
    `import { z } from "zod";`,
    `import { authMiddleware, isAuthEnabled } from "./lib/auth";`,
    `import { requestContextMiddleware } from "./lib/context";`,
    `import { ok, fail, withRequestId } from "./lib/response";`,
    `import { AppError, toAppError, errorMiddleware } from "./lib/errors";`,
    `import { validateBody, validateParams, validateQuery } from "./lib/validation";`,
    `import { parsePagination, sliceWithMeta } from "./lib/pagination";
    import { logger } from "./lib/logger";
    import { pinoHttp } from "pino-http";`,
  ]);

  ir.entities.forEach((entity) => {
    sf.addImportDeclaration({
      moduleSpecifier: `./controllers/${entity.name.toLowerCase()}.controller`,
      namedImports: [`${entity.name}Controller`],
    });
    sf.addImportDeclaration({
      moduleSpecifier: `./services/${entity.name.toLowerCase()}.service`,
      namedImports: [`${entity.name}Service`],
    });
  });

  sf.addStatements([
    ``,
    `const app = express();`,
    `app.use(cors());`,
    `app.use(express.json());`,
    `app.use(requestContextMiddleware());`,
    `app.use(pinoHttp({ logger }));`,
    ``,
    `// Health Check`,
    `import { healthCheck, metricsCheck } from "./lib/health";`,
    `app.get("/health", healthCheck);`,
    `app.get("/metrics", metricsCheck);`,
    ``,
    `const BASE_PATH = ${JSON.stringify(rest.basePath)};`,
    `const publicRoutes = ${JSON.stringify(rest.publicRoutes)};`,
    `const getRequestId = (req: any) => req?.ctx?.requestId ?? (req.headers["x-request-id"] as string | undefined);`,
    `const idParamsSchema = z.object({ id: z.string().min(1) });`,
    ``,
  ]);

  ir.entities.forEach((entity) => {
    if (entity.model && Object.keys(entity.model).length > 0) {
      const fields: string[] = [];
      Object.entries(entity.model).forEach(([k, t]) => {
        const lower = t.toLowerCase();
        let zType = "z.any()";
        if (lower.endsWith("[]")) {
          const base = lower.slice(0, -2);
          if (["string", "uuid"].includes(base)) zType = "z.array(z.string())";
          else if (["number", "int", "integer", "float", "double"].includes(base)) zType = "z.array(z.number())";
          else if (["boolean", "bool"].includes(base)) zType = "z.array(z.boolean())";
          else zType = "z.array(z.any())";
        } else if (["string", "uuid"].includes(lower)) zType = "z.string()";
        else if (["number", "int", "integer", "float", "double"].includes(lower)) zType = "z.number()";
        else if (["boolean", "bool"].includes(lower)) zType = "z.boolean()";
        fields.push(`${k}: ${zType}`);
      });
      sf.addStatements([
        `const ${entity.name}Schema = z.object({ ${fields.join(", ")} });`,
        `const ${entity.name}UpdateSchema = ${entity.name}Schema.partial();`,
        ``,
      ]);
    }
  });

  // only wire auth if enabled or if publicRoutes explicitly set
  if (rest.publicRoutes && rest.publicRoutes.length > 0) {
    sf.addStatements([`app.use(BASE_PATH, authMiddleware(publicRoutes));`, ``]);
  } else {
    sf.addStatements([`if (isAuthEnabled()) { app.use(BASE_PATH, authMiddleware(publicRoutes)); }`, ``]);
  }

  ir.entities.forEach((entity) => {
    const resource = entity.name.toLowerCase();
    const controllerName = `${entity.name}Controller`;
    const controllerInstance = `${resource}Controller`;

    sf.addStatements([
      `const ${controllerInstance} = new ${controllerName}();`,
      ``,
      `// Routes for ${entity.name}`,
    ]);

    entity.operations.forEach((op) => {
      if (op.kind === "CREATE") {
        sf.addStatements([
          `app.post(\`\${BASE_PATH}/${resource}\`, validateBody(${entity.model && Object.keys(entity.model).length > 0 ? `${entity.name}Schema` : ""}), async (req, res, next) => {`,
          `  try {`,
          `    const result = await ${controllerInstance}.${op.methodName}(req.body);`,
          `    const meta = withRequestId(null, getRequestId(req));`,
          `    res.status(201).json(ok(result, meta));`,
          `  } catch (err: any) {`,
          `    return next(toAppError(err, "BAD_REQUEST", 400));`,
          `  }`,
          `});`,
          ``,
        ]);
      } else if (op.kind === "GET") {
        sf.addStatements([
          `app.get(\`\${BASE_PATH}/${resource}/:id\`, validateParams(idParamsSchema), async (req, res, next) => {`,
          `  try {`,
          `    const id = req.params.id;`,
          `    const result = await ${controllerInstance}.${op.methodName}(id);`,
          `    const meta = withRequestId(null, getRequestId(req));`,
          `    if (!result) {`,
          `      throw new AppError("NOT_FOUND", 404, "${entity.name} not found");`,
          `    }`,
          `    res.json(ok(result, meta));`,
          `  } catch (err: any) {`,
          `    return next(toAppError(err, "NOT_FOUND", 404));`,
          `  }`,
          `});`,
          ``,
        ]);
      } else if (op.kind === "LIST") {
        sf.addStatements([
          `app.get(\`\${BASE_PATH}/${resource}\`, validateQuery(), async (req, res) => {`,
          `  const { page, limit } = parsePagination(req.query);`,
          `  const all = await ${controllerInstance}.${op.methodName}();`,
          `  const { items, meta: pageMeta } = sliceWithMeta(all, page, limit);`,
          `  const meta = withRequestId(pageMeta, getRequestId(req));`,
          `  res.json(ok(items, meta));`,
          `});`,
          ``,
        ]);
      } else if (op.kind === "UPDATE") {
        sf.addStatements([
          `app.patch(\`\${BASE_PATH}/${resource}/:id\`, validateParams(idParamsSchema), validateBody(${entity.model && Object.keys(entity.model).length > 0 ? `${entity.name}UpdateSchema` : ""}), async (req, res, next) => {`,
          `  try {`,
          `    const result = await ${controllerInstance}.${op.methodName}(req.params.id, req.body);`,
          `    const meta = withRequestId(null, getRequestId(req));`,
          `    if (!result) throw new AppError("NOT_FOUND", 404, "${entity.name} not found");`,
          `    res.json(ok(result, meta));`,
          `  } catch (err: any) {`,
          `    return next(toAppError(err, "BAD_REQUEST", 400));`,
          `  }`,
          `});`,
          ``,
        ]);
      } else if (op.kind === "REMOVE") {
        sf.addStatements([
          `app.delete(\`\${BASE_PATH}/${resource}/:id\`, validateParams(idParamsSchema), async (req, res, next) => {`,
          `  const success = await ${controllerInstance}.${op.methodName}(req.params.id);`,
          `  if (!success) return next(new AppError("NOT_FOUND", 404, "${entity.name} not found"));`,
          `  const meta = withRequestId(null, getRequestId(req));`,
          `  res.json(ok(true, meta));`,
          `});`,
          ``,
        ]);
      }
    });
  });

  sf.addStatements([
    `app.use(errorMiddleware);`,
    ``,
    `const PORT = process.env.PORT || 3000;`,
    `app.listen(PORT, () => { logger.info("Backend server listening on port", PORT); });`,
  ]);
}
