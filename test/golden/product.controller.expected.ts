import { ProductService } from "../services/product.service";
import { PrismaProductRepository } from "../base/repositories/product.prisma-repository";
import { Product } from "../lib/models";

export class ProductController {
  private service: ProductService = new ProductService(
    new PrismaProductRepository()
  );

  async createProduct(payload: Product): Promise<Product> {
    return this.service.createProduct(payload);
  }

  async getProduct(id: string): Promise<Product | null> {
    return this.service.getProduct(id);
  }

  async updateProduct(
    id: string,
    payload: Partial<Product>
  ): Promise<Product | null> {
    return this.service.updateProduct(id, payload);
  }

  async removeProduct(id: string): Promise<boolean> {
    return this.service.removeProduct(id);
  }

  async listProducts(): Promise<Product[]> {
    return this.service.listProducts();
  }
}
