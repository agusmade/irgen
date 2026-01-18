import React from "react";
import { useEffect, useState } from "react";
import { Header } from "../components/header";
import { ProductList } from "../components/product-list";

export function HomePage() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
           <span>Section</span>
           <span className="w-6 h-px bg-slate-200 dark:bg-slate-800"></span>
           <span>Home</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-950 dark:text-white tracking-tight">Home</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-3xl">Manage your home assets and application state in this unified view.</p>
      </header>
      <div className="grid gap-12">
        <section className="relative shrink-0">
          <Header />
        </section>
        <section className="relative shrink-0">
          <ProductList />
        </section>
      </div>
    </div>
  );
}
