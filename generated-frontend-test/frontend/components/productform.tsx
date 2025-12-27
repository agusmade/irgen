import React from "react";
import { useEffect, useState } from "react";

export function ProductForm() {
  const [id, set_id] = useState("");
  const [name, set_name] = useState("");
  const [price, set_price] = useState("");
  const [errors, set_errors] = useState({} as Record<string,string>);
  const validate = () => {
    const n: Record<string,string> = {};
    if (true) { if (!id || id.toString().trim() === "") n["id"] = "ID is required"; }
    if (true) { if (!name || name.toString().trim() === "") n["name"] = "Name is required"; }
    if (true) { if (!price || price.toString().trim() === "") n["price"] = "Price is required"; }
    if (!n["price"] && Number(price) < 0) n["price"] = "Price must be >= 0";
    set_errors(n);
    return Object.keys(n).length === 0;
  };
  const onSubmit = (e: any) => { e.preventDefault(); if (!validate()) return; /* submit stub */ };
  return (
    <form className="form" onSubmit={onSubmit}>
      <label>ID</label>
      <input name="id" value={id} onChange={(e) => set_id(e.target.value)} type="text" />
      {errors["id"] && <div className="error">{errors["id"]}</div>}
  
      <label>Name</label>
      <input name="name" value={name} onChange={(e) => set_name(e.target.value)} type="text" />
      {errors["name"] && <div className="error">{errors["name"]}</div>}
  
      <label>Price</label>
      <input name="price" value={price} onChange={(e) => set_price(e.target.value)} type="number" />
      {errors["price"] && <div className="error">{errors["price"]}</div>}
  
      <button type="submit">Submit</button>
    </form>
  );
}
