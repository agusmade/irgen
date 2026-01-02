import React from "react";
import { useEffect, useState } from "react";
import { Header } from "../components/header";
import { ProductList } from "../components/productlist";

export function HomePage() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="border-b border-slate-200 dark:border-slate-800 pb-10">
        <div className="flex items-center gap-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-4">
           <div className="w-10 h-[1px] bg-slate-200 dark:bg-slate-800"></div>
           <span>Resource: Home</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-slate-950 dark:text-white tracking-tighter">Home</h1>
        <p className="mt-4 text-slate-500 dark:text-slate-400 text-lg max-w-3xl leading-relaxed font-medium">Manage your home assets and application state in this unified view.</p>
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
