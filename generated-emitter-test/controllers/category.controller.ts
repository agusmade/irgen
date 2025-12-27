import { CategoryService } from "../services/category.service";
import { Category } from "../lib/models";

export class CategoryController {
  private service: CategoryService = new CategoryService();
}
