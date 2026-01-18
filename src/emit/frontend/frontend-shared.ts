import path from "node:path";
import type { Project } from "ts-morph";
import type { FrontendTargetIR } from "../../ir/target/frontend.js";
import { ensureDir } from "./frontend-helpers.js";

export function emitSharedLogic(project: Project, srcDir: string) {
  const libDir = path.join(srcDir, "lib");
  ensureDir(libDir);
  const filePath = path.join(libDir, "logic.ts");
  const sf = project.createSourceFile(filePath, "", { overwrite: true });

  sf.addStatements([
    `export const getByPath = (obj: any, path?: string) => { if (!path) return undefined; return path.split(".").reduce((acc, key) => (acc && typeof acc === "object") ? acc[key] : undefined, obj); };`,
    `export const isEmptyVal = (v: any): boolean => {
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object" && v !== null) { const vals = Object.values(v); return vals.length === 0 ? true : vals.every(isEmptyVal); }
  if (typeof v === "boolean") return !v;
  return (!v || v.toString().trim() === "");
};`,
    `export const evalLogic = (logic: any, fallback?: any, logicCtx: any = {}): any => {
  const evalNode = (node: any): any => {
    if (node === undefined || node === null) return undefined;
    if (typeof node === "string") {
      const trimmed = node.trim();
      try { const parsed = JSON.parse(trimmed); if (parsed && typeof parsed === "object") return evalNode(parsed); } catch (_) {}
      const match = trimmed.match(/^([A-Za-z0-9_\\.]+)\\s*(==|===|!=|!==|>=|<=|>|<)\\s*(.+)$/);
      if (match) {
        const [, lhsKey, opSym, rhsRaw] = match;
        const lhs = getByPath(logicCtx, lhsKey);
        let rhs: any = rhsRaw;
        if (rhsRaw === "true") rhs = true; else if (rhsRaw === "false") rhs = false; else if (!isNaN(Number(rhsRaw))) rhs = Number(rhsRaw); else rhs = rhsRaw.replace(/^['"]|['"]$/g, "");
        switch (opSym) {
          case "==": return lhs == rhs;
          case "===": return lhs === rhs;
          case "!=": return lhs != rhs;
          case "!==": return lhs !== rhs;
          case ">": return lhs > rhs;
          case "<": return lhs < rhs;
          case ">=": return lhs >= rhs;
          case "<=": return lhs <= rhs;
        }
      }
      return getByPath(logicCtx, trimmed) ?? trimmed;
    }
    if (Array.isArray(node)) return node.map(evalNode);
    if (typeof node !== "object") return node;
    const entries = Object.entries(node); if (entries.length === 0) return undefined;
    const [op, valRaw] = entries[0];
    const list = Array.isArray(valRaw) ? valRaw : [valRaw];
    const values = list.map(evalNode);
    switch (op) {
      case "var": return getByPath(logicCtx, values[0]);
      case "==": return values[0] == values[1];
      case "===": return values[0] === values[1];
      case "!=": return values[0] != values[1];
      case "!==": return values[0] !== values[1];
      case ">": return values[0] > values[1];
      case "<": return values[0] < values[1];
      case ">=": return values[0] >= values[1];
      case "<=": return values[0] <= values[1];
      case "and": return values.every(Boolean);
      case "or": return values.some(Boolean);
      case "!": return !values[0];
      case "!!": return !!values[0];
      case "if": return values[0] ? values[1] : values[2];
      case "in": return Array.isArray(values[1]) ? values[1].includes(values[0]) : false;
      case "+": return values.reduce((a,b) => (Number(a) || 0) + (Number(b) || 0), 0);
      case "-": return values.length === 1 ? -(Number(values[0]) || 0) : (Number(values[0]) || 0) - (Number(values[1]) || 0);
      case "*": return values.reduce((a,b) => (Number(a) || 0) * (Number(b) || 0), 1);
      case "/": return values.length === 1 ? (Number(values[0]) || 0) : (Number(values[1]) ? (Number(values[0]) || 0) / (Number(values[1]) || 1) : undefined);
      case "%": return values.length === 1 ? Number(values[0]) % 1 : (Number(values[0]) || 0) % (Number(values[1]) || 1);
      default: {
        const out: any = {};
        for (const [k, v] of entries) {
          out[k] = evalNode(v);
        }
        return out;
      }
    }
  };
  const res = evalNode(logic);
  return (typeof res === "undefined") ? fallback : res;
};`
  ]);
}

export function emitRequiredComponents(project: Project, srcDir: string, ir: FrontendTargetIR) {
  const libDir = path.join(srcDir, "lib");
  ensureDir(libDir);
  const filePath = path.join(libDir, "required-components.ts");
  const required = ir.requiredComponentKeys ?? [];
  const content = `export const requiredComponentKeys = ${JSON.stringify(required, null, 2)} as const;\n`;
  project.createSourceFile(filePath, content, { overwrite: true });
}
