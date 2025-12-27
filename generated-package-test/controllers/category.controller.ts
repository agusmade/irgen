import { CategoryService } from "../services/category.service";
import { Category } from "../lib/models";

export class CategoryController {
  private service: CategoryService = new CategoryService();

  createCategory(payload: Category): Category {
    return this.service.createCategory(payload);
  }

  getCategory(id: string): Category | null {
    return this.service.getCategory(id);
  }

  updateCategory(id: string, payload: Partial<Category>): Category | null {
    return this.service.updateCategory(id, payload);
  }

  removeCategory(id: string): boolean {
    return this.service.removeCategory(id);
  }

  listCategories(): Category[] {
    return this.service.listCategories();
  }
}
