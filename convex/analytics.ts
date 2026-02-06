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

/**
 * Get tasks breakdown by priority
 */
export const tasksByPriority = query({
    args: {
        teamId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let tasks = await ctx.db.query("tasks").collect();

        // If teamId filter, get project IDs for that team first
        if (args.teamId) {
            const teamProjects = await ctx.db
                .query("projects")
                .filter((q) => q.eq(q.field("teamId"), args.teamId))
                .collect();
            const projectIds = new Set(teamProjects.map((p) => p._id));
            tasks = tasks.filter((t) => projectIds.has(t.projectId));
        }

        const priorityCounts: Record<string, number> = {};
        for (const task of tasks) {
            priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
        }

        const colors: Record<string, string> = {
            low: "#94a3b8",
            medium: "#f59e0b",
            high: "#ef4444",
            critical: "#dc2626",
        };

        return Object.entries(priorityCounts).map(([priority, count]) => ({
            name: priority,
            value: count,
            fill: colors[priority] || "#8884d8",
        }));
    },
});

/**
 * Get team performance - tasks completed per user
 */
export const teamPerformance = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const tasks = await ctx.db.query("tasks").collect();
        const users = await ctx.db.query("users").collect();

        const completedByUser: Record<string, number> = {};
        const inProgressByUser: Record<string, number> = {};

        for (const task of tasks) {
            if (task.assigneeId) {
                const id = task.assigneeId;
                if (task.status === "done") {
                    completedByUser[id] = (completedByUser[id] || 0) + 1;
                } else if (task.status === "in_progress") {
                    inProgressByUser[id] = (inProgressByUser[id] || 0) + 1;
                }
            }
        }

        const userMap = new Map(users.map((u) => [u._id, u.name || u.email || "Unknown"]));

        const results = Object.keys(completedByUser).map((userId) => ({
            name: userMap.get(userId as any) || "Unknown",
            completed: completedByUser[userId] || 0,
            inProgress: inProgressByUser[userId] || 0,
        }));

        // Sort by completed desc and limit
        results.sort((a, b) => b.completed - a.completed);
        return args.limit ? results.slice(0, args.limit) : results;
    },
});

/**
 * Get recent activity from activity logs
 */
export const recentActivity = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 10;
        const logs = await ctx.db.query("activityLogs").order("desc").take(limit);
        const users = await ctx.db.query("users").collect();
        const userMap = new Map(users.map((u) => [u._id, u.name || u.email || "Unknown"]));

        return logs.map((log) => ({
            id: log._id,
            action: log.action,
            entityType: log.entityType,
            userName: userMap.get(log.userId) || "Unknown",
            createdAt: log.createdAt,
        }));
    },
});

/**
 * Get task workload per assignee
 */
export const tasksByAssignee = query({
    args: {},
    handler: async (ctx) => {
        const tasks = await ctx.db.query("tasks").collect();
        const users = await ctx.db.query("users").collect();

        const workload: Record<string, { total: number; todo: number; inProgress: number; done: number }> = {};

        for (const task of tasks) {
            if (task.assigneeId) {
                const id = task.assigneeId;
                if (!workload[id]) {
                    workload[id] = { total: 0, todo: 0, inProgress: 0, done: 0 };
                }
                workload[id].total++;
                if (task.status === "todo") workload[id].todo++;
                else if (task.status === "in_progress") workload[id].inProgress++;
                else if (task.status === "done") workload[id].done++;
            }
        }

        const userMap = new Map(users.map((u) => [u._id, u.name || u.email || "Unknown"]));

        return Object.entries(workload).map(([userId, data]) => ({
            name: userMap.get(userId as any) || "Unknown",
            ...data,
        }));
    },
});

/**
 * Get project timeline data
 */
export const projectTimeline = query({
    args: {},
    handler: async (ctx) => {
        const projects = await ctx.db.query("projects").collect();

        return projects
            .filter((p) => p.startDate || p.endDate)
            .map((p) => ({
                id: p._id,
                name: p.name,
                status: p.status,
                startDate: p.startDate || p._creationTime,
                endDate: p.endDate || Date.now(),
            }))
            .sort((a, b) => a.startDate - b.startDate);
    },
});

/**
 * Get file statistics
 */
export const fileStatistics = query({
    args: {},
    handler: async (ctx) => {
        const files = await ctx.db.query("files").collect();

        // Group by month
        const monthlyData: Record<string, { count: number; size: number }> = {};

        for (const file of files) {
            const date = new Date(file.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { count: 0, size: 0 };
            }
            monthlyData[monthKey].count++;
            monthlyData[monthKey].size += file.fileSize || 0;
        }

        // Last 6 months
        const sortedMonths = Object.keys(monthlyData).sort().slice(-6);

        return sortedMonths.map((month) => ({
            month,
            files: monthlyData[month].count,
            sizeMB: Math.round(monthlyData[month].size / (1024 * 1024) * 100) / 100,
        }));
    },
});
