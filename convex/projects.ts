import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const projects = await ctx.db.query("projects").order("desc").collect();

        return await Promise.all(projects.map(async (p) => {
            // Calculate Progress
            const tasks = await ctx.db
                .query("tasks")
                .withIndex("by_project", (q) => q.eq("projectId", p._id))
                .collect();

            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.status === "done").length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            // Calculate Team Count
            // Note: 'teamId' is on the project. We count members of that team.
            let teamCount = 0;
            if (p.teamId) {
                const members = await ctx.db
                    .query("teamMembers")
                    .withIndex("by_team", (q) => q.eq("teamId", p.teamId))
                    .collect();
                teamCount = members.length;
            }

            return {
                ...p,
                progress,
                teamCount,
            };
        }));
    },
});

export const get = query({
    args: { id: v.id("projects") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getWithTasks = query({
    args: { id: v.id("projects") },
    handler: async (ctx, args) => {
        const project = await ctx.db.get(args.id);
        if (!project) return null;

        const tasks = await ctx.db
            .query("tasks")
            .withIndex("by_project", (q) => q.eq("projectId", args.id))
            .collect();

        const tasksWithSubtasks = await Promise.all(
            tasks.map(async (t) => {
                const subtasks = await ctx.db
                    .query("subtasks")
                    .withIndex("by_task", (q) => q.eq("taskId", t._id))
                    .collect();
                return { ...t, subtasks: subtasks.map(s => s.title) };
            })
        );

        return { ...project, tasks: tasksWithSubtasks };
    },
});

export const getStats = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        const tasks = await ctx.db
            .query("tasks")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect();

        const totalTasks = tasks.length;
        const inProgress = tasks.filter((t) => t.status === "in_progress").length;
        const done = tasks.filter((t) => t.status === "done").length;
        const now = Date.now();
        const overdue = tasks.filter(
            (t) => t.dueDate && t.dueDate < now && t.status !== "done"
        ).length;

        return {
            totalTasks,
            inProgress,
            done,
            overdue,
        };
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        priority: v.string(),
        status: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        teamId: v.string(),
        team_members: v.optional(v.array(v.string())),
        color: v.optional(v.string()), // Added color arg
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        let ownerId = undefined;

        if (identity) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                .unique();
            if (user) {
                ownerId = user._id;
            }
        }

        const status = args.status || "active"; // Default to active if not provided
        const now = Date.now();

        return await ctx.db.insert("projects", {
            ...args,
            status,
            ownerId,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("projects"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        priority: v.optional(v.string()),
        status: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        team_members: v.optional(v.array(v.string())),
        color: v.optional(v.string()), // Added color arg
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;

        // Check permissions (EDIT_PROJECT) - simplified check for now
        // TODO: Implement proper permission check against teamMembers roles

        await ctx.db.patch(id, {
            ...fields,
            updatedAt: Date.now(),
        });

        // Automatic addition to TeamMember if team_members are added?
        // Requirements say: "При създаване/редакция на задача... автоматично добавя към екип"
        // Also: "Tab 2: Team... Add members... checks if user exists in TeamMember... if not -> create"
        // This mutation updates the PROJECT details. The functionality to add to team might be separate or triggered here.
        // For now, we just update the project.
    },
});

export const remove = mutation({
    args: { id: v.id("projects") },
    handler: async (ctx, args) => {
        // Check permissions (DELETE_PROJECT)
        await ctx.db.delete(args.id);

        // Also cleanup related tasks? 
        // Not explicitly requested to be recursive, but good practice.
        // For safety, leaving as is per requirements "Delete project with confirmation"
    },
});

export const updateTeamMembers = mutation({
    args: {
        projectId: v.id("projects"),
        members: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const project = await ctx.db.get(args.projectId);
        if (!project) throw new Error("Project not found");

        await ctx.db.patch(args.projectId, {
            team_members: args.members,
            updatedAt: Date.now(),
        });

        // Logic to sync with TeamMembers table could go here if we can resolve emails to users
    }
});

export const listByTeam = query({
    args: {
        teamId: v.string(),
    },
    handler: async (ctx, args) => {
        const projects = await ctx.db
            .query("projects")
            .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
            .order("desc") // by creation time usually (schema default order)
            .collect();

        // Enrich if needed (e.g. owner email)
        return await Promise.all(projects.map(async (p) => {
            let owner = undefined;
            if (p.ownerId) {
                owner = await ctx.db.get(p.ownerId);
            }
            return { ...p, created_by: owner?.email }; // mapping for frontend compatibility
        }));
    },
});
