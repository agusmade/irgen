import { newId } from "../lib/id";
import { Product } from "../lib/models";

export class ProductService {
  private store: Map<string, any> = new Map();

  createProduct(data: Product): Product {
    const id = newId();
    const row = { ...data, id };
    this.store.set(id, row);
    return row;
  }

  getProduct(id: string): Product | null {
    return this.store.get(id) ?? null;
  }

  updateProduct(id: string, data: Partial<Product>): Product | null {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data };
    this.store.set(id, updated);
    return updated;
  }

  removeProduct(id: string): boolean {
    return this.store.delete(id);
  }

  listProducts(): Product[] {
    return Array.from(this.store.values());
  }
}
