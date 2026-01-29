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
        status: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        teamId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        let ownerId = undefined;

        if (identity) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                .unique();
            if (user) {
                ownerId = user._id;
            }
        }

        const status = args.status || "active"; // Default to active if not provided
        const now = Date.now();

        return await ctx.db.insert("projects", {
            ...args,
            status,
            ownerId,
            createdAt: now,
            updatedAt: now,
        });
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
