import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getStats = query({
    handler: async (ctx) => {
        const projects = await ctx.db.query("projects").collect();
        const tasks = await ctx.db.query("tasks").collect();
        const users = await ctx.db.query("users").collect();
        const approvals = await ctx.db.query("approvals").collect();

        const activeProjects = projects.filter(p => p.status === "active").length;
        const completedTasks = tasks.filter(t => t.status === "done").length;

        return {
            totalProjects: projects.length,
            activeProjects,
            totalTasks: tasks.length,
            completedTasks,
            totalUsers: users.length,
            totalApprovals: approvals.length,
            completionRate: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0
        };
    },
});

export const getLogs = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const logs = await ctx.db
            .query("activityLogs")
            .order("desc")
            .take(args.limit || 50);

        return await Promise.all(
            logs.map(async (log) => {
                const user = await ctx.db.get(log.userId);
                return {
                    ...log,
                    userName: user?.name || "Unknown User",
                    userAvatar: user?.avatar,
                };
            })
        );
    },
});

export const logActivity = mutation({
    args: {
        userId: v.id("users"),
        action: v.string(),
        entityType: v.string(),
        entityId: v.optional(v.string()),
        details: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("activityLogs", {
            ...args,
            createdAt: Date.now(),
        });
    },
});
