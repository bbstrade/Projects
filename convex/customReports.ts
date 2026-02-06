import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * List custom reports for the current user (includes shared team reports)
 */
export const list = query({
    args: {
        teamId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) return [];

        // Get user's own reports
        const ownReports = await ctx.db
            .query("customReports")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        // Get shared team reports (if teamId provided)
        let sharedReports: typeof ownReports = [];
        if (args.teamId) {
            const teamReports = await ctx.db
                .query("customReports")
                .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
                .collect();
            sharedReports = teamReports.filter(
                (r) => r.isShared && r.userId !== user._id
            );
        }

        return [...ownReports, ...sharedReports].sort(
            (a, b) => b.updatedAt - a.updatedAt
        );
    },
});

/**
 * Get a single custom report by ID
 */
export const get = query({
    args: { id: v.id("customReports") },
    handler: async (ctx, args) => {
        const report = await ctx.db.get(args.id);
        if (!report) return null;

        // Fetch user info for display
        const user = await ctx.db.get(report.userId);
        return {
            ...report,
            userName: user?.name || "Unknown",
        };
    },
});

/**
 * Create a new custom report
 */
export const create = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        teamId: v.optional(v.string()),
        isShared: v.optional(v.boolean()),
        layout: v.array(
            v.object({
                id: v.string(),
                type: v.string(),
                position: v.object({
                    x: v.number(),
                    y: v.number(),
                    w: v.number(),
                    h: v.number(),
                }),
                config: v.object({
                    title: v.string(),
                    dataSource: v.string(),
                    metric: v.string(),
                    metricField: v.optional(v.string()),
                    groupBy: v.optional(v.string()),
                    filters: v.optional(v.any()),
                    dateRange: v.optional(v.string()),
                    colors: v.optional(v.array(v.string())),
                }),
            })
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) throw new Error("User not found");

        const now = Date.now();
        return await ctx.db.insert("customReports", {
            name: args.name,
            description: args.description,
            userId: user._id,
            teamId: args.teamId,
            isShared: args.isShared ?? false,
            layout: args.layout,
            createdAt: now,
            updatedAt: now,
        });
    },
});

/**
 * Update an existing custom report
 */
export const update = mutation({
    args: {
        id: v.id("customReports"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        isShared: v.optional(v.boolean()),
        layout: v.optional(
            v.array(
                v.object({
                    id: v.string(),
                    type: v.string(),
                    position: v.object({
                        x: v.number(),
                        y: v.number(),
                        w: v.number(),
                        h: v.number(),
                    }),
                    config: v.object({
                        title: v.string(),
                        dataSource: v.string(),
                        metric: v.string(),
                        metricField: v.optional(v.string()),
                        groupBy: v.optional(v.string()),
                        filters: v.optional(v.any()),
                        dateRange: v.optional(v.string()),
                        colors: v.optional(v.array(v.string())),
                    }),
                })
            )
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Report not found");

        // Check ownership
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user || existing.userId !== user._id) {
            throw new Error("Unauthorized");
        }

        const updates: Partial<typeof existing> = { updatedAt: Date.now() };
        if (args.name !== undefined) updates.name = args.name;
        if (args.description !== undefined) updates.description = args.description;
        if (args.isShared !== undefined) updates.isShared = args.isShared;
        if (args.layout !== undefined) updates.layout = args.layout;

        await ctx.db.patch(args.id, updates);
        return args.id;
    },
});

/**
 * Delete a custom report
 */
export const remove = mutation({
    args: { id: v.id("customReports") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Report not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user || existing.userId !== user._id) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.id);
        return { success: true };
    },
});

/**
 * Duplicate an existing report
 */
export const duplicate = mutation({
    args: { id: v.id("customReports") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Report not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) throw new Error("User not found");

        const now = Date.now();
        return await ctx.db.insert("customReports", {
            name: `${existing.name} (Копие)`,
            description: existing.description,
            userId: user._id,
            teamId: user.currentTeamId,
            isShared: false,
            layout: existing.layout,
            createdAt: now,
            updatedAt: now,
        });
    },
});

/**
 * Dynamic data query for widgets - executes based on widget configuration
 */
export const getWidgetData = query({
    args: {
        dataSource: v.string(),
        metric: v.string(),
        metricField: v.optional(v.string()),
        groupBy: v.optional(v.string()),
        filters: v.optional(v.any()),
        dateRange: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { dataSource, metric, groupBy, dateRange } = args;

        // Calculate date range
        let startDate: number | undefined;
        const now = Date.now();
        if (dateRange === "7d") startDate = now - 7 * 24 * 60 * 60 * 1000;
        else if (dateRange === "30d") startDate = now - 30 * 24 * 60 * 60 * 1000;
        else if (dateRange === "90d") startDate = now - 90 * 24 * 60 * 60 * 1000;

        // Fetch data based on source
        let data: Record<string, unknown>[] = [];

        if (dataSource === "projects") {
            const projects = await ctx.db.query("projects").collect();
            data = projects.filter((p) => !startDate || (p.createdAt && p.createdAt >= startDate));
        } else if (dataSource === "tasks") {
            const tasks = await ctx.db.query("tasks").collect();
            data = tasks.filter((t) => !startDate || (t.createdAt && t.createdAt >= startDate));
        } else if (dataSource === "approvals") {
            const approvals = await ctx.db.query("approvals").collect();
            data = approvals.filter((a) => !startDate || a.createdAt >= startDate);
        } else if (dataSource === "files") {
            const files = await ctx.db.query("files").collect();
            data = files.filter((f) => !startDate || f.createdAt >= startDate);
        }

        // Apply grouping and aggregation
        if (groupBy && data.length > 0) {
            const grouped: Record<string, { name: string; value: number; fill?: string }> = {};
            const colors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

            data.forEach((item) => {
                const key = String(item[groupBy] || "Без стойност");
                if (!grouped[key]) {
                    grouped[key] = { name: key, value: 0 };
                }

                if (metric === "count") {
                    grouped[key].value += 1;
                } else if (metric === "sum" && args.metricField) {
                    const val = item[args.metricField];
                    if (typeof val === "number") grouped[key].value += val;
                } else if (metric === "avg" && args.metricField) {
                    // For avg, we'll need to track count and sum
                    grouped[key].value += 1; // Simplified - just count for now
                }
            });

            // Assign colors
            const result = Object.values(grouped);
            result.forEach((item, i) => {
                item.fill = colors[i % colors.length];
            });

            return {
                type: "grouped",
                data: result,
                total: data.length,
            };
        }

        // Simple count/sum if no grouping
        let value = 0;
        if (metric === "count") {
            value = data.length;
        } else if (metric === "sum" && args.metricField) {
            value = data.reduce((sum, item) => {
                const val = item[args.metricField!];
                return sum + (typeof val === "number" ? val : 0);
            }, 0);
        }

        return {
            type: "metric",
            value,
            total: data.length,
        };
    },
});
