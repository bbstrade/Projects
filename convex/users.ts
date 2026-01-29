import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get user by ID
 */
export const get = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    },
});

/**
 * Get user by email
 */
export const getByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();
    },
});

/**
 * Get user by token identifier (for auth)
 */
export const getByToken = query({
    args: { tokenIdentifier: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
            .unique();
    },
});

/**
 * List all users
 */
export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("users").order("desc").collect();
    },
});

/**
 * Create a new user
 */
export const create = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        tokenIdentifier: v.string(),
        role: v.optional(v.string()),
        avatar: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db.insert("users", {
            name: args.name,
            email: args.email,
            tokenIdentifier: args.tokenIdentifier,
            role: args.role || "member",
            avatar: args.avatar,
            createdAt: now,
            updatedAt: now,
        });
    },
});

/**
 * Update user
 */
export const update = mutation({
    args: {
        userId: v.id("users"),
        name: v.optional(v.string()),
        avatar: v.optional(v.string()),
        role: v.optional(v.string()),
        currentTeamId: v.optional(v.string()),
        preferences: v.optional(
            v.object({
                theme: v.string(),
                notifications: v.boolean(),
                language: v.string(),
            })
        ),
    },
    handler: async (ctx, args) => {
        const { userId, ...fields } = args;
        await ctx.db.patch(userId, {
            ...fields,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Get current user (for auth context)
 */
export const me = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();
    },
});

/**
 * Get or create a default user for development (no auth)
 */
export const getOrCreateDefaultUser = mutation({
    args: {},
    handler: async (ctx) => {
        // Check if default user exists
        const defaultEmail = "dev@municipalbank.bg";
        const existing = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", defaultEmail))
            .first();

        if (existing) {
            return existing._id;
        }

        // Create default user
        const now = Date.now();
        const userId = await ctx.db.insert("users", {
            name: "Dev User",
            email: defaultEmail,
            tokenIdentifier: "dev-token",
            role: "admin",
            createdAt: now,
            updatedAt: now,
        });

        return userId;
    },
});
