import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper function to get the current user from auth context
async function getCurrentUser(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    let user = await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique();

    // Auto-create user if not exists (sync from better-auth)
    if (!user) {
        const now = Date.now();
        const userId = await ctx.db.insert("users", {
            name: identity.name || identity.email?.split("@")[0] || "User",
            email: identity.email,
            tokenIdentifier: identity.tokenIdentifier,
            role: "member",
            createdAt: now,
            updatedAt: now,
        });
        user = await ctx.db.get(userId);
    }

    return user;
}

// Profile Management
export const updateProfile = mutation({
    args: {
        userId: v.id("users"),
        name: v.optional(v.string()),
        imageUrl: v.optional(v.string()), // For avatar (storage ID or URL)
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);
        if (!currentUser) throw new Error("Unauthorized");

        // Simple security check: ensure user is updating themselves or is admin
        if (currentUser._id !== args.userId && currentUser.role !== "admin") {
            throw new Error("You can only update your own profile");
        }

        const updateData: any = { updatedAt: Date.now() };
        if (args.name !== undefined) updateData.name = args.name;
        if (args.imageUrl !== undefined) updateData.avatar = args.imageUrl;

        await ctx.db.patch(args.userId, updateData);
    },
});

// User Data Export (GDPR style)
export const exportUserData = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const userId = user._id;

        const preferences = await ctx.db
            .query("notificationPreferences")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        // Fetch projects where ownerId == userId
        const projectsOwned = await ctx.db
            .query("projects")
            .filter(q => q.eq(q.field("ownerId"), userId))
            .collect();

        // Tasks assigned to user
        const tasksAssigned = await ctx.db
            .query("tasks")
            .withIndex("by_assignee", (q) => q.eq("assigneeId", userId))
            .collect();

        // Comments
        const comments = await ctx.db
            .query("taskComments")
            .filter(q => q.eq(q.field("userId"), userId))
            .collect();

        return {
            user,
            preferences,
            projectsOwned,
            tasksAssigned,
            comments
        };
    },
});

// Notification preferences

export const getNotificationPreferences = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        return await ctx.db
            .query("notificationPreferences")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .unique();
    },
});

export const updateNotificationPreferences = mutation({
    args: {
        task_assigned: v.optional(v.boolean()),
        deadline_reminder: v.optional(v.boolean()),
        deadline_reminder_days: v.optional(v.number()),
        status_change: v.optional(v.boolean()),
        task_completed: v.optional(v.boolean()),
        priority_change: v.optional(v.boolean()),
        project_status_change: v.optional(v.boolean()),
        project_member_added: v.optional(v.boolean()),
        mention_in_comment: v.optional(v.boolean()),
        new_comment: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const userId = user._id;

        const existing = await ctx.db
            .query("notificationPreferences")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .unique();

        const now = Date.now();

        if (existing) {
            await ctx.db.patch(existing._id, { ...args, updatedAt: now });
        } else {
            // Create with defaults merged with args
            const defaults = {
                task_assigned: true,
                deadline_reminder: true,
                deadline_reminder_days: 1,
                status_change: true,
                task_completed: true,
                priority_change: true,
                project_status_change: true,
                project_member_added: true,
                mention_in_comment: true,
                new_comment: false,
            };

            await ctx.db.insert("notificationPreferences", {
                userId,
                ...defaults,
                ...args,
                createdAt: now,
                updatedAt: now,
            } as any);
        }
    },
});
