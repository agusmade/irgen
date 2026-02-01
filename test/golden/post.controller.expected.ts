import { PostService } from "../services/post.service";
import { InMemoryPostRepository } from "../base/repositories/post.memory-repository";
import { Post } from "../lib/models";
import { logger } from "../lib/logger";

export class PostController {
  private service: PostService = new PostService(new InMemoryPostRepository());

  async createPost(payload: Post): Promise<Post> {
    logger.info("Controller.create Post");
    return this.service.createPost(payload);
  }

  async getPost(id: string): Promise<Post | null> {
    logger.info("Controller.find Post", { id });
    return this.service.getPost(id);
  }

  async listPosts(): Promise<Post[]> {
    logger.info("Controller.list Post");
    return this.service.listPosts();
  }

  async updatePost(id: string, payload: Partial<Post>): Promise<Post | null> {
    logger.info("Controller.update Post", { id });
    return this.service.updatePost(id, payload);
  }

  async removePost(id: string): Promise<boolean> {
    logger.info("Controller.delete Post", { id });
    return this.service.removePost(id);
  }
}
