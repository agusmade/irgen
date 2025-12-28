import { PostService } from "../services/post.service";
import { PrismaPostRepository } from "../base/repositories/post.prisma-repository";
import { Post } from "../lib/models";

export class PostController {
  private service: PostService = new PostService(new PrismaPostRepository());

  async createPost(payload: Post): Promise<Post> {
    return this.service.createPost(payload);
  }

  async getPost(id: string): Promise<Post | null> {
    return this.service.getPost(id);
  }

  async listPosts(): Promise<Post[]> {
    return this.service.listPosts();
  }

  async updatePost(id: string, payload: Partial<Post>): Promise<Post | null> {
    return this.service.updatePost(id, payload);
  }

  async removePost(id: string): Promise<boolean> {
    return this.service.removePost(id);
  }
}
