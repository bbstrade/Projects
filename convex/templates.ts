import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createProjectTemplate = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        priority: v.string(),
        estimatedDuration: v.number(),
        tasks: v.array(v.object({
            title: v.string(),
            description: v.optional(v.string()),
            priority: v.string(),
            estimatedHours: v.optional(v.number()),
            subtasks: v.optional(v.array(v.string())),
        })),
        isPublic: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        return await ctx.db.insert("projectTemplates", {
            ...args,
            createdBy: userId,
            createdAt: Date.now(),
        });
    },
});

export const listProjectTemplates = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        const templates = await ctx.db.query("projectTemplates").collect();
        // Filter logic: visible if public OR created by user
        // (For a real shared team environment, we'd check team visibility too, but simple for now)
        return templates.filter(t => t.isPublic || t.createdBy === userId);
    },
});

export const getProjectTemplate = query({
    args: { id: v.id("projectTemplates") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const instantiateProjectTemplate = mutation({
    args: {
        templateId: v.id("projectTemplates"),
        teamId: v.string(),
        name: v.string(), // Override name
        startDate: v.number(),
        ownerId: v.optional(v.id("users")), // Optional, defaults to caller
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const template = await ctx.db.get(args.templateId);
        if (!template) throw new Error("Template not found");

        const ownerId = args.ownerId || userId;

        // 1. Create Project
        const projectId = await ctx.db.insert("projects", {
            name: args.name,
            description: template.description || "",
            status: "active",
            priority: template.priority,
            startDate: args.startDate,
            // Calculate end date based on estimated duration
            endDate: args.startDate + (template.estimatedDuration * 86400000),
            teamId: args.teamId,
            ownerId: ownerId,
            templateId: template._id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            team_members: [], // Empty initially? Or add owner?
        });

        // 2. Create Tasks
        for (const t of template.tasks) {
            const taskId = await ctx.db.insert("tasks", {
                title: t.title,
                description: t.description || "",
                projectId: projectId,
                creatorId: userId,
                assigneeId: undefined, // Unassigned
                status: "todo",
                priority: t.priority,
                estimatedHours: t.estimatedHours,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });

            // 3. Create Subtasks if any
            if (t.subtasks && t.subtasks.length > 0) {
                for (const sub of t.subtasks) {
                    await ctx.db.insert("subtasks", {
                        title: sub,
                        taskId: taskId,
                        completed: false,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    });
                }
            }
        }

        return projectId;
    },
});

export const createTaskTemplate = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        priority: v.string(),
        estimatedHours: v.optional(v.number()),
        subtasks: v.optional(v.array(v.string())),
        category: v.optional(v.string()),
        isPublic: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        return await ctx.db.insert("taskTemplates", {
            ...args,
            createdBy: userId,
            createdAt: Date.now(),
        });
    },
});




export const listTaskTemplates = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        const templates = await ctx.db.query("taskTemplates").collect();
        return templates.filter(t => t.isPublic || t.createdBy === userId);
    },
});

export const instantiateTaskTemplate = mutation({
    args: {
        templateId: v.id("taskTemplates"),
        projectId: v.id("projects"),
        assigneeId: v.optional(v.id("users")),
        status: v.optional(v.string()), // default todo
        priority: v.optional(v.string()), // override template priority
        dueDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const template = await ctx.db.get(args.templateId);
        if (!template) throw new Error("Template not found");

        const taskId = await ctx.db.insert("tasks", {
            title: template.title,
            description: template.description || "",
            projectId: args.projectId,
            creatorId: userId,
            assigneeId: args.assigneeId,
            status: args.status || "todo",
            priority: args.priority || template.priority,
            estimatedHours: template.estimatedHours,
            dueDate: args.dueDate,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        if (template.subtasks && template.subtasks.length > 0) {
            for (const sub of template.subtasks) {
                await ctx.db.insert("subtasks", {
                    title: sub,
                    taskId: taskId,
                    completed: false,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            }
        }

        return taskId;
    },
});
