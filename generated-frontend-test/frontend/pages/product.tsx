import React from "react";
import { useEffect, useState } from "react";
import { ProductDetail } from "../components/productdetail";
import { ProductCard } from "../components/productcard";

export function ProductPage() {
  return (
    <div>
      <ProductDetail />
      <ProductCard />
    </div>
  );
}
