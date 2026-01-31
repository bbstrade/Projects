import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query("projectComments")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .order("desc")
            .collect();

        // Enrich with user details
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
        projectId: v.id("projects"),
        content: v.string(),
        parentCommentId: v.optional(v.id("projectComments")),
        files: v.optional(v.array(v.string())),
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
        await ctx.db.insert("projectComments", {
            projectId: args.projectId,
            userId: user._id,
            content: args.content,
            parentCommentId: args.parentCommentId,
            files: args.files,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const deleteComment = mutation({
    args: { id: v.id("projectComments") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");

        const comment = await ctx.db.get(args.id);
        if (!comment) throw new Error("Comment not found");

        // Allow deletion if user is author or has admin role (simplified check for now)
        // Ideally check project permissions here
        if (comment.userId !== user._id && user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.id);
    },
});
