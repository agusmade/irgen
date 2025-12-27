import * as Icons from "lucide-react";

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
    <form className="space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6" onSubmit={onSubmit}>
      <div>
        <label className="block text-sm font-medium text-gray-700">ID</label>
        <div className="mt-1">
          <input className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" name="id" value={id} onChange={(e) => set_id(e.target.value)} type="text" placeholder="" />
        </div>
        {errors["id"] && <div className="mt-2 text-sm text-red-600">{errors["id"]}</div>}
      </div>
  
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <div className="mt-1">
          <input className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" name="name" value={name} onChange={(e) => set_name(e.target.value)} type="text" placeholder="" />
        </div>
        {errors["name"] && <div className="mt-2 text-sm text-red-600">{errors["name"]}</div>}
      </div>
  
      <div>
        <label className="block text-sm font-medium text-gray-700">Price</label>
        <div className="mt-1">
          <input className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" name="price" value={price} onChange={(e) => set_price(e.target.value)} type="number" placeholder="" />
        </div>
        {errors["price"] && <div className="mt-2 text-sm text-red-600">{errors["price"]}</div>}
      </div>
  
      <button className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" type="submit">Submit</button>
    </form>
  );
}
