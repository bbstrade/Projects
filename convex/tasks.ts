import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
    args: {
        projectId: v.id("projects"),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let q = ctx.db
            .query("tasks")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .filter((q) => q.eq(q.field("parentTaskId"), undefined));

        if (args.status) {
            q = q.filter((q) => q.eq(q.field("status"), args.status));
        }

        const tasks = await q.collect();

        // Enrich with assignee details
        return await Promise.all(
            tasks.map(async (t) => {
                let assignee = null;
                if (t.assigneeId) {
                    assignee = await ctx.db.get(t.assigneeId);
                }
                return { ...t, assignee };
            })
        );
    },
});

export const listSubtasks = query({
    args: {
        parentTaskId: v.id("tasks"),
    },
    handler: async (ctx, args) => {
        const subtasks = await ctx.db
            .query("tasks")
            .filter((q) => q.eq(q.field("parentTaskId"), args.parentTaskId))
            .collect();

        return await Promise.all(
            subtasks.map(async (t) => {
                let assignee = null;
                if (t.assigneeId) {
                    assignee = await ctx.db.get(t.assigneeId);
                }
                return { ...t, assignee };
            })
        );
    },
});

export const listAll = query({
    args: {
        status: v.optional(v.string()),
        assigneeId: v.optional(v.id("users")),
        projectId: v.optional(v.id("projects")),
    },
    handler: async (ctx, args) => {
        let q = ctx.db.query("tasks").order("desc");

        if (args.status) {
            q = q.filter((q) => q.eq(q.field("status"), args.status));
        }

        if (args.assigneeId) {
            q = q.filter((q) => q.eq(q.field("assigneeId"), args.assigneeId));
        }

        if (args.projectId) {
            q = q.filter((q) => q.eq(q.field("projectId"), args.projectId));
        }

        return await q.collect();
    },
});

// Helper to auto-add assignee to team
async function ensureAssigneeInTeam(ctx: any, projectId: any, assigneeId: any) {
    if (!assigneeId) return;

    const project = await ctx.db.get(projectId);
    if (!project || !project.teamId) return;

    const teamId = project.teamId;

    // Check if member exists
    const existing = await ctx.db
        .query("teamMembers")
        .withIndex("by_user_team", (q: any) =>
            q.eq("userId", assigneeId).eq("teamId", teamId)
        )
        .unique();

    if (!existing) {
        // Add to team
        const identity = await ctx.auth.getUserIdentity();
        let invitedBy = undefined;
        if (identity) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                .unique();
            if (user) invitedBy = user._id;
        }

        await ctx.db.insert("teamMembers", {
            teamId,
            userId: assigneeId,
            role: "member",
            status: "active",
            invitedBy,
            joinedAt: Date.now(),
        });
    }
}

export const create = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        projectId: v.id("projects"),
        priority: v.string(),
        status: v.string(),
        assigneeId: v.optional(v.id("users")),
        dueDate: v.optional(v.number()),
        estimatedHours: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
        labels: v.optional(v.array(v.string())),
        parentTaskId: v.optional(v.id("tasks")),
        attachments: v.optional(v.array(v.string())), // Storage IDs
        color: v.optional(v.string()), // Added color arg
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        let creatorId = undefined;

        if (identity) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                .unique();
            if (user) {
                creatorId = user._id;
            }
        }

        // Auto-add assignee to team
        if (args.assigneeId) {
            await ensureAssigneeInTeam(ctx, args.projectId, args.assigneeId);
        }

        const now = Date.now();
        return await ctx.db.insert("tasks", {
            ...args,
            creatorId,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("tasks"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        projectId: v.optional(v.id("projects")),
        priority: v.optional(v.string()),
        status: v.optional(v.string()),
        assigneeId: v.optional(v.id("users")),
        dueDate: v.optional(v.number()),
        estimatedHours: v.optional(v.number()),
        actualHours: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
        labels: v.optional(v.array(v.string())),
        attachments: v.optional(v.array(v.string())), // Storage IDs
        color: v.optional(v.string()), // Added color arg
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        const task = await ctx.db.get(id);

        if (fields.assigneeId && task) {
            await ensureAssigneeInTeam(ctx, task.projectId, fields.assigneeId);
        }

        await ctx.db.patch(id, {
            ...fields,
            updatedAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const get = query({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        const task = await ctx.db.get(args.id);
        if (!task) return null;

        let assignee = null;
        if (task.assigneeId) {
            assignee = await ctx.db.get(task.assigneeId);
        }
        return { ...task, assignee };
    },
});

export const listByTeam = query({
    args: {
        teamId: v.string(),
        assigneeId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        // 1. Get all projects for the team
        const projects = await ctx.db
            .query("projects")
            .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
            .collect();

        const projectIds = projects.map((p) => p._id);

        if (projectIds.length === 0) {
            return [];
        }

        // 2. Fetch tasks for these projects
        // Optimized approach: Use Promise.all
        const tasks = await Promise.all(
            projectIds.map((projectId) =>
                ctx.db
                    .query("tasks")
                    .withIndex("by_project", (q) => q.eq("projectId", projectId))
                    .collect()
            )
        );

        // Flatten array
        const allTasks = tasks.flat();

        // 3. Enrich with assignee details
        const enrichedTasks = await Promise.all(
            allTasks.map(async (t) => {
                let assignee = null;
                if (t.assigneeId) {
                    assignee = await ctx.db.get(t.assigneeId);
                }
                return { ...t, assignee, assignee_email: assignee?.email };
            })
        );

        // Sort by createdAt desc
        return enrichedTasks.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    },
});
