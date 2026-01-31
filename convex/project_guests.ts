import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        const guests = await ctx.db
            .query("projectGuests")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect();

        // Enrich with user details if they exist in the system
        return await Promise.all(
            guests.map(async (g) => {
                let user = null;
                if (g.userId) {
                    user = await ctx.db.get(g.userId);
                }
                return { ...g, user };
            })
        );
    },
});

export const invite = mutation({
    args: {
        projectId: v.id("projects"),
        email: v.string(),
        permissions: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");

        // Check if already invited
        const existing = await ctx.db
            .query("projectGuests")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .filter((q) => q.eq(q.field("projectId"), args.projectId))
            .unique();

        if (existing) throw new Error("Guest already added to this project");

        // Check if email belongs to an existing user
        const existingUser = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", args.email))
            .unique();

        const now = Date.now();
        await ctx.db.insert("projectGuests", {
            projectId: args.projectId,
            email: args.email,
            userId: existingUser ? existingUser._id : undefined,
            permissions: args.permissions,
            status: "pending",
            invitedBy: user._id,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const updatePermissions = mutation({
    args: {
        id: v.id("projectGuests"),
        permissions: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        // TODO: Add permission check for the requester
        await ctx.db.patch(args.id, {
            permissions: args.permissions,
            updatedAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("projectGuests") },
    handler: async (ctx, args) => {
        // TODO: Add permission check for the requester
        await ctx.db.delete(args.id);
    },
});
