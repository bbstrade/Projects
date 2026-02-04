import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: { taskId: v.id("tasks") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("subtasks")
            .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
            .collect();
    },
});

export const create = mutation({
    args: {
        taskId: v.id("tasks"),
        title: v.string(),
        description: v.optional(v.string()),
        assigneeId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db.insert("subtasks", {
            ...args,
            completed: false,
            checklist: [],
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("subtasks"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        assigneeId: v.optional(v.id("users")),
        completed: v.optional(v.boolean()),
        checklist: v.optional(v.array(v.object({
            text: v.string(),
            completed: v.boolean(),
        }))),
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        await ctx.db.patch(id, {
            ...fields,
            updatedAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("subtasks") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
