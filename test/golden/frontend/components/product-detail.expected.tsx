import React from "react";
import * as Icons from "lucide-react";
import { evalLogic, getByPath, isEmptyVal } from "../lib/logic";
import { useOperation, useResource } from "../lib/hooks";

export function ProductDetail() {
  return (
    <div className="p-6 bg-white shadow rounded-lg">
      <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">ProductDetail</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Entity: Product</p>
    </div>
  );
}
