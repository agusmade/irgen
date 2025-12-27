import { ProductService } from "../services/product.service";
import { Product } from "../lib/models";

export class ProductController {
  private service: ProductService = new ProductService();
}
