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
            .withIndex("email", (q) => q.eq("email", args.email))
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
 * Search users by name or email
 */
export const search = query({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        if (!args.query) return [];

        // Simple search - in prod use Convex Search Indexes
        const users = await ctx.db.query("users").collect();
        const lowerQuery = args.query.toLowerCase();

        return users.filter(u =>
            (u.name && u.name.toLowerCase().includes(lowerQuery)) ||
            u.email.toLowerCase().includes(lowerQuery)
        ).slice(0, 5);
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
 * Switch current team
 */
export const switchTeam = mutation({
    args: { teamId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");

        // Verify membership
        const membership = await ctx.db
            .query("teamMembers")
            .withIndex("by_user_team", (q) => q.eq("userId", user._id).eq("teamId", args.teamId))
            .unique();

        // System admins can switch to any team even if not explicitly a member
        if (!membership && user.role !== "admin" && user.systemRole !== "superadmin") {
            throw new Error("You are not a member of this team");
        }

        await ctx.db.patch(user._id, {
            currentTeamId: args.teamId,
        });

        return { success: true };
    },
});

/**
 * Set superadmin role (Migration Tool)
 */
export const setSuperAdmin = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", args.email))
            .unique();

        if (!user) {
            throw new Error("User not found: " + args.email);
        }

        await ctx.db.patch(user._id, { systemRole: "superadmin" });
        return "Role updated to superadmin";
    },
});
