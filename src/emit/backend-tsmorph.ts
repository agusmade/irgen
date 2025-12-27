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

  emitModels(project, outDir, ir.entities);

  for (const entity of ir.entities) {
    emitService(project, outDir, entity);
    emitController(project, outDir, entity);
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
  cleanDir(outDir);
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

    // clear output dir similar to previous behavior
    cleanDir(outDir);

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

function emitController(project: Project, outDir: string, entity: BackendEntity) {
  const fileName = `${entity.name.toLowerCase()}.controller.ts`;
  const sf = project.createSourceFile(path.join(outDir, "controllers", fileName), "", { overwrite: true });

  sf.addImportDeclaration({
    moduleSpecifier: `../services/${entity.name.toLowerCase()}.service`,
    namedImports: [`${entity.name}Service`],
  });

  sf.addImportDeclaration({
    moduleSpecifier: `../lib/models`,
    namedImports: [entity.name],
  });

  const className = `${entity.name}Controller`;

  const cls = sf.addClass({ name: className, isExported: true });

  // private service instance
  cls.addProperty({ name: "service", scope: Scope.Private, type: `${entity.name}Service`, initializer: `new ${entity.name}Service()` });

  for (const op of entity.operations) {
    if (op.kind === "CREATE") {
      cls.addMethod({
        name: op.methodName,
        parameters: [{ name: "payload", type: entity.name }],
        returnType: entity.name,
        statements: [`return this.service.${op.methodName}(payload);`],
      });
    } else if (op.kind === "GET") {
      cls.addMethod({
        name: op.methodName,
        parameters: [{ name: "id", type: "string" }],
        returnType: `${entity.name} | null`,
        statements: [`return this.service.${op.methodName}(id);`],
      });
    } else if (op.kind === "LIST") {
      cls.addMethod({
        name: op.methodName,
        parameters: [],
        returnType: `${entity.name}[]`,
        statements: [`return this.service.${op.methodName}();`],
      });
    } else if (op.kind === "UPDATE") {
      cls.addMethod({
        name: op.methodName,
        parameters: [
          { name: "id", type: "string" },
          { name: "payload", type: `Partial<${entity.name}>` },
        ],
        returnType: `${entity.name} | null`,
        statements: [`return this.service.${op.methodName}(id, payload);`],
      });
    } else if (op.kind === "REMOVE") {
      cls.addMethod({
        name: op.methodName,
        parameters: [{ name: "id", type: "string" }],
        returnType: "boolean",
        statements: [`return this.service.${op.methodName}(id);`],
      });
    }
  }
}

function emitService(project: Project, outDir: string, entity: BackendEntity) {
  const fileName = `${entity.name.toLowerCase()}.service.ts`;
  const sf = project.createSourceFile(path.join(outDir, "services", fileName), "", { overwrite: true });

  sf.addImportDeclaration({
    moduleSpecifier: "../lib/id",
    namedImports: ["newId"],
  });

  const className = `${entity.name}Service`;

  const cls = sf.addClass({
    name: className,
    isExported: true,
  });

  // contoh: in-memory store minimal
  cls.addProperty({
    name: "store",
    type: `Map<string, any>`,
    initializer: "new Map()",
    scope: Scope.Private,
  });

  // import model type if available
  if (entity.model) {
    sf.addImportDeclaration({ moduleSpecifier: "../lib/models", namedImports: [entity.name] });
  }

  for (const op of entity.operations) {
    if (op.kind === "CREATE") {
      cls.addMethod({
        name: op.methodName,
        parameters: [{ name: "data", type: entity.model ? entity.name : "Record<string, any>" }],
        returnType: entity.model ? entity.name : "any",
        statements: [
          `const id = newId();`,
          `const row = { ...data, id };`,
          `this.store.set(id, row);`,
          `return row;`,
        ],
      });
    } else if (op.kind === "GET") {
      cls.addMethod({
        name: op.methodName,
        parameters: [{ name: "id", type: "string" }],
        returnType: entity.model ? `${entity.name} | null` : "any | null",
        statements: [
          `return this.store.get(id) ?? null;`,
        ],
      });
    } else if (op.kind === "LIST") {
      cls.addMethod({
        name: op.methodName,
        parameters: [],
        returnType: entity.model ? `${entity.name}[]` : "any[]",
        statements: [
          `return Array.from(this.store.values());`,
        ],
      });
    } else if (op.kind === "UPDATE") {
      cls.addMethod({
        name: op.methodName,
        parameters: [
          { name: "id", type: "string" },
          { name: "data", type: entity.model ? `Partial<${entity.name}>` : "Record<string, any>" },
        ],
        returnType: entity.model ? `${entity.name} | null` : "any | null",
        statements: [
          `const existing = this.store.get(id);`,
          `if (!existing) return null;`,
          `const updated = { ...existing, ...data };`,
          `this.store.set(id, updated);`,
          `return updated;`,
        ],
      });
    } else if (op.kind === "REMOVE") {
      cls.addMethod({
        name: op.methodName,
        parameters: [{ name: "id", type: "string" }],
        returnType: "boolean",
        statements: [
          `return this.store.delete(id);`,
        ],
      });
    }
  }
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

  // frontend deps if frontend enabled
  const frontend = ir?.policies?.frontend;
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

  // use already-imported fs and path at top of file
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "package.json"), JSON.stringify(pkg, null, 2), "utf-8");
}
