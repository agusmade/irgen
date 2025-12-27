import { ProductService } from "../services/product.service";
import { Product } from "../lib/models";

export class ProductController {
  private service: ProductService = new ProductService();

  createProduct(payload: Product): Product {
    return this.service.createProduct(payload);
  }

  getProduct(id: string): Product | null {
    return this.service.getProduct(id);
  }

  updateProduct(id: string, payload: Partial<Product>): Product | null {
    return this.service.updateProduct(id, payload);
  }

  removeProduct(id: string): boolean {
    return this.service.removeProduct(id);
  }

  listProducts(): Product[] {
    return this.service.listProducts();
  }
}
