import React from "react";
import { useEffect, useState } from "react";
import { Header } from "../components/header";
import { ProductList } from "../components/productlist";

export function HomePage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Home</h1>
      <Header />
      <ProductList />
    </div>
  );
}
