import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Dashboard metrics query
 * Returns aggregate counts for projects, tasks, overdue items, and pending approvals
 */
export const dashboardMetrics = query({
    args: {
        teamId: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Get all projects (optionally filtered by team)
        let projectsQuery = ctx.db.query("projects");
        if (args.teamId) {
            projectsQuery = projectsQuery.filter((q) =>
                q.eq(q.field("teamId"), args.teamId)
            );
        }

        // We collect first then filter date in JS for simplicity/flexibility 
        // as Convex filters are strict equality or ranges on indexes
        let projects = await projectsQuery.collect();

        if (args.startDate) {
            projects = projects.filter(p => p._creationTime >= args.startDate!);
        }
        if (args.endDate) {
            projects = projects.filter(p => p._creationTime <= args.endDate!);
        }

        // Get all tasks
        let tasks = await ctx.db.query("tasks").collect();
        if (args.startDate) {
            tasks = tasks.filter(t => t._creationTime >= args.startDate!);
        }
        if (args.endDate) {
            tasks = tasks.filter(t => t._creationTime <= args.endDate!);
        }

        // Get all approvals
        let approvals = await ctx.db.query("approvals").collect();
        if (args.startDate) {
            approvals = approvals.filter(a => a._creationTime >= args.startDate!);
        }
        if (args.endDate) {
            approvals = approvals.filter(a => a._creationTime <= args.endDate!);
        }

        const now = Date.now();

        return {
            totalProjects: projects.length,
            activeProjects: projects.filter((p) => p.status === "active").length,
            completedProjects: projects.filter((p) => p.status === "completed").length,
            draftProjects: projects.filter((p) => p.status === "draft").length,

            totalTasks: tasks.length,
            completedTasks: tasks.filter((t) => t.status === "done").length,
            inProgressTasks: tasks.filter((t) => t.status === "in_progress").length,
            todoTasks: tasks.filter((t) => t.status === "todo").length,
            overdueTasks: tasks.filter(
                (t) => t.dueDate && t.dueDate < now && t.status !== "done"
            ).length,

            pendingApprovals: approvals.filter((a) => a.status === "pending").length,
            approvedApprovals: approvals.filter((a) => a.status === "approved").length,
            rejectedApprovals: approvals.filter((a) => a.status === "rejected").length,
        };
    },
});

/**
 * Get projects breakdown by status
 */
export const projectsByStatus = query({
    args: {
        teamId: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let projectsQuery = ctx.db.query("projects");
        if (args.teamId) {
            projectsQuery = projectsQuery.filter((q) =>
                q.eq(q.field("teamId"), args.teamId)
            );
        }
        let projects = await projectsQuery.collect();

        if (args.startDate) {
            projects = projects.filter(p => p._creationTime >= args.startDate!);
        }
        if (args.endDate) {
            projects = projects.filter(p => p._creationTime <= args.endDate!);
        }

        const statusCounts: Record<string, number> = {};
        for (const project of projects) {
            statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
        }

        return Object.entries(statusCounts).map(([status, count]) => ({
            name: status.replace("_", " "),
            value: count,
        }));
    },
});

/**
 * Get task completion trend (weekly data)
 */
export const taskCompletionTrend = query({
    args: {},
    handler: async (ctx) => {
        const tasks = await ctx.db.query("tasks").collect();
        const now = Date.now();
        const weekMs = 7 * 24 * 60 * 60 * 1000;

        // Last 4 weeks of data
        const weeks = [];
        for (let i = 3; i >= 0; i--) {
            const weekStart = now - (i + 1) * weekMs;
            const weekEnd = now - i * weekMs;

            const completedInWeek = tasks.filter(
                (t) =>
                    t.status === "done" &&
                    t.updatedAt &&
                    t.updatedAt >= weekStart &&
                    t.updatedAt < weekEnd
            ).length;

            const pendingInWeek = tasks.filter(
                (t) =>
                    t.status !== "done" &&
                    t._creationTime &&
                    t._creationTime >= weekStart &&
                    t._creationTime < weekEnd
            ).length;

            weeks.push({
                name: `Week ${4 - i}`,
                completed: completedInWeek,
                pending: pendingInWeek,
            });
        }

        return weeks;
    },
});
