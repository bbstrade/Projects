import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


// Helper to check if user is super admin
// Helper to check if user is super admin
async function checkSuperAdmin(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    console.log("checkSuperAdmin identity:", identity);
    if (!identity) return false;

    if (identity.email === 'bbstradeltd@gmail.com') return true;

    const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique();
    console.log("checkSuperAdmin user:", user);

    if (!user) return false;

    return user.systemRole === 'superadmin' || user.email === 'bbstradeltd@gmail.com';
}

// Helper to check if user is admin of a specific team
async function checkTeamAdmin(ctx: any, teamId: string) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique();

    if (!user) return false;

    if (await checkSuperAdmin(ctx)) return true; // Super admin is admin of all teams

    const membership = await ctx.db
        .query("teamMembers")
        .withIndex("by_user_team", (q: any) => q.eq("userId", user._id).eq("teamId", teamId))
        .first();

    return membership?.role === 'owner' || membership?.role === 'admin';
}

// Helper for general admin access (any team admin or super admin) - kept for backward compatibility if needed
async function checkAdmin(ctx: any) {
    return await checkSuperAdmin(ctx);
}

export const getSystemStats = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

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
        if (!(await checkSuperAdmin(ctx))) throw new Error("Unauthorized: Only super admins can change user roles");
        await ctx.db.patch(args.userId, { role: args.role });
    },
});

// Initialize default statuses and priorities if empty or missing defaults
export const initializeDefaults = mutation({
    args: {},
    handler: async (ctx) => {
        const defaultTaskStatuses = [
            { label: "To Do", slug: "todo", color: "#808080", order: 0, isDefault: true },
            { label: "In Progress", slug: "in_progress", color: "#3b82f6", order: 1, isDefault: false },
            { label: "In Review", slug: "in_review", color: "#f59e0b", order: 2, isDefault: false },
            { label: "Done", slug: "done", color: "#22c55e", order: 3, isDefault: false },
        ];

        for (const s of defaultTaskStatuses) {
            // Check for global status (teamId is undefined/null)
            const existing = await ctx.db.query("customStatuses")
                .withIndex("by_type", q => q.eq("type", "task"))
                .filter(q => q.and(
                    q.eq(q.field("slug"), s.slug),
                    q.eq(q.field("teamId"), undefined)
                ))
                .first();

            if (!existing) {
                await ctx.db.insert("customStatuses", { ...s, type: "task", teamId: undefined, createdAt: Date.now(), updatedAt: Date.now() });
                console.log(`Inserted global task status: ${s.slug}`);
            }
        }

        const defaultProjectStatuses = [
            { label: "Draft", slug: "draft", color: "#808080", order: 0, isDefault: true },
            { label: "Active", slug: "active", color: "#3b82f6", order: 1, isDefault: false },
            { label: "On Hold", slug: "on_hold", color: "#f59e0b", order: 2, isDefault: false },
            { label: "Completed", slug: "completed", color: "#22c55e", order: 3, isDefault: false },
            { label: "Archived", slug: "archived", color: "#64748b", order: 4, isDefault: false },
        ];

        for (const s of defaultProjectStatuses) {
            const existing = await ctx.db.query("customStatuses")
                .withIndex("by_type", q => q.eq("type", "project"))
                .filter(q => q.and(
                    q.eq(q.field("slug"), s.slug),
                    q.eq(q.field("teamId"), undefined)
                ))
                .first();

            if (!existing) {
                await ctx.db.insert("customStatuses", { ...s, type: "project", teamId: undefined, createdAt: Date.now(), updatedAt: Date.now() });
                console.log(`Inserted global project status: ${s.slug}`);
            }
        }

        // Priorities
        const defaultPriorities = [
            { label: "Low", slug: "low", color: "#22c55e", order: 0, isDefault: false },
            { label: "Medium", slug: "medium", color: "#3b82f6", order: 1, isDefault: true },
            { label: "High", slug: "high", color: "#f59e0b", order: 2, isDefault: false },
            { label: "Critical", slug: "critical", color: "#ef4444", order: 3, isDefault: false },
        ];

        for (const p of defaultPriorities) {
            const existingTaskP = await ctx.db.query("customPriorities")
                .withIndex("by_type", q => q.eq("type", "task"))
                .filter(q => q.and(
                    q.eq(q.field("slug"), p.slug),
                    q.eq(q.field("teamId"), undefined)
                ))
                .first();

            if (!existingTaskP) {
                await ctx.db.insert("customPriorities", { ...p, type: "task", teamId: undefined, createdAt: Date.now(), updatedAt: Date.now() });
            }

            const existingProjectP = await ctx.db.query("customPriorities")
                .withIndex("by_type", q => q.eq("type", "project"))
                .filter(q => q.and(
                    q.eq(q.field("slug"), p.slug),
                    q.eq(q.field("teamId"), undefined)
                ))
                .first();

            if (!existingProjectP) {
                await ctx.db.insert("customPriorities", { ...p, type: "project", teamId: undefined, createdAt: Date.now(), updatedAt: Date.now() });
            }
        }
    }
});

// Custom Statuses Management
export const manageCustomStatusHandler = async (ctx: any, args: any) => {
    try {
        console.log("manageCustomStatus args:", args);
        const identity = await ctx.auth.getUserIdentity();
        console.log("DEBUG: identity", identity);

        if (identity) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                .unique();
            console.log("DEBUG: user lookup", user);
        }

        if (args.action === "create") {
            if (!args.data) throw new Error("Data required for create");

            // Permission check
            if (args.data.teamId) {
                if (!(await checkTeamAdmin(ctx, args.data.teamId))) throw new Error("Unauthorized: Not admin of this team");
            } else {
                if (!(await checkSuperAdmin(ctx))) throw new Error("Unauthorized: Only super admin can create global statuses");
            }

            await ctx.db.insert("customStatuses", {
                ...args.data,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        } else if (args.action === "update") {
            if (!args.id || !args.data) throw new Error("ID and Data required for update");
            const existing = await ctx.db.get(args.id);
            if (!existing) throw new Error("Status not found");

            // Permission check
            if (existing.teamId) {
                if (!(await checkTeamAdmin(ctx, existing.teamId))) throw new Error("Unauthorized");
            } else {
                if (!(await checkSuperAdmin(ctx))) throw new Error("Unauthorized");
            }

            // Prevent moving across teams/global via update
            if (args.data.teamId !== existing.teamId) throw new Error("Cannot change team scope of a status");

            await ctx.db.patch(args.id, {
                ...args.data,
                updatedAt: Date.now(),
            });
        } else if (args.action === "delete") {
            if (!args.id) throw new Error("ID required for delete");
            const existing = await ctx.db.get(args.id);
            if (!existing) throw new Error("Status not found");

            // Permission check
            if (existing.teamId) {
                if (!(await checkTeamAdmin(ctx, existing.teamId))) throw new Error("Unauthorized");
            } else {
                if (!(await checkSuperAdmin(ctx))) throw new Error("Unauthorized");
            }

            await ctx.db.delete(args.id);
        }
    } catch (e: any) {
        console.error("Error in manageCustomStatus:", e);
        throw new Error(e.message || "Failed to manage custom status");
    }
};

export const manageCustomStatus = mutation({
    args: v.any(),
    handler: async (ctx, args) => {
        console.log("manageCustomStatus wrapper called with:", args);
        try {
            await manageCustomStatusHandler(ctx, args);
        } catch (e: any) {
            console.error("Wrapper Error:", e);
            throw e;
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
        try {
            if (args.action === "create") {
                if (!args.data) throw new Error("Data required for create");

                if (args.data.teamId) {
                    if (!(await checkTeamAdmin(ctx, args.data.teamId))) throw new Error("Unauthorized: Not admin of this team");
                } else {
                    if (!(await checkSuperAdmin(ctx))) throw new Error("Unauthorized: Only super admin can create global priorities");
                }

                await ctx.db.insert("customPriorities", {
                    ...args.data,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            } else if (args.action === "update") {
                if (!args.id || !args.data) throw new Error("ID and Data required for update");
                const existing = await ctx.db.get(args.id);
                if (!existing) throw new Error("Priority not found");

                if (existing.teamId) {
                    if (!(await checkTeamAdmin(ctx, existing.teamId))) throw new Error("Unauthorized");
                } else {
                    if (!(await checkSuperAdmin(ctx))) throw new Error("Unauthorized");
                }

                if (args.data.teamId !== existing.teamId) throw new Error("Cannot change team scope");

                await ctx.db.patch(args.id, {
                    ...args.data,
                    updatedAt: Date.now(),
                });
            } else if (args.action === "delete") {
                if (!args.id) throw new Error("ID required for delete");
                const existing = await ctx.db.get(args.id);
                if (!existing) throw new Error("Priority not found");

                if (existing.teamId) {
                    if (!(await checkTeamAdmin(ctx, existing.teamId))) throw new Error("Unauthorized");
                } else {
                    if (!(await checkSuperAdmin(ctx))) throw new Error("Unauthorized");
                }

                await ctx.db.delete(args.id);
            }
        } catch (e: any) {
            console.error("Error in manageCustomPriority:", e);
            throw new Error(e.message || "Failed to manage custom priority");
        }
    },
});

export const getCustomStatuses = query({
    args: { type: v.optional(v.string()), teamId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        let statuses;
        if (args.type) {
            const type = args.type;
            statuses = await ctx.db.query("customStatuses").withIndex("by_type", q => q.eq("type", type)).collect();
        } else {
            statuses = await ctx.db.query("customStatuses").collect();
        }

        // Return global + team specific
        return statuses.filter(s => !s.teamId || (args.teamId && s.teamId === args.teamId))
            .sort((a, b) => a.order - b.order);
    }
});

export const getCustomPriorities = query({
    args: { type: v.optional(v.string()), teamId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        let priorities;
        if (args.type) {
            const type = args.type;
            priorities = await ctx.db.query("customPriorities").withIndex("by_type", q => q.eq("type", type)).collect();
        } else {
            priorities = await ctx.db.query("customPriorities").collect();
        }

        return priorities.filter(p => !p.teamId || (args.teamId && p.teamId === args.teamId))
            .sort((a, b) => a.order - b.order);
    }
});
