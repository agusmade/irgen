import fs from "node:fs";
import path from "node:path";

export function emitPackageJson(outDir: string, appName: string, policies?: any) {
  const pkg: any = {
    name: appName ? `${appName.toLowerCase()}-generated` : "generated-app",
    version: "0.1.0",
    private: true,
    // omit "type": "module" so Node treats transpiled output as CJS by default
    dependencies: {},
    devDependencies: {},
    scripts: {
      format: "prettier --write .",
      build: "tsc -p tsconfig.json",
    },
  };

  const gen = policies?.generateId ?? policies?.core?.generateId ?? "uuid_v4";
  if (gen === "uuid_v4") {
    pkg.dependencies.uuid = "^9.0.0";
  }

  const httpClient = policies?.httpClient ?? policies?.core?.httpClient ?? "fetch";
  if (httpClient === "axios") pkg.dependencies.axios = "^1.4.0";
  if (httpClient === "got") pkg.dependencies.got = "^12.0.0";

  const loggerImpl = policies?.loggerImpl ?? policies?.core?.loggerImpl;
  const logging = policies?.logging ?? { enabled: true, format: "json" };

  if (logging.enabled !== false || loggerImpl === "pino") {
    pkg.dependencies.pino = "^9.0.0";
    pkg.dependencies["pino-http"] = "^9.0.0";
    if (logging.format === "pretty") {
      pkg.devDependencies["pino-pretty"] = "^11.0.0";
    }
  } else if (loggerImpl === "winston") {
    pkg.dependencies.winston = "^3.0.0";
  }

  const health = policies?.health;
  if (health?.metrics?.enabled) {
    pkg.dependencies["prom-client"] = "^14.0.0";
  }

  const db = policies?.db ?? policies?.core?.db;
  if (db?.provider === "prisma") {
    pkg.dependencies["@prisma/client"] = "latest";
    pkg.devDependencies.prisma = "latest";
    pkg.scripts["db:generate"] = "prisma generate";
    pkg.scripts["db:push"] = "prisma db push";
  }

  pkg.dependencies.express = "^4.19.2";
  pkg.dependencies.jsonwebtoken = "^9.0.2";
  pkg.dependencies.cors = "^2.8.5";

  pkg.devDependencies.prettier = "^2.8.8";
  pkg.devDependencies.typescript = "^5.6.3";
  pkg.devDependencies.tsx = "^4.19.2";
  pkg.devDependencies["@types/express"] = "^4.17.21";
  pkg.devDependencies["@types/jsonwebtoken"] = "^9.0.6";
  pkg.scripts.start = "node dist/server.js";

  pkg.devDependencies.vitest = "^0.34.0";
  pkg.scripts.test = "vitest run";

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "package.json"), JSON.stringify(pkg, null, 2), "utf-8");
}

export function emitTsConfig(outDir: string) {
  const tsconfig = {
    compilerOptions: {
      target: "ES2020",
      module: "commonjs",
      moduleResolution: "node",
      outDir: "dist",
      rootDir: ".",
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      strict: false,
      skipLibCheck: true,
      types: ["node"],
    },
    include: ["**/*.ts"],
    exclude: ["node_modules", "dist"],
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "tsconfig.json"), JSON.stringify(tsconfig, null, 2), "utf-8");
}
