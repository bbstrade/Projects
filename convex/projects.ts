import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("projects").order("desc").collect();
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        priority: v.string(),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        teamId: v.string(), // We'll hardcode this or get from context for now
    },
    handler: async (ctx, args) => {
        const status = "active"; // Default status
        return await ctx.db.insert("projects", { ...args, status });
    },
});

export const update = mutation({
    args: {
        id: v.id("projects"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        priority: v.optional(v.string()),
        status: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        await ctx.db.patch(id, fields);
    },
});

export const remove = mutation({
    args: { id: v.id("projects") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
