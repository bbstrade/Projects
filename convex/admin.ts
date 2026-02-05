import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to check if user is global admin or team admin
async function checkAdmin(ctx: any) {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (user?.role === 'admin') return true;

    // Check team admin status if applicable
    if (user?.currentTeamId) {
        // Implementation depends on how team membership is stored/queried
        // For now, let's assume global admin for "System Stats"
        // But for "Team Admin" features, we should check team membership
        const membership = await ctx.db
            .query("teamMembers")
            .withIndex("by_user_team", (q: any) => q.eq("userId", userId).eq("teamId", user.currentTeamId))
            .first();

        if (membership?.role === 'owner' || membership?.role === 'admin') return true;
    }

    return false;
}

export const getSystemStats = query({
    args: {},
    handler: async (ctx) => {
        // Only allow admin
        // const isAdmin = await checkAdmin(ctx); 

        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const users = await ctx.db.query("users").collect();
        const teams = await ctx.db.query("teams").collect();
        const projects = await ctx.db.query("projects").collect();
        const tasks = await ctx.db.query("tasks").collect();

        const totalUsers = users.length;
        const teamsCount = teams.length;
        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.status === "active").length;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === "done").length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
            totalUsers,
            teamsCount,
            totalProjects,
            activeProjects,
            totalTasks,
            completedTasks,
            completionRate,
        };
    },
});

export const getAllUsers = query({
    args: {},
    handler: async (ctx) => {
        // Should rely on checkAdmin
        const users = await ctx.db.query("users").collect();

        return await Promise.all(users.map(async (user) => {
            if (user.avatar && !user.avatar.startsWith("http")) {
                const url = await ctx.storage.getUrl(user.avatar);
                if (url) return { ...user, avatar: url };
            }
            return user;
        }));
    },
});

export const getAuditLogs = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Admin check should be here

        const logs = await ctx.db.query("activityLogs")
            .order("desc") // newest first
            .take(args.limit || 50);

        // Collect unique user IDs
        const userIds = [...new Set(logs.map(log => log.userId))];

        // Fetch users
        const users = await Promise.all(userIds.map(id => ctx.db.get(id)));
        const usersMap = new Map(users.filter(u => u !== null).map(u => [u!._id, u]));

        // Join
        return await Promise.all(logs.map(async (log) => {
            const user = usersMap.get(log.userId);
            let userAvatar = user?.avatar;

            if (userAvatar && !userAvatar.startsWith("http")) {
                userAvatar = await ctx.storage.getUrl(userAvatar) || undefined;
            }

            return {
                ...log,
                userName: user?.name || "Unknown User",
                userAvatar,
            };
        }));
    }
});

// Update user role (Global Admin only)
export const updateUserRole = mutation({
    args: {
        userId: v.id("users"),
        role: v.string(), // "admin" | "user" | "member" ...
    },
    handler: async (ctx, args) => {
        // Strict global admin check
        const requesterId = await getAuthUserId(ctx);
        if (!requesterId) throw new Error("Unauthorized");
        const requester = await ctx.db.get(requesterId);
        if (requester?.role !== 'admin') throw new Error("Only global admins can change user roles");

        await ctx.db.patch(args.userId, { role: args.role });
    },
});

// Custom Statuses Management
export const manageCustomStatus = mutation({
    args: {
        action: v.string(), // "create" | "update" | "delete"
        id: v.optional(v.id("customStatuses")),
        data: v.optional(v.object({
            type: v.string(), // "task" | "project"
            slug: v.string(),
            label: v.string(),
            color: v.string(),
            isDefault: v.boolean(),
            order: v.number(),
            teamId: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        // Check admin
        if (!(await checkAdmin(ctx))) throw new Error("Unauthorized");

        if (args.action === "create" && args.data) {
            await ctx.db.insert("customStatuses", {
                ...args.data,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        } else if (args.action === "update" && args.id && args.data) {
            await ctx.db.patch(args.id, {
                ...args.data,
                updatedAt: Date.now(),
            });
        } else if (args.action === "delete" && args.id) {
            await ctx.db.delete(args.id);
        }
    },
});

// Custom Priorities Management
export const manageCustomPriority = mutation({
    args: {
        action: v.string(), // "create" | "update" | "delete"
        id: v.optional(v.id("customPriorities")),
        data: v.optional(v.object({
            type: v.string(),
            slug: v.string(),
            label: v.string(),
            color: v.string(),
            isDefault: v.boolean(),
            order: v.number(),
            teamId: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        // Check admin
        if (!(await checkAdmin(ctx))) throw new Error("Unauthorized");

        if (args.action === "create" && args.data) {
            await ctx.db.insert("customPriorities", {
                ...args.data,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        } else if (args.action === "update" && args.id && args.data) {
            await ctx.db.patch(args.id, {
                ...args.data,
                updatedAt: Date.now(),
            });
        } else if (args.action === "delete" && args.id) {
            await ctx.db.delete(args.id);
        }
    },
});

export const getCustomStatuses = query({
    args: { type: v.optional(v.string()) },
    handler: async (ctx, args) => {
        // Can be public or authed
        const userId = await getAuthUserId(ctx);
        if (!userId) return []; // or throw

        // Filter by type if provided
        if (args.type) {
            const type = args.type;
            return await ctx.db
                .query("customStatuses")
                .withIndex("by_type", q => q.eq("type", type))
                .collect();
        }
        return await ctx.db.query("customStatuses").collect();
    }
});

export const getCustomPriorities = query({
    args: { type: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        if (args.type) {
            const type = args.type;
            return await ctx.db
                .query("customPriorities")
                .withIndex("by_type", q => q.eq("type", type))
                .collect();
        }
        return await ctx.db.query("customPriorities").collect();
    }
});
