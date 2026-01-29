import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
    args: {
        projectId: v.id("projects"),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let q = ctx.db
            .query("tasks")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .filter((q) => q.eq(q.field("parentTaskId"), undefined));

        if (args.status) {
            q = q.filter((q) => q.eq(q.field("status"), args.status));
        }

        return await q.collect();
    },
});

export const listSubtasks = query({
    args: {
        parentTaskId: v.id("tasks"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("tasks")
            .filter((q) => q.eq(q.field("parentTaskId"), args.parentTaskId))
            .collect();
    },
});

export const listAll = query({
    args: {
        status: v.optional(v.string()),
        assigneeId: v.optional(v.id("users")),
        projectId: v.optional(v.id("projects")),
    },
    handler: async (ctx, args) => {
        let q = ctx.db.query("tasks").order("desc");

        if (args.status) {
            q = q.filter((q) => q.eq(q.field("status"), args.status));
        }

        if (args.assigneeId) {
            q = q.filter((q) => q.eq(q.field("assigneeId"), args.assigneeId));
        }

        if (args.projectId) {
            q = q.filter((q) => q.eq(q.field("projectId"), args.projectId));
        }

        return await q.collect();
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        projectId: v.id("projects"),
        priority: v.string(),
        status: v.string(),
        assigneeId: v.optional(v.id("users")),
        dueDate: v.optional(v.number()),
        estimatedHours: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
        parentTaskId: v.optional(v.id("tasks")),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db.insert("tasks", {
            ...args,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("tasks"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        priority: v.optional(v.string()),
        status: v.optional(v.string()),
        assigneeId: v.optional(v.id("users")),
        dueDate: v.optional(v.number()),
        estimatedHours: v.optional(v.number()),
        actualHours: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
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
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const get = query({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});
