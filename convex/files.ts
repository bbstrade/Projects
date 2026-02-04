import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

export const saveFile = mutation({
    args: {
        storageId: v.id("_storage"),
        fileName: v.string(),
        fileType: v.string(),
        fileSize: v.number(),
        projectId: v.optional(v.id("projects")),
        taskId: v.optional(v.id("tasks")),
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
        const fileId = await ctx.db.insert("files", {
            ...args,
            uploadedBy: user._id,
            createdAt: now,
        });

        // Add an activity log entry (for Phase 6)
        try {
            await ctx.db.insert("activityLogs" as any, {
                userId: user._id,
                action: "uploaded_file",
                entityType: "file",
                entityId: fileId,
                details: { fileName: args.fileName, taskId: args.taskId },
                createdAt: now,
            });
        } catch (e) {
            // Silently fail if activityLogs table doesn't exist yet
        }

        return fileId;
    },
});

export const listByTask = query({
    args: { taskId: v.id("tasks") },
    handler: async (ctx, args) => {
        const files = await ctx.db
            .query("files")
            .filter((q) => q.eq(q.field("taskId"), args.taskId))
            .collect();

        return await Promise.all(
            files.map(async (file) => ({
                ...file,
                url: await ctx.storage.getUrl(file.storageId),
            }))
        );
    },
});

export const remove = mutation({
    args: { fileId: v.id("files") },
    handler: async (ctx, args) => {
        const file = await ctx.db.get(args.fileId);
        if (!file) return;

        await ctx.storage.delete(file.storageId);
        await ctx.db.delete(args.fileId);
    },
});

// Get URL from storage ID (for avatars, attachments, etc.)
export const getStorageUrl = query({
    args: { storageId: v.string() },
    handler: async (ctx, args) => {
        try {
            // Try to get URL from storage ID
            const url = await ctx.storage.getUrl(args.storageId as any);
            return url;
        } catch {
            return null;
        }
    },
});

