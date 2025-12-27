import { app } from "../src/dsl/runtime";

app("BackendApp", (a) => {
    a.meta("description", "A backend-only example with Prisma and complex relationships");
    a.meta("db", { provider: "prisma", url: "file:./backend-dev.db" });

    // User Entity
    a.entity("User", (e) => {
        e.model({
            email: "string",
            name: "string",
            isActive: "boolean",
        });
        e.create("register");
        e.get("profile");
        e.update("updateProfile");
        e.list("listUsers");
    });

    // Post Entity
    a.entity("Post", (e) => {
        e.model({
            title: "string",
            content: "string",
            published: "boolean",
            viewCount: "number",
            authorId: "string", // simple relationship simulation
        });
        e.create("createPost");
        e.get("getPost");
        e.list("listPosts");
        e.update("updatePost");
        e.remove("deletePost");
    });

    // Comment Entity
    a.entity("Comment", (e) => {
        e.model({
            text: "string",
            postId: "string",
            userId: "string",
        });
        e.create("addComment");
        e.list("getComments");
    });
});
