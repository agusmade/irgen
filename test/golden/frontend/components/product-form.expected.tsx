import React, { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { evalLogic, getByPath, isEmptyVal } from "../lib/logic";
import { useOperation, useResource } from "../lib/hooks";

export function ProductForm() {
  const [id, set_id] = useState("");
  const [name, set_name] = useState("");
  const [price, set_price] = useState("");
  const [errors, set_errors] = useState({} as Record<string,string>);
  const ctx = { id: id, name: name, price: price };
  const getFieldVal = (field: string) => getByPath(ctx, field.replace(/[^a-zA-Z0-9_]/g, "_"));
  const validate = () => {
    const n: Record<string,string> = {};
    // id validation
    if (!n["id"]) {
      if (isEmptyVal(id)) n["id"] = "ID is required";
    }
    // name validation
    if (!n["name"]) {
      if (isEmptyVal(name)) n["name"] = "Name is required";
    }
    // price validation
    if (!n["price"]) {
      if (isEmptyVal(price)) n["price"] = "Price is required";
    }
    if (!n["price"]) {
      if (Number(price) < 0) n["price"] = "Price must be >= 0";
    }
    set_errors(n);
    return Object.keys(n).length === 0;
  };
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitOp = useOperation("");
  const onSubmit = async (e: any) => { e.preventDefault(); setSubmitSuccess(null); setSubmitError(null);
    if (!validate()) return;
    const payload = { id: id, name: name, price: price };
    if (false) {
      const hookCtx = { ...ctx, payload };
      const shouldContinue = evalLogic(null, true, hookCtx);
      if (shouldContinue === false) { setSubmitError("Submission cancelled"); return; }
    }
    if (!false) { setSubmitSuccess("Saved (mock)"); return; }
    const res = await submitOp.execute(payload);
    if (res.ok) {
      setSubmitSuccess("Saved");
      const hookCtx = { ...ctx, payload, response: res.data };
    } else {
      setSubmitError(res.error?.message ?? "Submit error");
      const hookCtx = { ...ctx, payload, error: res.error };
    }
  };
  return (
    <form className="space-y-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none px-6 py-8 sm:rounded-2xl" onSubmit={onSubmit}>
      {(() => {
        const disabledVal = false;
        return (
      <div className="">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1.5">ID</label>
        </div>
        <div className="mt-1">
          <input className="mt-1 block w-full rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shadow-sm transition-all duration-200 focus:border-slate-900 dark:focus:border-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 sm:text-sm dark:text-slate-100 h-11" name="id" value={id} onChange={(e) => set_id(e.target.value)} type="text" placeholder="" disabled={disabledVal} />
        </div>
        {errors["id"] && <div className="mt-2 text-xs font-medium text-red-500 dark:text-red-400 flex items-center gap-1"><Icons.AlertCircle size={12}/> {errors["id"]}</div>}
      </div>
        );
      })()}
  
      {(() => {
        const disabledVal = false;
        return (
      <div className="">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1.5">Name</label>
        </div>
        <div className="mt-1">
          <input className="mt-1 block w-full rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shadow-sm transition-all duration-200 focus:border-slate-900 dark:focus:border-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 sm:text-sm dark:text-slate-100 h-11" name="name" value={name} onChange={(e) => set_name(e.target.value)} type="text" placeholder="" disabled={disabledVal} />
        </div>
        {errors["name"] && <div className="mt-2 text-xs font-medium text-red-500 dark:text-red-400 flex items-center gap-1"><Icons.AlertCircle size={12}/> {errors["name"]}</div>}
      </div>
        );
      })()}
  
      {(() => {
        const disabledVal = false;
        return (
      <div className="">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1.5">Price</label>
        </div>
        <div className="mt-1">
          <input className="mt-1 block w-full rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shadow-sm transition-all duration-200 focus:border-slate-900 dark:focus:border-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 sm:text-sm dark:text-slate-100 h-11" name="price" value={price} onChange={(e) => set_price(e.target.value)} type="number" placeholder="" disabled={disabledVal} />
        </div>
        {errors["price"] && <div className="mt-2 text-xs font-medium text-red-500 dark:text-red-400 flex items-center gap-1"><Icons.AlertCircle size={12}/> {errors["price"]}</div>}
      </div>
        );
      })()}
  
      {submitSuccess && <div className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">{submitSuccess}</div>}
      {submitError && <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">{submitError}</div>}
      <button className="inline-flex items-center justify-center rounded-lg border border-transparent py-2.5 px-5 text-sm font-semibold text-white shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 w-full shadow-lg" style={{ backgroundColor: "#4f46e5" }} type="submit" disabled={submitOp.loading}>
        {submitOp.loading ? (
          <span className="flex items-center gap-2">
            <Icons.Loader2 className="animate-spin" size={18} />
            Submitting...
          </span>
        ) : "Submit Application"}
      </button>
    </form>
  );
}
