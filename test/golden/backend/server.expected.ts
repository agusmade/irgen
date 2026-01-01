import express from "express";
import cors from "cors";
import { z } from "zod";
import { authMiddleware, isAuthEnabled } from "./lib/auth";
import { requestContextMiddleware } from "./lib/context";
import { ok, fail, withRequestId } from "./lib/response";
import { AppError, toAppError, errorMiddleware } from "./lib/errors";
import { validateBody, validateParams, validateQuery } from "./lib/validation";
import { parsePagination, sliceWithMeta } from "./lib/pagination";
import { UserController } from "./controllers/user.controller";
import { UserService } from "./services/user.service";
import { PostController } from "./controllers/post.controller";
import { PostService } from "./services/post.service";
import { CommentController } from "./controllers/comment.controller";
import { CommentService } from "./services/comment.service";
const app = express();
app.use(cors());
app.use(express.json());
app.use(requestContextMiddleware());
const BASE_PATH = "/api";
const publicRoutes = [];
const getRequestId = (req: any) =>
  req?.ctx?.requestId ?? (req.headers["x-request-id"] as string | undefined);
const idParamsSchema = z.object({ id: z.string().min(1) });
const UserSchema = z.object({
  email: z.string(),
  name: z.string(),
  isActive: z.boolean(),
});
const UserUpdateSchema = UserSchema.partial();
const PostSchema = z.object({
  title: z.string(),
  content: z.string(),
  published: z.boolean(),
  viewCount: z.number(),
  authorId: z.string(),
});
const PostUpdateSchema = PostSchema.partial();
const CommentSchema = z.object({
  text: z.string(),
  postId: z.string(),
  userId: z.string(),
});
const CommentUpdateSchema = CommentSchema.partial();
if (isAuthEnabled()) {
  app.use(BASE_PATH, authMiddleware(publicRoutes));
}
const userController = new UserController();
// Routes for User
app.post(
  `${BASE_PATH}/user`,
  validateBody(UserSchema),
  async (req, res, next) => {
    try {
      const result = await userController.createUser(req.body);
      const meta = withRequestId(null, getRequestId(req));
      res.status(201).json(ok(result, meta));
    } catch (err: any) {
      return next(toAppError(err, "BAD_REQUEST", 400));
    }
  }
);
app.get(
  `${BASE_PATH}/user/:id`,
  validateParams(idParamsSchema),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const result = await userController.getUser(id);
      const meta = withRequestId(null, getRequestId(req));
      if (!result) {
        throw new AppError("NOT_FOUND", 404, "User not found");
      }

      res.json(ok(result, meta));
    } catch (err: any) {
      return next(toAppError(err, "NOT_FOUND", 404));
    }
  }
);
app.patch(
  `${BASE_PATH}/user/:id`,
  validateParams(idParamsSchema),
  validateBody(UserUpdateSchema),
  async (req, res, next) => {
    try {
      const result = await userController.updateUser(req.params.id, req.body);
      const meta = withRequestId(null, getRequestId(req));
      if (!result) throw new AppError("NOT_FOUND", 404, "User not found");
      res.json(ok(result, meta));
    } catch (err: any) {
      return next(toAppError(err, "BAD_REQUEST", 400));
    }
  }
);
app.get(`${BASE_PATH}/user`, validateQuery(), async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const all = await userController.listUsers();
  const { items, meta: pageMeta } = sliceWithMeta(all, page, limit);
  const meta = withRequestId(pageMeta, getRequestId(req));
  res.json(ok(items, meta));
});
const postController = new PostController();
// Routes for Post
app.post(
  `${BASE_PATH}/post`,
  validateBody(PostSchema),
  async (req, res, next) => {
    try {
      const result = await postController.createPost(req.body);
      const meta = withRequestId(null, getRequestId(req));
      res.status(201).json(ok(result, meta));
    } catch (err: any) {
      return next(toAppError(err, "BAD_REQUEST", 400));
    }
  }
);
app.get(
  `${BASE_PATH}/post/:id`,
  validateParams(idParamsSchema),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const result = await postController.getPost(id);
      const meta = withRequestId(null, getRequestId(req));
      if (!result) {
        throw new AppError("NOT_FOUND", 404, "Post not found");
      }

      res.json(ok(result, meta));
    } catch (err: any) {
      return next(toAppError(err, "NOT_FOUND", 404));
    }
  }
);
app.get(`${BASE_PATH}/post`, validateQuery(), async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const all = await postController.listPosts();
  const { items, meta: pageMeta } = sliceWithMeta(all, page, limit);
  const meta = withRequestId(pageMeta, getRequestId(req));
  res.json(ok(items, meta));
});
app.patch(
  `${BASE_PATH}/post/:id`,
  validateParams(idParamsSchema),
  validateBody(PostUpdateSchema),
  async (req, res, next) => {
    try {
      const result = await postController.updatePost(req.params.id, req.body);
      const meta = withRequestId(null, getRequestId(req));
      if (!result) throw new AppError("NOT_FOUND", 404, "Post not found");
      res.json(ok(result, meta));
    } catch (err: any) {
      return next(toAppError(err, "BAD_REQUEST", 400));
    }
  }
);
app.delete(
  `${BASE_PATH}/post/:id`,
  validateParams(idParamsSchema),
  async (req, res, next) => {
    const success = await postController.removePost(req.params.id);
    if (!success) return next(new AppError("NOT_FOUND", 404, "Post not found"));
    const meta = withRequestId(null, getRequestId(req));
    res.json(ok(true, meta));
  }
);
const commentController = new CommentController();
// Routes for Comment
app.post(
  `${BASE_PATH}/comment`,
  validateBody(CommentSchema),
  async (req, res, next) => {
    try {
      const result = await commentController.createComment(req.body);
      const meta = withRequestId(null, getRequestId(req));
      res.status(201).json(ok(result, meta));
    } catch (err: any) {
      return next(toAppError(err, "BAD_REQUEST", 400));
    }
  }
);
app.get(`${BASE_PATH}/comment`, validateQuery(), async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const all = await commentController.listComments();
  const { items, meta: pageMeta } = sliceWithMeta(all, page, limit);
  const meta = withRequestId(pageMeta, getRequestId(req));
  res.json(ok(items, meta));
});
app.use(errorMiddleware);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Backend server listening on port", PORT);
});
