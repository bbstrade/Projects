import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: { taskId: v.id("tasks") },
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query("taskComments")
            .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
            .order("desc")
            .collect();

        return await Promise.all(
            comments.map(async (c) => {
                const user = await ctx.db.get(c.userId);
                return { ...c, user };
            })
        );
    },
});

export const create = mutation({
    args: {
        taskId: v.id("tasks"),
        content: v.string(),
        attachments: v.optional(v.array(v.object({
            name: v.string(),
            url: v.string(),
            type: v.string(),
            size: v.number(),
            storageId: v.optional(v.id("_storage")),
            uploadedAt: v.number(),
        }))),
        parentCommentId: v.optional(v.id("taskComments")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");

        const now = Date.now();
        return await ctx.db.insert("taskComments", {
            ...args,
            userId: user._id,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("taskComments"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        const comment = await ctx.db.get(args.id);
        if (!comment) throw new Error("Comment not found");

        // Only allow author to update
        if (!user || user._id !== comment.userId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.id, {
            content: args.content,
            updatedAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("taskComments") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        const comment = await ctx.db.get(args.id);
        if (!comment) throw new Error("Comment not found");

        // Only allow author or admin (TODO: check admin role) to delete
        if (!user || user._id !== comment.userId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.id);
    },
});
