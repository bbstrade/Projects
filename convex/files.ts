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
        uploadedBy: v.id("users"),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const fileId = await ctx.db.insert("files", {
            ...args,
            createdAt: now,
        });

        // Add an activity log entry (for Phase 6)
        // Note: activityLogs table will be added in schema next
        try {
            await ctx.db.insert("activityLogs" as any, {
                userId: args.uploadedBy,
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
