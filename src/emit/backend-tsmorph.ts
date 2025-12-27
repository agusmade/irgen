import path from "node:path";
import fs from "node:fs";
import { Project, QuoteKind, IndentationText, ScriptTarget, Scope } from "ts-morph";
import type { BackendIR, BackendEntity } from "../ir/types.js";
import { emitFrontend } from "./frontend-react.js";
import { emitterEngine } from "./engine.js";
import { formatDirectory } from "./format.js";

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function cleanDir(p: string) {
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}

export function emitBackendToProject(project: Project, outDir: string, ir: BackendIR) {
  ensureDir(outDir);
  ensureDir(path.join(outDir, "lib"));
  ensureDir(path.join(outDir, "services"));
  ensureDir(path.join(outDir, "controllers"));

  // adapters
  emitIdAdapter(project, outDir, ir);
  emitLoggerAdapter(project, outDir, ir);
  emitHttpAdapter(project, outDir, ir);

  // Prisma support
  const dbProvider = ir.policies?.db?.provider;

  if (dbProvider === "prisma") {
    emitPrismaSchema(outDir, ir);
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
    emitController(project, outDir, entity, ir);
  }

  // package.json injection based on policies
  emitPackageJson(outDir, ir);

  // frontend emitter (React) — optional features controlled by `ir.policies.frontend`
  if (ir.policies?.frontend?.react) {
    // call emitFrontend synchronously (module imported above)
    try {
      emitFrontend(project, outDir, ir as any);
    } catch (err) {
      // ignore frontend emit failures to keep generator resilient
    }
  }
}

export function emitBackend(ir: BackendIR, outDir: string) {
  // We DO NOT clean the entire directory anymore because we want to preserve user files
  ensureDir(outDir);

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
    formatDirectory(outDir, ir?.policies?.formatter);
  } catch (e) {
    // ignore format failures
  }
}

// Register the backend emitter with the emitter engine
try {
  emitterEngine.registerEmitter("backend-tsmorph", async (ir: BackendIR, outDir: string) => {
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
    try { formatDirectory(outDir, ir?.policies?.formatter); } catch (e) { /* ignore */ }
  }, { force: true });

  // register default target -> emitter mapping
  try {
    const { registerTargetEmitter } = await import("./registry.js");
    registerTargetEmitter("backend", "backend-tsmorph", { force: true });
  } catch (e) {
    // ignore
  }
} catch (e) {
  // ignore double-registration in test runs
}


function emitIdAdapter(project: Project, outDir: string, ir?: any) {
  const sf = project.createSourceFile(path.join(outDir, "lib", "id.ts"), "", { overwrite: true });

  sf.addStatements([`// Generated: single point of truth for ID generation`]);

  const gen = ir?.policies?.generateId ?? "uuid_v4";

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

function emitLoggerAdapter(project: Project, outDir: string, ir?: any) {
  const impl = ir?.policies?.loggerImpl ?? "console";
  const sf = project.createSourceFile(path.join(outDir, "lib", "logger.ts"), "", { overwrite: true });

  sf.addStatements([`// Generated: logger adapter (${impl})`]);

  if (impl === "console") {
    sf.addStatements([
      `export const logger = {`,
      `  info: (...args: any[]) => console.info(...args),`,
      `  warn: (...args: any[]) => console.warn(...args),`,
      `  error: (...args: any[]) => console.error(...args),`,
      `  debug: (...args: any[]) => console.debug(...args),`,
      `};`,
      ``,
    ]);
  } else if (impl === "pino" || impl === "winston") {
    sf.addStatements([
      `// ${impl} adapter: please add ${impl} as a dependency in the generated project`,
      `export const logger = {`,
      `  info: (...args: any[]) => console.info("[logger:${impl}]", ...args),`,
      `  warn: (...args: any[]) => console.warn("[logger:${impl}]", ...args),`,
      `  error: (...args: any[]) => console.error("[logger:${impl}]", ...args),`,
      `  debug: (...args: any[]) => console.debug("[logger:${impl}]", ...args),`,
      `};`,
      ``,
    ]);
  } else {
    sf.addStatements([
      `export const logger = {`,
      `  info: (..._args: any[]) => { throw new Error("logger implementation not provided"); },`,
      `  warn: (..._args: any[]) => { throw new Error("logger implementation not provided"); },`,
      `  error: (..._args: any[]) => { throw new Error("logger implementation not provided"); },`,
      `  debug: (..._args: any[]) => { throw new Error("logger implementation not provided"); },`,
      `};`,
      ``,
    ]);
  }
}

function emitHttpAdapter(project: Project, outDir: string, ir?: any) {
  const impl = ir?.policies?.httpClient ?? "fetch";
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
  sf.addImportDeclaration({ moduleSpecifier: `../../../lib/repositories/${entity.name.toLowerCase()}.repository`, namedImports: [`I${entity.name}Repository`] });
  if (entity.model) {
    sf.addImportDeclaration({ moduleSpecifier: `../../../lib/models`, namedImports: [entity.name] });
  }
  sf.addImportDeclaration({ moduleSpecifier: `../../../lib/id`, namedImports: ["newId"] });

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

function emitPrismaSchema(outDir: string, ir: BackendIR) {
  // Generate schema.prisma
  const lines: string[] = [];

  // Datasource & Generator
  const provider = ir.policies?.db?.provider === "prisma" ? "sqlite" : "sqlite"; // Default to sqlite for dev
  const url = ir.policies?.db?.url ?? "file:./dev.db";

  lines.push(`datasource db {`);
  lines.push(`  provider = "${provider}"`);
  lines.push(`  url      = "${url}"`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`generator client {`);
  lines.push(`  provider = "prisma-client-js"`);
  lines.push(`}`);
  lines.push(``);

  for (const entity of ir.entities) {
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
  sf.addImportDeclaration({ moduleSpecifier: `../../../lib/repositories/${entity.name.toLowerCase()}.repository`, namedImports: [`I${entity.name}Repository`] });
  if (entity.model) {
    sf.addImportDeclaration({ moduleSpecifier: `../../../lib/models`, namedImports: [entity.name] });
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

function emitController(project: Project, outDir: string, entity: BackendEntity, ir?: BackendIR) {
  const fileName = `${entity.name.toLowerCase()}.controller.ts`;
  const sf = project.createSourceFile(path.join(outDir, "controllers", fileName), "", { overwrite: true });

  // Use relative sibling imports
  sf.addImportDeclaration({
    moduleSpecifier: `../services/${entity.name.toLowerCase()}.service`,
    namedImports: [`${entity.name}Service`],
  });

  // Decide which repo adapter to import
  const dbProvider = ir?.policies?.db?.provider;
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

function emitPackageJson(outDir: string, ir?: any) {
  const pkg: any = {
    name: (ir && ir.appName) ? `${ir.appName.toLowerCase()}-generated` : "generated-app",
    version: "0.1.0",
    private: true,
    type: "module",
    dependencies: {},
    devDependencies: {},
    scripts: {
      format: "prettier --write .",
      build: "tsc -p tsconfig.json"
    },
  };

  if ((ir?.policies?.generateId ?? "uuid_v4") === "uuid_v4") {
    pkg.dependencies.uuid = "^9.0.0";
  }

  const httpClient = ir?.policies?.httpClient ?? "fetch";
  if (httpClient === "axios") pkg.dependencies.axios = "^1.4.0";
  if (httpClient === "got") pkg.dependencies.got = "^12.0.0";

  const loggerImpl = ir?.policies?.loggerImpl ?? "console";
  if (loggerImpl === "pino") pkg.dependencies.pino = "^8.0.0";
  if (loggerImpl === "winston") pkg.dependencies.winston = "^4.0.0";

  // Prisma Support
  if (ir?.policies?.db?.provider === "prisma") {
    pkg.dependencies["@prisma/client"] = "latest";
    pkg.devDependencies.prisma = "latest";
    pkg.scripts["db:generate"] = "prisma generate";
    pkg.scripts["db:push"] = "prisma db push";
  }

  // frontend deps if frontend enabled
  const frontend = ir?.policies?.frontend;
  if (frontend) { // Add lucide-react if any frontend is enabled
    pkg.dependencies["lucide-react"] = "^0.263.1";
    pkg.dependencies["react-router-dom"] = "^6.14.0";
  }
  if (frontend?.react) {
    pkg.dependencies.react = "^18.2.0";
    pkg.dependencies["react-dom"] = "^18.2.0";
    pkg.devDependencies["@types/react"] = "^18.0.0";
    pkg.devDependencies["@types/react-dom"] = "^18.0.0";
  }
  if (frontend?.tailwind) {
    pkg.devDependencies.tailwindcss = "^3.5.0";
    pkg.scripts["build:css"] = "tailwindcss -i src/index.css -o dist/index.css --minify";
  }

  // dev toolchain
  pkg.devDependencies.prettier = "^2.8.8";
  pkg.devDependencies.typescript = "^5.6.3";
  pkg.devDependencies.tsx = "^4.19.2";

  // testing
  pkg.devDependencies.vitest = "^0.34.0";
  pkg.scripts.test = "vitest run";

  // tailwind
  pkg.devDependencies.tailwindcss = "^3.3.0";
  pkg.devDependencies.postcss = "^8.4.0";
  pkg.devDependencies.autoprefixer = "^10.4.0";
  pkg.devDependencies["@tailwindcss/forms"] = "^0.5.0";

  // use already-imported fs and path at top of file
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "package.json"), JSON.stringify(pkg, null, 2), "utf-8");
}

function emitServiceTest(project: Project, outDir: string, entity: BackendEntity) {
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
    `    const result = await service.create(data);`,
    `    expect(result).toBeDefined();`,
    `    expect(result.id).toBeDefined();`,
    `  });`,
    `});`
  ]);
}
