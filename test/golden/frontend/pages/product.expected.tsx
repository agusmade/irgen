import React from "react";
import { useEffect, useState } from "react";
import { ProductDetail } from "../components/productdetail";
import { ProductCard } from "../components/productcard";

export function ProductPage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Product</h1>
      <ProductDetail />
      <ProductCard />
    </div>
  );
}
