import { CommentService } from "../services/comment.service";
import { PrismaCommentRepository } from "../base/repositories/comment.prisma-repository";
import { Comment } from "../lib/models";

export class CommentController {
  private service: CommentService = new CommentService(
    new PrismaCommentRepository()
  );

  async createComment(payload: Comment): Promise<Comment> {
    return this.service.createComment(payload);
  }

  async listComments(): Promise<Comment[]> {
    return this.service.listComments();
  }
}
