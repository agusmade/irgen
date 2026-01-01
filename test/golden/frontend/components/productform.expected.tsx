import React, { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { evalLogic, getByPath, isEmptyVal } from "../lib/logic";

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
      <button className="inline-flex justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ backgroundColor: "#4f46e5" }} type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</button>
    </form>
  );
}
