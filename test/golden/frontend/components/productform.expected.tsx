import React, { useEffect, useState } from "react";
import * as Icons from "lucide-react";

export function ProductForm() {
  const [id, set_id] = useState("");
  const [name, set_name] = useState("");
  const [price, set_price] = useState("");
  const [errors, set_errors] = useState({} as Record<string,string>);
  const ctx = { id: id, name: name, price: price };
  const getByPath = (obj: any, path?: string) => { if (!path) return undefined; return path.split(".").reduce((acc, key) => (acc && typeof acc === "object") ? acc[key] : undefined, obj); };
  const evalLogic = (logic: any, fallback?: any, logicCtx: any = ctx): any => {
    const evalNode = (node: any): any => {
      if (node === undefined || node === null) return undefined;
      if (typeof node === "string") {
        const trimmed = node.trim();
        try { const parsed = JSON.parse(trimmed); if (parsed && typeof parsed === "object") return evalNode(parsed); } catch (_) {}
        const match = trimmed.match(/^([A-Za-z0-9_\.]+)\s*(==|===|!=|!==|>=|<=|>|<)\s*(.+)$/);
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
        default: return undefined;
      }
    };
    const res = evalNode(logic);
    return (typeof res === "undefined") ? fallback : res;
  };
  const getFieldVal = (field: string) => getByPath(ctx, field.replace(/[^a-zA-Z0-9_]/g, "_"));
  const isEmptyVal = (v: any): boolean => {
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === "object" && v !== null) { const vals = Object.values(v); return vals.length === 0 ? true : vals.every(isEmptyVal); }
    if (typeof v === "boolean") return !v;
    return (!v || v.toString().trim() === "");
  };
  const validate = () => {
    const n: Record<string,string> = {};
    if (true) {
      const v = id;
      if (isEmptyVal(v)) n["id"] = "ID is required";
    }
    if (!n["id"] && undefined !== undefined) {
      const requiredDyn = evalLogic(undefined, false);
      if (requiredDyn) { const v = id; if (isEmptyVal(v)) n["id"] = "ID is required"; }
    }
    if (true) {
      const v = name;
      if (isEmptyVal(v)) n["name"] = "Name is required";
    }
    if (!n["name"] && undefined !== undefined) {
      const requiredDyn = evalLogic(undefined, false);
      if (requiredDyn) { const v = name; if (isEmptyVal(v)) n["name"] = "Name is required"; }
    }
    if (true) {
      const v = price;
      if (isEmptyVal(v)) n["price"] = "Price is required";
    }
    if (!n["price"] && undefined !== undefined) {
      const requiredDyn = evalLogic(undefined, false);
      if (requiredDyn) { const v = price; if (isEmptyVal(v)) n["price"] = "Price is required"; }
    }
    if (!n["price"] && Number(price) < 0) n["price"] = "Price must be >= 0";
    set_errors(n);
    return Object.keys(n).length === 0;
  };
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const onSubmit = async (e: any) => { e.preventDefault(); setSubmitSuccess(null); setSubmitError(null);
    if (!validate()) return;
    const payload = { id: id, name: name, price: price };
    if (false) {
      const hookCtx = { ...ctx, payload };
      const shouldContinue = evalLogic(null, true, hookCtx);
      if (shouldContinue === false) { setSubmitError("Submission cancelled"); return; }
    }
    if (!false) { setSubmitSuccess("Saved (mock)"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Submit failed");
      setSubmitSuccess("Saved");
      const hookCtx = { ...ctx, payload, response: await res.clone().json().catch(() => null) };
    } catch (err: any) {
      setSubmitError("Submit error");
      const hookCtx = { ...ctx, payload, error: err?.message ?? err };
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <form className="space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6" onSubmit={onSubmit}>
      {(() => {
        const disabledVal = false;
        return (
      <div className="">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-gray-700">ID</label>
        </div>
        <div className="mt-1">
          <input className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" name="id" value={id} onChange={(e) => set_id(e.target.value)} type="text" placeholder="" disabled={disabledVal} />
        </div>
        {errors["id"] && <div className="mt-2 text-sm text-red-600">{errors["id"]}</div>}
      </div>
        );
      })()}
  
      {(() => {
        const disabledVal = false;
        return (
      <div className="">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-gray-700">Name</label>
        </div>
        <div className="mt-1">
          <input className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" name="name" value={name} onChange={(e) => set_name(e.target.value)} type="text" placeholder="" disabled={disabledVal} />
        </div>
        {errors["name"] && <div className="mt-2 text-sm text-red-600">{errors["name"]}</div>}
      </div>
        );
      })()}
  
      {(() => {
        const disabledVal = false;
        return (
      <div className="">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-gray-700">Price</label>
        </div>
        <div className="mt-1">
          <input className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" name="price" value={price} onChange={(e) => set_price(e.target.value)} type="number" placeholder="" disabled={disabledVal} />
        </div>
        {errors["price"] && <div className="mt-2 text-sm text-red-600">{errors["price"]}</div>}
      </div>
        );
      })()}
  
      {submitSuccess && <div className="text-green-600 text-sm">{submitSuccess}</div>}
      {submitError && <div className="text-red-600 text-sm">{submitError}</div>}
      <button className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</button>
    </form>
  );
}
