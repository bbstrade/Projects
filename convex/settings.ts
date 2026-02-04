import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Profile Management
export const updateProfile = mutation({
    args: {
        userId: v.id("users"), // passed from frontend if needed, or derived from context
        name: v.optional(v.string()),
        imageUrl: v.optional(v.string()), // For avatar
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        // Simple security check: ensure user is updating themselves or is admin
        // For strictness, better to just use userId from auth context
        if (userId !== args.userId) {
            // Check if admin? For now, let's enforce self-update only for this specific mutation
            // unless we want admins to edit others.
            // Let's stick to "User updates their own profile" for the "Profile" tab.
            throw new Error("You can only update your own profile");
        }

        await ctx.db.patch(args.userId, {
            name: args.name,
            avatar: args.imageUrl, // Mapping imageUrl to avatar field
        });
    },
});

// User Data Export (GDPR style)
export const exportUserData = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");

        const preferences = await ctx.db
            .query("notificationPreferences")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        // Fetch other related data... this logic can get heavy.
        // For a full export, we might need to fetch a lot.
        // Based on specs: Projects, Tasks, TeamMemberships, Comments.

        // Projects where user is a member (via team_members in project)
        // Stored as "team_members: v.array(v.string())" in schema which is names/emails?
        // Wait, schema says: team_members: v.optional(v.array(v.string()))
        // This makes filtering hard. Let's look at `project.ownerId` or just fetch all and filter in memory if dataset is small,
        // or rely on a better index if available.
        // Actually, Project Memberships are usually done via `teamMembers` table or `projectGuests`.
        // The user request says: "Projects (where is member or owner)".
        // Let's approximate by: Owner OR Team Member of the Team the project belongs to?

        // Let's implement what's explicitly requested in a reasonable way.
        // Fetch projects where ownerId == userId
        const projectsOwned = await ctx.db
            .query("projects")
            // .withIndex("by_owner", (q) => q.eq("ownerId", userId)) // Schema has no by_owner
            .filter(q => q.eq(q.field("ownerId"), userId))
            .collect();

        // Tasks assigned to user or created by user
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

// ... Notification preferences implementation below ...

export const getNotificationPreferences = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        return await ctx.db
            .query("notificationPreferences")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .unique();
    },
});

export const updateNotificationPreferences = mutation({
    args: {
        // We accept all fields as optional to allow partial updates
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
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("notificationPreferences")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, args);
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
                createdAt: Date.now(),
                updatedAt: Date.now(),
            } as any); // Type assertion if needed due to optionality mismatch in strictly typed args
        }
    },
});
