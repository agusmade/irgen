import path from "node:path";
import fs from "node:fs";
import { Project, QuoteKind, IndentationText, ScriptTarget, Scope } from "ts-morph";
import type { BackendEntity } from "../../ir/domain/backend.js";
import type { BackendTargetIR } from "../../ir/target/backend.js";
import { BackendPolicySchema } from "../../ir/target/backend.policy.js";
import { emitterEngine } from "../engine.js";
import { formatDirectory } from "../format.js";
import { emitIdAdapter, emitLoggerAdapter, emitHttpAdapter, emitResponseAdapter, emitAuthAdapter, emitContextAdapter, emitErrorAdapter, emitValidationAdapter, emitPaginationAdapter } from "./adapters.js";
import { emitHttpServer } from "./server.js";
import { emitPackageJson, emitTsConfig } from "./packaging.js";

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function cleanDir(p: string) {
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}

function getBackendPolicies(ir: BackendTargetIR) {
  const p: any = (ir as any)?.policies ?? {};
  const rawBackend = p.backend ?? p ?? {};
  const backend = BackendPolicySchema.parse(rawBackend);
  const legacy = rawBackend as any;
  const core = backend.core ?? {};
  return {
    ...backend,
    core,
    // legacy fields fallback for emitters still reading old keys
    generateId: legacy.generateId ?? core.generateId,
    loggerImpl: legacy.loggerImpl ?? core.loggerImpl,
    httpClient: legacy.httpClient ?? core.httpClient,
    formatter: legacy.formatter ?? core.formatter,
    db: legacy.db ?? core.db,
    idProvider: legacy.idProvider ?? (core.generateId === "shortid" ? "shortId" : "newId"),
  };
}

export function emitBackendToProject(project: Project, outDir: string, ir: BackendTargetIR) {
  const policies = getBackendPolicies(ir);
  ensureDir(outDir);
  ensureDir(path.join(outDir, "lib"));
  ensureDir(path.join(outDir, "services"));
  ensureDir(path.join(outDir, "controllers"));

  // adapters
  emitIdAdapter(project, outDir, policies);
  emitLoggerAdapter(project, outDir, policies);
  emitContextAdapter(project, outDir, policies);
  emitHttpAdapter(project, outDir, policies);
  emitResponseAdapter(project, outDir, policies);
  emitAuthAdapter(project, outDir, policies);
  emitErrorAdapter(project, outDir, policies);
  emitValidationAdapter(project, outDir, policies);
  emitPaginationAdapter(project, outDir, policies);

  // Prisma support
  const dbProvider = policies?.db?.provider;

  if (dbProvider === "prisma") {
    emitPrismaSchema(outDir, policies, ir.entities);
  }

  emitModels(project, outDir, ir.entities);

  for (const entity of ir.entities) {
    emitRepositoryInterface(project, outDir, entity);
    emitInMemoryRepository(project, outDir, entity);

    if (dbProvider === "prisma") {
      emitPrismaRepository(project, outDir, entity);
    }

    emitBaseService(project, outDir, entity);
    emitUserService(project, outDir, entity);
    emitServiceTest(project, outDir, entity);
    emitController(project, outDir, entity, policies);
  }

  // package.json injection based on policies
  emitPackageJson(outDir, ir.appName, policies);
  emitTsConfig(outDir);
  emitHttpServer(project, outDir, ir, policies);
  emitOpenAPI(project, outDir, ir, policies);

}

export function emitBackend(ir: BackendTargetIR, outDir: string) {
  // We DO NOT clean the entire directory anymore because we want to preserve user files
  ensureDir(outDir);
  const policies = getBackendPolicies(ir);

  const project = new Project({
    useInMemoryFileSystem: false,
    manipulationSettings: {
      quoteKind: QuoteKind.Double,
      indentationText: IndentationText.TwoSpaces,
    },
    compilerOptions: { target: ScriptTarget.ES2022 },
  });

  emitBackendToProject(project, outDir, ir);
  project.saveSync();

  // optional project-level formatting based on policy (default: prettier)
  try {
    formatDirectory(outDir, policies.formatter);
  } catch (e) {
    // ignore format failures
  }
}

// Register the backend emitter with the emitter engine
try {
  emitterEngine.registerEmitter("backend-tsmorph", async (ir: BackendTargetIR, outDir: string) => {
    const project = new Project({
      useInMemoryFileSystem: false,
      manipulationSettings: {
        quoteKind: QuoteKind.Double,
        indentationText: IndentationText.TwoSpaces,
      },
      compilerOptions: { target: ScriptTarget.ES2022 },
    });

    // Strategy: We rely on overwrite for base artifacts.
    // cleanDir(outDir); // DISABLE FULL CLEAN

    emitBackendToProject(project, outDir, ir);
    project.saveSync();

    // apply the chosen formatter to the output directory
    try { formatDirectory(outDir, getBackendPolicies(ir)?.formatter); } catch (e) { /* ignore */ }
  }, { force: true });

  // register default target -> emitter mapping
  try {
    const { registerTargetEmitter } = await import("../registry.js");
    registerTargetEmitter("backend", "backend-tsmorph", { force: true });
  } catch (e) {
    // ignore
  }
} catch (e) {
  // ignore double-registration in test runs
}



function emitOpenAPI(project: Project, outDir: string, ir: BackendTargetIR, policies?: any) {
  const rest = policies?.interfaces?.rest ?? { enabled: true, basePath: "/api", openapi: { enabled: true, title: "API", version: "1.0.0" } };
  if (!rest.enabled || rest.openapi?.enabled === false) return;

  const basePath = rest.basePath ?? "/api";
  const envelopeKeys = policies?.envelope?.keys ?? { data: "data", meta: "meta", error: "error" };
  const metaKeys = policies?.envelope?.meta ?? { requestIdKey: "requestId" };

  const componentsSchemas: Record<string, any> = {};
  function mapType(t: string | undefined): any {
    if (!t) return { type: "string" };
    const lower = t.toLowerCase();
    if (lower.endsWith("[]")) return { type: "array", items: mapType(t.slice(0, -2)) };
    if (["string", "uuid"].includes(lower)) return { type: "string" };
    if (["number", "int", "integer", "float", "double"].includes(lower)) return { type: "number" };
    if (["boolean", "bool"].includes(lower)) return { type: "boolean" };
    return { type: "string" };
  }

  ir.entities.forEach((entity) => {
    const props: Record<string, any> = {};
    if (entity.model) {
      Object.entries(entity.model).forEach(([k, v]) => {
        props[k] = mapType(v);
      });
    }
    componentsSchemas[entity.name] = {
      type: "object",
      properties: props,
    };
  });

  const paths: Record<string, any> = {};

  ir.entities.forEach((entity) => {
    const resource = entity.name.toLowerCase();
    const entityRef = { $ref: `#/components/schemas/${entity.name}` };

    const listOp = entity.operations.find((o) => o.kind === "LIST");
    if (listOp) {
      paths[`${basePath}/${resource}`] = {
        get: {
          summary: `List ${entity.name}`,
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1 } },
          ],
          responses: {
            200: {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      [envelopeKeys.data]: { type: "array", items: entityRef },
                      [envelopeKeys.meta]: {
                        type: "object",
                        properties: {
                          [metaKeys.requestIdKey]: { type: "string" },
                          page: { type: "integer" },
                          limit: { type: "integer" },
                          total: { type: "integer" },
                          hasNext: { type: "boolean" },
                        },
                      },
                      [envelopeKeys.error]: { nullable: true },
                    },
                  },
                },
              },
            },
          },
        },
      };
    }

    const createOp = entity.operations.find((o) => o.kind === "CREATE");
    if (createOp) {
      paths[`${basePath}/${resource}`] = {
        ...(paths[`${basePath}/${resource}`] ?? {}),
        post: {
          summary: `Create ${entity.name}`,
          requestBody: {
            required: true,
            content: { "application/json": { schema: entityRef } },
          },
          responses: {
            201: {
              description: "Created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      [envelopeKeys.data]: entityRef,
                      [envelopeKeys.meta]: { type: "object", properties: { [metaKeys.requestIdKey]: { type: "string" } } },
                      [envelopeKeys.error]: { nullable: true },
                    },
                  },
                },
              },
            },
          },
        },
      };
    }

    const getOp = entity.operations.find((o) => o.kind === "GET");
    if (getOp) {
      paths[`${basePath}/${resource}/{id}`] = {
        ...(paths[`${basePath}/${resource}/{id}`] ?? {}),
        get: {
          summary: `Get ${entity.name} by id`,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      [envelopeKeys.data]: entityRef,
                      [envelopeKeys.meta]: { type: "object", properties: { [metaKeys.requestIdKey]: { type: "string" } } },
                      [envelopeKeys.error]: { nullable: true },
                    },
                  },
                },
              },
            },
            404: { description: "Not found" },
          },
        },
      };
    }

    const updateOp = entity.operations.find((o) => o.kind === "UPDATE");
    if (updateOp) {
      paths[`${basePath}/${resource}/{id}`] = {
        ...(paths[`${basePath}/${resource}/{id}`] ?? {}),
        patch: {
          summary: `Update ${entity.name}`,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: entityRef } },
          },
          responses: {
            200: {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      [envelopeKeys.data]: entityRef,
                      [envelopeKeys.meta]: { type: "object", properties: { [metaKeys.requestIdKey]: { type: "string" } } },
                      [envelopeKeys.error]: { nullable: true },
                    },
                  },
                },
              },
            },
            404: { description: "Not found" },
          },
        },
      };
    }

    const deleteOp = entity.operations.find((o) => o.kind === "REMOVE");
    if (deleteOp) {
      paths[`${basePath}/${resource}/{id}`] = {
        ...(paths[`${basePath}/${resource}/{id}`] ?? {}),
        delete: {
          summary: `Delete ${entity.name}`,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Deleted" },
            404: { description: "Not found" },
          },
        },
      };
    }
  });

  const securitySchemes: Record<string, any> = {};
  const security: any[] = [];
  if (policies?.auth?.jwt?.enabled) {
    securitySchemes["bearerAuth"] = { type: "http", scheme: "bearer", bearerFormat: "JWT" };
    security.push({ bearerAuth: [] });
  }

  const spec: any = {
    openapi: "3.0.3",
    info: {
      title: rest.openapi?.title ?? "API",
      version: rest.openapi?.version ?? "1.0.0",
    },
    servers: rest.openapi?.serverUrl ? [{ url: rest.openapi.serverUrl }] : [],
    paths,
    components: {
      schemas: componentsSchemas,
      securitySchemes,
    },
  };

  if (security.length > 0) spec.security = security;

  project.createSourceFile(path.join(outDir, "openapi.json"), JSON.stringify(spec, null, 2), { overwrite: true });
}

function emitModels(project: Project, outDir: string, entities: BackendEntity[]) {
  const sf = project.createSourceFile(path.join(outDir, "lib", "models.ts"), "", { overwrite: true });

  sf.addStatements([`// Generated: model interfaces`]);

  for (const e of entities) {
    if (e.model && Object.keys(e.model).length > 0) {
      const iface = sf.addInterface({
        name: e.name,
        isExported: true,
      });

      for (const [k, t] of Object.entries(e.model)) {
        iface.addProperty({ name: k, type: t });
      }
    } else {
      sf.addStatements([`export type ${e.name} = Record<string, any>;`]);
    }

    sf.addStatements(["", ""]);
  }
}

function emitRepositoryInterface(project: Project, outDir: string, entity: BackendEntity) {
  const fileName = `${entity.name.toLowerCase()}.repository.ts`;
  // Place interface in lib/repositories or similar
  ensureDir(path.join(outDir, "lib", "repositories"));
  const sf = project.createSourceFile(path.join(outDir, "lib", "repositories", fileName), "", { overwrite: true });

  const modelType = entity.model ? entity.name : "any";
  if (entity.model) {
    sf.addImportDeclaration({ moduleSpecifier: `../models`, namedImports: [entity.name] });
  }

  const iface = sf.addInterface({
    name: `I${entity.name}Repository`,
    isExported: true,
  });

  // Standard CRUD signature
  iface.addMethod({ name: "create", parameters: [{ name: "data", type: modelType }], returnType: `Promise<${modelType}>` });
  iface.addMethod({ name: "findById", parameters: [{ name: "id", type: "string" }], returnType: `Promise<${modelType} | null>` });
  iface.addMethod({ name: "list", parameters: [], returnType: `Promise<${modelType}[]>` });
  iface.addMethod({ name: "update", parameters: [{ name: "id", type: "string" }, { name: "data", type: `Partial<${modelType}>` }], returnType: `Promise<${modelType} | null>` });
  iface.addMethod({ name: "delete", parameters: [{ name: "id", type: "string" }], returnType: `Promise<boolean>` });
}

function emitInMemoryRepository(project: Project, outDir: string, entity: BackendEntity) {
  const fileName = `${entity.name.toLowerCase()}.memory-repository.ts`;
  // Place adapter in generated/base/repositories
  ensureDir(path.join(outDir, "base", "repositories"));

  const sf = project.createSourceFile(path.join(outDir, "base", "repositories", fileName), "", { overwrite: true });

  const modelType = entity.model ? entity.name : "Record<string, any>";
  sf.addImportDeclaration({ moduleSpecifier: `../../lib/repositories/${entity.name.toLowerCase()}.repository`, namedImports: [`I${entity.name}Repository`] });
  if (entity.model) {
    sf.addImportDeclaration({ moduleSpecifier: `../../lib/models`, namedImports: [entity.name] });
  }
  sf.addImportDeclaration({ moduleSpecifier: `../../lib/id`, namedImports: ["newId"] });

  const cls = sf.addClass({
    name: `InMemory${entity.name}Repository`,
    isExported: true,
    implements: [`I${entity.name}Repository`],
  });

  cls.addProperty({
    name: "store",
    type: `Map<string, ${modelType}>`,
    initializer: "new Map()",
    scope: Scope.Private,
  });

  // IMPLEMENTATION
  // create
  cls.addMethod({
    name: "create",
    isAsync: true,
    parameters: [{ name: "data", type: modelType }],
    returnType: `Promise<${modelType}>`,
    statements: [
      `const id = newId();`,
      // rough logic depending on if data already has id
      `const row = { ...data, id } as any;`,
      `this.store.set(id, row);`,
      `return row;`
    ]
  });

  // findById
  cls.addMethod({
    name: "findById",
    isAsync: true,
    parameters: [{ name: "id", type: "string" }],
    returnType: `Promise<${modelType} | null>`,
    statements: [`return this.store.get(id) ?? null;`]
  });

  // list
  cls.addMethod({
    name: "list",
    isAsync: true,
    parameters: [],
    returnType: `Promise<${modelType}[]>`,
    statements: [`return Array.from(this.store.values());`]
  });

  // update
  cls.addMethod({
    name: "update",
    isAsync: true,
    parameters: [{ name: "id", type: "string" }, { name: "data", type: `Partial<${modelType}>` }],
    returnType: `Promise<${modelType} | null>`,
    statements: [
      `const existing = this.store.get(id);`,
      `if (!existing) return null;`,
      `const updated = { ...existing, ...data } as any;`,
      `this.store.set(id, updated);`,
      `return updated;`
    ]
  });

  // delete
  cls.addMethod({
    name: "delete",
    isAsync: true,
    parameters: [{ name: "id", type: "string" }],
    returnType: `Promise<boolean>`,
    statements: [`return this.store.delete(id);`]
  });
}

function emitPrismaSchema(outDir: string, policies: any, entities?: BackendEntity[]) {
  // Generate schema.prisma
  const lines: string[] = [];

  // Datasource & Generator
  const provider = policies?.db?.provider === "prisma" ? "sqlite" : "sqlite"; // Default to sqlite for dev
  const url = policies?.db?.url ?? "file:./dev.db";

  lines.push(`datasource db {`);
  lines.push(`  provider = "${provider}"`);
  lines.push(`  url      = "${url}"`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`generator client {`);
  lines.push(`  provider = "prisma-client-js"`);
  lines.push(`}`);
  lines.push(``);

  for (const entity of entities ?? []) {
    lines.push(`model ${entity.name} {`);

    // Always assume ID
    lines.push(`  id String @id @default(uuid())`);

    if (entity.model) {
      for (const [key, type] of Object.entries(entity.model)) {
        if (key === "id") continue; // handled above

        let prismaType = "String";
        if (type === "number") prismaType = "Float"; // or Int, simplify for now
        if (type === "boolean") prismaType = "Boolean";
        // date?

        lines.push(`  ${key} ${prismaType}`);
      }
    }

    lines.push(`}`);
    lines.push(``);
  }

  const prismaDir = path.join(outDir, "prisma");
  ensureDir(prismaDir);
  fs.writeFileSync(path.join(prismaDir, "schema.prisma"), lines.join("\n"));
}

function emitPrismaRepository(project: Project, outDir: string, entity: BackendEntity) {
  const fileName = `${entity.name.toLowerCase()}.prisma-repository.ts`;
  // Place adapter in generated/base/repositories
  ensureDir(path.join(outDir, "base", "repositories"));

  const sf = project.createSourceFile(path.join(outDir, "base", "repositories", fileName), "", { overwrite: true });

  const modelType = entity.model ? entity.name : "any";
  sf.addImportDeclaration({ moduleSpecifier: `../../lib/repositories/${entity.name.toLowerCase()}.repository`, namedImports: [`I${entity.name}Repository`] });
  if (entity.model) {
    sf.addImportDeclaration({ moduleSpecifier: `../../lib/models`, namedImports: [entity.name] });
  }

  // Import Prisma Client (usually from a singleton or instantiated here)
  sf.addImportDeclaration({
    moduleSpecifier: "@prisma/client",
    namedImports: ["PrismaClient"]
  });

  const cls = sf.addClass({
    name: `Prisma${entity.name}Repository`,
    isExported: true,
    implements: [`I${entity.name}Repository`],
  });

  // For simplicity, instantiate client here. In real app, inject singleton.
  cls.addProperty({
    name: "prisma",
    initializer: "new PrismaClient()",
    scope: Scope.Private
  });

  // IMPLEMENTATION using Prisma Client
  // Prisma generates model accessor as camelCase of model name (e.g. Product -> product)
  const delegate = entity.name.charAt(0).toLowerCase() + entity.name.slice(1);

  // create
  cls.addMethod({
    name: "create",
    isAsync: true,
    parameters: [{ name: "data", type: modelType }],
    returnType: `Promise<${modelType}>`,
    statements: [
      // prisma create requires strictly matching data, we might need cast
      `return this.prisma.${delegate}.create({ data: data as any }) as any;`
    ]
  });

  // findById
  cls.addMethod({
    name: "findById",
    isAsync: true,
    parameters: [{ name: "id", type: "string" }],
    returnType: `Promise<${modelType} | null>`,
    statements: [`return this.prisma.${delegate}.findUnique({ where: { id } }) as any;`]
  });

  // list
  cls.addMethod({
    name: "list",
    isAsync: true,
    parameters: [],
    returnType: `Promise<${modelType}[]>`,
    statements: [`return this.prisma.${delegate}.findMany() as any;`]
  });

  // update
  cls.addMethod({
    name: "update",
    isAsync: true,
    parameters: [{ name: "id", type: "string" }, { name: "data", type: `Partial<${modelType}>` }],
    returnType: `Promise<${modelType} | null>`,
    statements: [
      `return this.prisma.${delegate}.update({ where: { id }, data: data as any }) as any;`
    ]
  });

  // delete
  cls.addMethod({
    name: "delete",
    isAsync: true,
    parameters: [{ name: "id", type: "string" }],
    returnType: `Promise<boolean>`,
    statements: [
      `try {`,
      `  await this.prisma.${delegate}.delete({ where: { id } });`,
      `  return true;`,
      `} catch { return false; }`
    ]
  });
}

function emitController(project: Project, outDir: string, entity: BackendEntity, policies?: any) {
  const fileName = `${entity.name.toLowerCase()}.controller.ts`;
  const sf = project.createSourceFile(path.join(outDir, "controllers", fileName), "", { overwrite: true });

  // Use relative sibling imports
  sf.addImportDeclaration({
    moduleSpecifier: `../services/${entity.name.toLowerCase()}.service`,
    namedImports: [`${entity.name}Service`],
  });

  // Decide which repo adapter to import
  const dbProvider = policies?.db?.provider;
  const isPrisma = dbProvider === "prisma";

  if (isPrisma) {
    sf.addImportDeclaration({
      moduleSpecifier: `../base/repositories/${entity.name.toLowerCase()}.prisma-repository`,
      namedImports: [`Prisma${entity.name}Repository`],
    });
  } else {
    sf.addImportDeclaration({
      moduleSpecifier: `../base/repositories/${entity.name.toLowerCase()}.memory-repository`,
      namedImports: [`InMemory${entity.name}Repository`],
    });
  }

  sf.addImportDeclaration({
    moduleSpecifier: `../lib/models`,
    namedImports: [entity.name],
  });

  const className = `${entity.name}Controller`;
  const cls = sf.addClass({ name: className, isExported: true });

  // Wiring: Create Repo -> Inject to Service
  const repoClass = isPrisma ? `Prisma${entity.name}Repository` : `InMemory${entity.name}Repository`;

  cls.addProperty({
    name: "service",
    scope: Scope.Private,
    type: `${entity.name}Service`,
    initializer: `new ${entity.name}Service(new ${repoClass}())`
  });

  for (const op of entity.operations) {
    // Note: Ops are now async because repo is async
    const returnType = entity.model ? entity.name : "any";

    if (op.kind === "CREATE") {
      cls.addMethod({
        name: op.methodName, isAsync: true,
        parameters: [{ name: "payload", type: entity.name }],
        returnType: `Promise<${returnType}>`,
        statements: [`return this.service.${op.methodName}(payload);`],
      });
    } else if (op.kind === "GET") {
      cls.addMethod({
        name: op.methodName, isAsync: true,
        parameters: [{ name: "id", type: "string" }],
        returnType: `Promise<${returnType} | null>`,
        statements: [`return this.service.${op.methodName}(id);`],
      });
    } else if (op.kind === "LIST") {
      cls.addMethod({
        name: op.methodName, isAsync: true,
        parameters: [],
        returnType: `Promise<${returnType}[]>`,
        statements: [`return this.service.${op.methodName}();`],
      });
    } else if (op.kind === "UPDATE") {
      cls.addMethod({
        name: op.methodName, isAsync: true,
        parameters: [
          { name: "id", type: "string" },
          { name: "payload", type: `Partial<${entity.name}>` },
        ],
        returnType: `Promise<${returnType} | null>`,
        statements: [`return this.service.${op.methodName}(id, payload);`],
      });
    } else if (op.kind === "REMOVE") {
      cls.addMethod({
        name: op.methodName, isAsync: true,
        parameters: [{ name: "id", type: "string" }],
        returnType: "Promise<boolean>",
        statements: [`return this.service.${op.methodName}(id);`],
      });
    }
  }
}

function emitBaseService(project: Project, outDir: string, entity: BackendEntity) {
  const fileName = `${entity.name.toLowerCase()}.service.base.ts`;
  // Ensure base directory exists
  ensureDir(path.join(outDir, "base", "services"));

  const sf = project.createSourceFile(path.join(outDir, "base", "services", fileName), "", { overwrite: true });

  const className = `Base${entity.name}Service`;

  const cls = sf.addClass({
    name: className,
    isExported: true,
    isAbstract: true,
  });

  // Import Repository Interface
  sf.addImportDeclaration({
    moduleSpecifier: `../../lib/repositories/${entity.name.toLowerCase()}.repository`,
    namedImports: [`I${entity.name}Repository`],
  });

  // import model type if available
  const modelType = entity.model ? entity.name : "any";
  if (entity.model) {
    sf.addImportDeclaration({ moduleSpecifier: "../../lib/models", namedImports: [entity.name] });
  }

  // Constructor Injection
  cls.addConstructor({
    parameters: [{ name: "repo", type: `I${entity.name}Repository`, scope: Scope.Protected }]
  });

  // LIFECYCLE HOOKS
  // Create
  cls.addMethod({
    name: "beforeCreate", scope: Scope.Protected, isAsync: true,
    parameters: [{ name: "data", type: modelType }],
    returnType: `Promise<${modelType}>`,
    statements: [`return data;`]
  });
  cls.addMethod({
    name: "afterCreate", scope: Scope.Protected, isAsync: true,
    parameters: [{ name: "result", type: modelType }],
    returnType: `Promise<void>`,
    statements: []
  });

  // Update
  cls.addMethod({
    name: "beforeUpdate", scope: Scope.Protected, isAsync: true,
    parameters: [{ name: "id", type: "string" }, { name: "data", type: `Partial<${modelType}>` }],
    returnType: `Promise<Partial<${modelType}>>`,
    statements: [`return data;`]
  });
  cls.addMethod({
    name: "afterUpdate", scope: Scope.Protected, isAsync: true,
    parameters: [{ name: "id", type: "string" }, { name: "result", type: modelType }],
    returnType: `Promise<void>`,
    statements: []
  });

  // Delete
  cls.addMethod({
    name: "beforeDelete", scope: Scope.Protected, isAsync: true,
    parameters: [{ name: "id", type: "string" }],
    returnType: `Promise<boolean>`,
    statements: [`return true;`]
  });
  cls.addMethod({
    name: "afterDelete", scope: Scope.Protected, isAsync: true,
    parameters: [{ name: "id", type: "string" }],
    returnType: `Promise<void>`,
    statements: []
  });


  for (const op of entity.operations) {
    if (op.kind === "CREATE") {
      cls.addMethod({
        name: op.methodName, isAsync: true,
        parameters: [{ name: "data", type: modelType }],
        returnType: `Promise<${modelType}>`,
        statements: [
          `const processed = await this.beforeCreate(data);`,
          `const result = await this.repo.create(processed);`,
          `await this.afterCreate(result);`,
          `return result;`,
        ],
      });
    } else if (op.kind === "GET") {
      cls.addMethod({
        name: op.methodName, isAsync: true,
        parameters: [{ name: "id", type: "string" }],
        returnType: `Promise<${modelType} | null>`,
        statements: [
          `return this.repo.findById(id);`,
        ],
      });
    } else if (op.kind === "LIST") {
      cls.addMethod({
        name: op.methodName, isAsync: true,
        parameters: [],
        returnType: `Promise<${modelType}[]>`,
        statements: [
          `return this.repo.list();`,
        ],
      });
    } else if (op.kind === "UPDATE") {
      cls.addMethod({
        name: op.methodName, isAsync: true,
        parameters: [
          { name: "id", type: "string" },
          { name: "data", type: `Partial<${modelType}>` },
        ],
        returnType: `Promise<${modelType} | null>`,
        statements: [
          `const processed = await this.beforeUpdate(id, data);`,
          `const result = await this.repo.update(id, processed);`,
          `if (result) { await this.afterUpdate(id, result); }`,
          `return result;`,
        ],
      });
    } else if (op.kind === "REMOVE") {
      cls.addMethod({
        name: op.methodName, isAsync: true,
        parameters: [{ name: "id", type: "string" }],
        returnType: "Promise<boolean>",
        statements: [
          `if (!(await this.beforeDelete(id))) return false;`,
          `const success = await this.repo.delete(id);`,
          `if (success) { await this.afterDelete(id); }`,
          `return success;`,
        ],
      });
    }
  }
}


function emitUserService(project: Project, outDir: string, entity: BackendEntity) {
  // Move user code to 'services' directory WITHIN the outDir
  // outDir is the root of the generated app.

  const userServiceDir = path.join(outDir, "services");
  ensureDir(userServiceDir);

  const fileName = `${entity.name.toLowerCase()}.service.ts`;
  const filePath = path.join(userServiceDir, fileName);

  // CRITICAL: Check if file exists. If so, DO NOT OVERWRITE.
  if (fs.existsSync(filePath)) {
    // If it exists, we assume user might have custom constructor.
    // However, since we changed the base class constructor signature (added repo),
    // the user class will inherit it. If the user overrides constructor, they need to update it.
    // For now, we assume simple extension.
    return;
  }

  const sf = project.createSourceFile(filePath, "", { overwrite: false });

  // Import Base Service from the generated directory
  // services/foo.service.ts -> ../base/services/foo.service.base.ts
  sf.addImportDeclaration({
    moduleSpecifier: `../base/services/${entity.name.toLowerCase()}.service.base`,
    namedImports: [`Base${entity.name}Service`],
  });

  const className = `${entity.name}Service`;

  const cls = sf.addClass({
    name: className,
    isExported: true,
    extends: `Base${entity.name}Service`,
  });

  // Helper comments
  cls.addJsDoc({
    description: `User Implementation of ${entity.name}Service.\nThis file is generated once and will not be overwritten.\nAdd your business logic here.`
  });
}

function emitServiceTest(project: Project, outDir: string, entity: BackendEntity) {
  const createOp = entity.operations.find(op => op.kind === "CREATE");
  if (!createOp) return; // skip test if no create operation

  const hasIdField = !!(entity.model && Object.prototype.hasOwnProperty.call(entity.model, "id"));
  const fileName = `${entity.name.toLowerCase()}.service.spec.ts`;
  // Place tests next to user services
  const userServiceDir = path.join(outDir, "services");
  ensureDir(userServiceDir);

  const sf = project.createSourceFile(path.join(userServiceDir, fileName), "", { overwrite: true });

  sf.addImportDeclaration({
    moduleSpecifier: "vitest",
    namedImports: ["describe", "it", "expect", "beforeEach"],
  });

  sf.addImportDeclaration({
    moduleSpecifier: `./${entity.name.toLowerCase()}.service`,
    namedImports: [`${entity.name}Service`],
  });

  // Import InMemory Repo to inject
  sf.addImportDeclaration({
    moduleSpecifier: `../base/repositories/${entity.name.toLowerCase()}.memory-repository`,
    namedImports: [`InMemory${entity.name}Repository`],
  });

  sf.addStatements([
    `describe("${entity.name}Service", () => {`,
    `  let service: ${entity.name}Service;`,
    `  let repo: InMemory${entity.name}Repository;`,
    ``,
    `  beforeEach(() => {`,
    `    repo = new InMemory${entity.name}Repository();`,
    `    service = new ${entity.name}Service(repo);`,
    `  });`,
    ``,
    `  it("should create a ${entity.name.toLowerCase()}", async () => {`,
    `    const data = { /* mock data */ } as any;`,
    `    const result = await service.${createOp.methodName}(data);`,
    `    expect(result).toBeDefined();`,
    ...(hasIdField ? [`    expect((result as any).id).toBeDefined();`] : []),
    `  });`,
    `});`
  ]);
}
