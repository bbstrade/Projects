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

/**
 * Tasks over time - daily/weekly creation vs completion
 */
export const tasksOverTime = query({
    args: {
        period: v.optional(v.string()), // "daily" | "weekly" | "monthly"
        days: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const tasks = await ctx.db.query("tasks").collect();
        const period = args.period || "weekly";
        const days = args.days || 30;
        const now = Date.now();
        const startTime = now - days * 24 * 60 * 60 * 1000;

        const data: Record<string, { created: number; completed: number }> = {};

        for (const task of tasks) {
            if (task._creationTime >= startTime) {
                const date = new Date(task._creationTime);
                let key: string;
                if (period === "daily") {
                    key = date.toISOString().split("T")[0];
                } else if (period === "monthly") {
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                } else {
                    // weekly
                    const weekNum = Math.floor((now - task._creationTime) / (7 * 24 * 60 * 60 * 1000));
                    key = `Week ${Math.max(1, days / 7 - weekNum)}`;
                }
                if (!data[key]) data[key] = { created: 0, completed: 0 };
                data[key].created++;
            }

            if (task.status === "done" && task.updatedAt && task.updatedAt >= startTime) {
                const date = new Date(task.updatedAt);
                let key: string;
                if (period === "daily") {
                    key = date.toISOString().split("T")[0];
                } else if (period === "monthly") {
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                } else {
                    const weekNum = Math.floor((now - task.updatedAt) / (7 * 24 * 60 * 60 * 1000));
                    key = `Week ${Math.max(1, days / 7 - weekNum)}`;
                }
                if (!data[key]) data[key] = { created: 0, completed: 0 };
                data[key].completed++;
            }
        }

        return Object.entries(data)
            .map(([name, counts]) => ({ name, ...counts }))
            .sort((a, b) => a.name.localeCompare(b.name));
    },
});

/**
 * Projects over time - monthly creation trend
 */
export const projectsOverTime = query({
    args: { months: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const projects = await ctx.db.query("projects").collect();
        const months = args.months || 6;
        const now = new Date();

        const data: Record<string, { started: number; completed: number }> = {};

        // Initialize last N months
        for (let i = months - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            data[key] = { started: 0, completed: 0 };
        }

        for (const project of projects) {
            const date = new Date(project._creationTime);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            if (data[key]) {
                data[key].started++;
                if (project.status === "completed") {
                    data[key].completed++;
                }
            }
        }

        return Object.entries(data)
            .map(([month, counts]) => ({ month, ...counts }))
            .sort((a, b) => a.month.localeCompare(b.month));
    },
});

/**
 * Tasks by status - distribution pie
 */
export const tasksByStatus = query({
    args: { teamId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        let tasks = await ctx.db.query("tasks").collect();

        if (args.teamId) {
            const teamProjects = await ctx.db
                .query("projects")
                .filter((q) => q.eq(q.field("teamId"), args.teamId))
                .collect();
            const projectIds = new Set(teamProjects.map((p) => p._id));
            tasks = tasks.filter((t) => projectIds.has(t.projectId));
        }

        const statusCounts: Record<string, number> = {};
        for (const task of tasks) {
            statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
        }

        const colors: Record<string, string> = {
            todo: "#94a3b8",
            in_progress: "#3b82f6",
            in_review: "#8b5cf6",
            done: "#22c55e",
            blocked: "#ef4444",
        };

        const labels: Record<string, string> = {
            todo: "Предстои",
            in_progress: "В прогрес",
            in_review: "За преглед",
            done: "Завършено",
            blocked: "Блокирано",
        };

        return Object.entries(statusCounts).map(([status, count]) => ({
            name: labels[status] || status,
            value: count,
            fill: colors[status] || "#8884d8",
        }));
    },
});

/**
 * Overdue analysis - breakdown by project and assignee
 */
export const overdueAnalysis = query({
    args: {},
    handler: async (ctx) => {
        const tasks = await ctx.db.query("tasks").collect();
        const projects = await ctx.db.query("projects").collect();
        const users = await ctx.db.query("users").collect();
        const now = Date.now();

        const overdueTasks = tasks.filter(
            (t) => t.dueDate && t.dueDate < now && t.status !== "done"
        );

        const projectMap = new Map(projects.map((p) => [p._id, p.name]));
        const userMap = new Map(users.map((u) => [u._id, u.name || u.email || "Unknown"]));

        // By project
        const byProject: Record<string, number> = {};
        for (const task of overdueTasks) {
            const name = projectMap.get(task.projectId) || "Unknown";
            byProject[name] = (byProject[name] || 0) + 1;
        }

        // By assignee
        const byAssignee: Record<string, number> = {};
        for (const task of overdueTasks) {
            if (task.assigneeId) {
                const name = userMap.get(task.assigneeId) || "Неразпределени";
                byAssignee[name] = (byAssignee[name] || 0) + 1;
            } else {
                byAssignee["Неразпределени"] = (byAssignee["Неразпределени"] || 0) + 1;
            }
        }

        return {
            total: overdueTasks.length,
            byProject: Object.entries(byProject)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
            byAssignee: Object.entries(byAssignee)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
        };
    },
});

/**
 * Approval trend - speed and bottleneck analysis
 */
export const approvalTrend = query({
    args: {},
    handler: async (ctx) => {
        const approvals = await ctx.db.query("approvals").collect();

        // Average time to approve
        const completedApprovals = approvals.filter(
            (a) => a.status === "approved" || a.status === "rejected"
        );

        let totalTime = 0;
        let count = 0;
        for (const a of completedApprovals) {
            if (a.updatedAt && a.createdAt) {
                totalTime += a.updatedAt - a.createdAt;
                count++;
            }
        }

        const avgTimeMs = count > 0 ? totalTime / count : 0;
        const avgTimeDays = Math.round(avgTimeMs / (24 * 60 * 60 * 1000) * 10) / 10;

        // Monthly trend
        const now = new Date();
        const monthlyStats: Record<string, { pending: number; approved: number; rejected: number }> = {};

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            monthlyStats[key] = { pending: 0, approved: 0, rejected: 0 };
        }

        for (const a of approvals) {
            const date = new Date(a.createdAt);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            if (monthlyStats[key]) {
                if (a.status === "pending") monthlyStats[key].pending++;
                else if (a.status === "approved") monthlyStats[key].approved++;
                else if (a.status === "rejected") monthlyStats[key].rejected++;
            }
        }

        return {
            avgApprovalDays: avgTimeDays,
            pendingCount: approvals.filter((a) => a.status === "pending").length,
            monthlyTrend: Object.entries(monthlyStats)
                .map(([month, stats]) => ({ month, ...stats }))
                .sort((a, b) => a.month.localeCompare(b.month)),
        };
    },
});

/**
 * Monthly comparison - current vs previous month
 */
export const monthlyComparison = query({
    args: {},
    handler: async (ctx) => {
        const tasks = await ctx.db.query("tasks").collect();
        const projects = await ctx.db.query("projects").collect();

        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
        const prevMonthEnd = currentMonthStart - 1;

        const currentTasks = tasks.filter((t) => t._creationTime >= currentMonthStart);
        const prevTasks = tasks.filter(
            (t) => t._creationTime >= prevMonthStart && t._creationTime <= prevMonthEnd
        );

        const currentCompleted = currentTasks.filter((t) => t.status === "done").length;
        const prevCompleted = prevTasks.filter((t) => t.status === "done").length;

        const currentProjects = projects.filter((p) => p._creationTime >= currentMonthStart);
        const prevProjects = projects.filter(
            (p) => p._creationTime >= prevMonthStart && p._creationTime <= prevMonthEnd
        );

        return {
            currentMonth: {
                tasksCreated: currentTasks.length,
                tasksCompleted: currentCompleted,
                projectsStarted: currentProjects.length,
            },
            previousMonth: {
                tasksCreated: prevTasks.length,
                tasksCompleted: prevCompleted,
                projectsStarted: prevProjects.length,
            },
            changes: {
                tasksCreated: currentTasks.length - prevTasks.length,
                tasksCompleted: currentCompleted - prevCompleted,
                projectsStarted: currentProjects.length - prevProjects.length,
            },
        };
    },
});

/**
 * Project health - projects with most issues
 */
export const projectHealth = query({
    args: {},
    handler: async (ctx) => {
        const projects = await ctx.db.query("projects").collect();
        const tasks = await ctx.db.query("tasks").collect();
        const now = Date.now();

        const health = projects.map((project) => {
            const projectTasks = tasks.filter((t) => t.projectId === project._id);
            const totalTasks = projectTasks.length;
            const completedTasks = projectTasks.filter((t) => t.status === "done").length;
            const overdueTasks = projectTasks.filter(
                (t) => t.dueDate && t.dueDate < now && t.status !== "done"
            ).length;
            const blockedTasks = projectTasks.filter((t) => t.status === "blocked").length;

            // Health score: 100 - (overdue% * 40) - (blocked% * 30) + (completed% * 30)
            const overdueRatio = totalTasks > 0 ? overdueTasks / totalTasks : 0;
            const blockedRatio = totalTasks > 0 ? blockedTasks / totalTasks : 0;
            const completedRatio = totalTasks > 0 ? completedTasks / totalTasks : 0;
            const healthScore = Math.max(
                0,
                Math.min(100, Math.round(100 - overdueRatio * 40 - blockedRatio * 30 + completedRatio * 30))
            );

            return {
                id: project._id,
                name: project.name,
                status: project.status,
                totalTasks,
                completedTasks,
                overdueTasks,
                blockedTasks,
                healthScore,
            };
        });

        return health
            .filter((h) => h.totalTasks > 0)
            .sort((a, b) => a.healthScore - b.healthScore);
    },
});

/**
 * Velocity metrics - tasks completed per week average
 */
export const velocityMetrics = query({
    args: { weeks: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const weeks = args.weeks || 8;
        const tasks = await ctx.db.query("tasks").collect();
        const now = Date.now();
        const weekMs = 7 * 24 * 60 * 60 * 1000;

        const weeklyData: number[] = [];

        for (let i = weeks - 1; i >= 0; i--) {
            const weekStart = now - (i + 1) * weekMs;
            const weekEnd = now - i * weekMs;

            const completedInWeek = tasks.filter(
                (t) =>
                    t.status === "done" &&
                    t.updatedAt &&
                    t.updatedAt >= weekStart &&
                    t.updatedAt < weekEnd
            ).length;

            weeklyData.push(completedInWeek);
        }

        const avgVelocity = weeklyData.length > 0
            ? Math.round(weeklyData.reduce((a, b) => a + b, 0) / weeklyData.length * 10) / 10
            : 0;

        const trend = weeklyData.map((completed, i) => ({
            week: `Седм. ${i + 1}`,
            completed,
        }));

        return {
            avgVelocity,
            trend,
            currentWeek: weeklyData[weeklyData.length - 1] || 0,
            previousWeek: weeklyData[weeklyData.length - 2] || 0,
        };
    },
});

/**
 * Estimated vs Actual hours analysis
 */
export const estimatedVsActual = query({
    args: {},
    handler: async (ctx) => {
        const tasks = await ctx.db.query("tasks").collect();

        const tasksWithEstimates = tasks.filter((t) => t.estimatedHours && t.estimatedHours > 0);
        const tasksWithBoth = tasksWithEstimates.filter((t) => t.actualHours && t.actualHours > 0);

        let totalEstimated = 0;
        let totalActual = 0;

        for (const task of tasksWithBoth) {
            totalEstimated += task.estimatedHours || 0;
            totalActual += task.actualHours || 0;
        }

        const accuracy = totalEstimated > 0
            ? Math.round((1 - Math.abs(totalActual - totalEstimated) / totalEstimated) * 100)
            : 0;

        return {
            totalEstimated: Math.round(totalEstimated * 10) / 10,
            totalActual: Math.round(totalActual * 10) / 10,
            accuracy: Math.max(0, accuracy),
            tasksWithEstimates: tasksWithEstimates.length,
            tasksWithBoth: tasksWithBoth.length,
            overrun: totalActual > totalEstimated,
            difference: Math.round(Math.abs(totalActual - totalEstimated) * 10) / 10,
        };
    },
});

/**
 * Budget overview - approval budget utilization (projects don't have budget field)
 */
export const budgetOverview = query({
    args: {},
    handler: async (ctx) => {
        const approvals = await ctx.db.query("approvals").collect();
        const projects = await ctx.db.query("projects").collect();

        // Sum approved budget from approvals
        const approvedBudget = approvals
            .filter((a) => a.status === "approved" && a.budget)
            .reduce((sum, a) => sum + (a.budget || 0), 0);

        const pendingBudget = approvals
            .filter((a) => a.status === "pending" && a.budget)
            .reduce((sum, a) => sum + (a.budget || 0), 0);

        const rejectedBudget = approvals
            .filter((a) => a.status === "rejected" && a.budget)
            .reduce((sum, a) => sum + (a.budget || 0), 0);

        const totalBudget = approvedBudget + pendingBudget + rejectedBudget;

        // Group approvals by project
        const byProject = projects.map((project) => {
            const projectApprovals = approvals.filter((a) => a.projectId === project._id);
            const projectApproved = projectApprovals
                .filter((a) => a.status === "approved" && a.budget)
                .reduce((sum, a) => sum + (a.budget || 0), 0);
            const projectPending = projectApprovals
                .filter((a) => a.status === "pending" && a.budget)
                .reduce((sum, a) => sum + (a.budget || 0), 0);
            return {
                name: project.name,
                approved: projectApproved,
                pending: projectPending,
                total: projectApproved + projectPending,
            };
        }).filter((p) => p.total > 0);

        return {
            totalBudget,
            approvedBudget,
            pendingBudget,
            rejectedBudget,
            approvalCount: approvals.filter((a) => a.budget && a.budget > 0).length,
            utilizationPercent: totalBudget > 0
                ? Math.round((approvedBudget / totalBudget) * 100)
                : 0,
            byProject,
        };
    },
});

/**
 * Get upcoming tasks for the current user
 */
export const myUpcomingTasks = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) return [];

        const now = Date.now();
        const limit = args.limit || 5;

        // Get tasks assigned to user that are not done
        const tasks = await ctx.db
            .query("tasks")
            .filter((q) =>
                q.and(
                    q.eq(q.field("assigneeId"), user._id),
                    q.neq(q.field("status"), "done")
                )
            )
            .collect();

        // Filter for tasks with deadline in future or recent past
        const upcoming = tasks
            .filter((t) => t.dueDate)
            .sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0))
            .slice(0, limit);

        // Get project names
        const projects = await Promise.all(
            upcoming.map((t) => ctx.db.get(t.projectId))
        );
        const projectMap = new Map(projects.filter(Boolean).map((p) => [p!._id, p!.name]));

        const colors: Record<string, string> = {
            low: "#94a3b8",
            medium: "#f59e0b",
            high: "#ef4444",
            critical: "#dc2626",
        };

        const priorityLabels: Record<string, string> = {
            low: "Нисък",
            medium: "Среден",
            high: "Висок",
            critical: "Критичен",
        };

        return upcoming.map((t) => ({
            _id: t._id,
            title: t.title,
            dueDate: t.dueDate,
            priority: priorityLabels[t.priority] || t.priority,
            projectName: projectMap.get(t.projectId) || "Unknown",
            priorityColor: colors[t.priority] || "#8884d8",
            daysLeft: t.dueDate ? Math.ceil((t.dueDate - now) / (24 * 60 * 60 * 1000)) : 0
        }));
    },
});

/**
 * Get top tasks for the current user (sorted by Priority)
 */
export const myTopTasks = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) return [];

        const limit = args.limit || 5;

        // Get tasks assigned to user that are not done
        const tasks = await ctx.db
            .query("tasks")
            .filter((q) =>
                q.and(
                    q.eq(q.field("assigneeId"), user._id),
                    q.neq(q.field("status"), "done")
                )
            )
            .collect();

        // Priority weights
        const priorityWeight: Record<string, number> = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1,
        };

        // Sort by Priority desc, then Due Date asc
        const topTasks = tasks
            .sort((a, b) => {
                const pA = priorityWeight[a.priority] || 0;
                const pB = priorityWeight[b.priority] || 0;
                if (pA !== pB) return pB - pA;
                return (a.dueDate || 0) - (b.dueDate || 0);
            })
            .slice(0, limit);

        // Get project names
        const projects = await Promise.all(
            topTasks.map((t) => ctx.db.get(t.projectId))
        );
        const projectMap = new Map(projects.filter(Boolean).map((p) => [p!._id, p!.name]));

        const colors: Record<string, string> = {
            low: "#94a3b8",
            medium: "#f59e0b",
            high: "#ef4444",
            critical: "#dc2626",
        };

        const priorityLabels: Record<string, string> = {
            low: "Нисък",
            medium: "Среден",
            high: "Висок",
            critical: "Критичен",
        };

        return topTasks.map((t) => ({
            _id: t._id,
            title: t.title,
            dueDate: t.dueDate,
            priority: priorityLabels[t.priority] || t.priority,
            projectName: projectMap.get(t.projectId) || "Unknown",
            priorityColor: colors[t.priority] || "#8884d8",
            status: t.status
        }));
    },
});

/**
 * Task metrics for the tasks page
 * Returns aggregate counts for total, in progress, completed, and overdue tasks
 */
export const taskMetrics = query({
    args: {},
    handler: async (ctx) => {
        const tasks = await ctx.db.query("tasks").collect();
        const now = Date.now();

        return {
            totalTasks: tasks.length,
            inProgress: tasks.filter((t) => t.status === "in_progress").length,
            completed: tasks.filter((t) => t.status === "done").length,
            overdue: tasks.filter(
                (t) => t.dueDate && t.dueDate < now && t.status !== "done"
            ).length,
        };
    },
});
