import { CommentService } from "../services/comment.service";
import { InMemoryCommentRepository } from "../base/repositories/comment.memory-repository";
import { Comment } from "../lib/models";
import { logger } from "../lib/logger";

export class CommentController {
  private service: CommentService = new CommentService(
    new InMemoryCommentRepository()
  );

  async createComment(payload: Comment): Promise<Comment> {
    logger.info("Controller.create Comment");
    return this.service.createComment(payload);
  }

  async listComments(): Promise<Comment[]> {
    logger.info("Controller.list Comment");
    return this.service.listComments();
  }
}
