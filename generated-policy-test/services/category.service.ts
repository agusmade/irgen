import { newId } from "../lib/id";
import { Category } from "../lib/models";

export class CategoryService {
  private store: Map<string, any> = new Map();

  createCategory(data: Category): Category {
    const id = newId();
    const row = { ...data, id };
    this.store.set(id, row);
    return row;
  }

  getCategory(id: string): Category | null {
    return this.store.get(id) ?? null;
  }

  updateCategory(id: string, data: Partial<Category>): Category | null {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data };
    this.store.set(id, updated);
    return updated;
  }

  removeCategory(id: string): boolean {
    return this.store.delete(id);
  }

  listCategories(): Category[] {
    return Array.from(this.store.values());
  }
}
