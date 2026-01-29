import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
    args: { taskId: v.id("tasks") },
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query("taskComments")
            .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
            .order("desc")
            .collect();

        const commentsWithUsers = await Promise.all(
            comments.map(async (comment) => {
                const user = await ctx.db.get(comment.userId);
                return {
                    ...comment,
                    userName: user?.name || "Анонимен",
                    userAvatar: user?.avatar,
                };
            })
        );

        return commentsWithUsers;
    },
});

export const create = mutation({
    args: {
        taskId: v.id("tasks"),
        userId: v.id("users"),
        content: v.string(),
        parentCommentId: v.optional(v.id("taskComments")),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const commentId = await ctx.db.insert("taskComments", {
            ...args,
            createdAt: now,
            updatedAt: now,
        });

        // Update task's updatedAt
        await ctx.db.patch(args.taskId, {
            updatedAt: now,
        });

        return commentId;
    },
});

export const remove = mutation({
    args: { id: v.id("taskComments") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
