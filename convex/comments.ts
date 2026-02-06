import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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

                // Resolve mentioned users
                const mentionedUsers = comment.mentions
                    ? await Promise.all(
                        comment.mentions.map(async (userId) => {
                            const u = await ctx.db.get(userId);
                            return u ? { _id: u._id, name: u.name, avatar: u.avatar } : null;
                        })
                    )
                    : [];

                return {
                    ...comment,
                    userName: user?.name || "Анонимен",
                    userAvatar: user?.avatar,
                    mentionedUsers: mentionedUsers.filter(Boolean),
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
        mentions: v.optional(v.array(v.id("users"))),
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
        const now = Date.now();
        const commentId = await ctx.db.insert("taskComments", {
            taskId: args.taskId,
            userId: args.userId,
            content: args.content,
            mentions: args.mentions,
            attachments: args.attachments,
            parentCommentId: args.parentCommentId,
            createdAt: now,
            updatedAt: now,
        });

        // Update task's updatedAt
        await ctx.db.patch(args.taskId, {
            updatedAt: now,
        });

        // Create notifications for mentioned users
        if (args.mentions && args.mentions.length > 0) {
            const task = await ctx.db.get(args.taskId);
            const author = await ctx.db.get(args.userId);

            for (const mentionedUserId of args.mentions) {
                if (mentionedUserId !== args.userId) { // Don't notify self
                    await ctx.db.insert("notifications", {
                        userId: mentionedUserId,
                        type: "mention",
                        title: "Споменат/а в коментар",
                        message: `${author?.name || "Някой"} ви спомена в коментар за задача "${task?.title || "Неизвестна"}"`,
                        link: `/tasks?id=${args.taskId}`,
                        read: false,
                        createdAt: now,
                    });
                }
            }
        }

        return commentId;
    },
});

export const update = mutation({
    args: {
        id: v.id("taskComments"),
        content: v.optional(v.string()),
        mentions: v.optional(v.array(v.id("users"))),
        attachments: v.optional(v.array(v.object({
            name: v.string(),
            url: v.string(),
            type: v.string(),
            size: v.number(),
            storageId: v.optional(v.id("_storage")),
            uploadedAt: v.number(),
        }))),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("taskComments") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// Helper to parse mentions from content
export const parseMentions = query({
    args: { content: v.string() },
    handler: async (ctx, args) => {
        // Find all @mentions in format @username or @[Name]
        const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
        const mentions: string[] = [];
        let match;

        while ((match = mentionRegex.exec(args.content)) !== null) {
            mentions.push(match[2]); // The user ID
        }

        return mentions;
    },
});

// Search users for mention autocomplete
export const searchUsersForMention = query({
    args: {
        query: v.string(),
        teamId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const searchQuery = (args.query || "").toLowerCase();

        // If teamId provided, only search within team  
        if (args.teamId) {
            const members = await ctx.db
                .query("teamMembers")
                .withIndex("by_team", (q) => q.eq("teamId", args.teamId!))
                .collect();

            const users = await Promise.all(
                members.map(m => ctx.db.get(m.userId))
            );

            return users
                .filter(u => u && (
                    u.name?.toLowerCase().includes(searchQuery) ||
                    u.email?.toLowerCase().includes(searchQuery)
                ))
                .slice(0, 10)
                .map(u => ({
                    _id: u!._id,
                    name: u!.name || u!.email || "Unknown",
                    avatar: u!.avatar,
                }));
        }

        // Otherwise search all users
        const allUsers = await ctx.db.query("users").collect();

        return allUsers
            .filter(u =>
                u.name?.toLowerCase().includes(searchQuery) ||
                u.email?.toLowerCase().includes(searchQuery)
            )
            .slice(0, 10)
            .map(u => ({
                _id: u._id,
                name: u.name || u.email || "Unknown",
                avatar: u.avatar,
            }));
    },
});
