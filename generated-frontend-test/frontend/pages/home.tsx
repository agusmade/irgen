import React from "react";
import { useEffect, useState } from "react";
import { Header } from "../components/header";
import { ProductList } from "../components/productlist";

export function HomePage() {
  return (
    <div>
      <Header />
      <ProductList />
    </div>
  );
}
