import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * List dependencies for a task
 */
export const list = query({
    args: { taskId: v.id("tasks") },
    handler: async (ctx, args) => {
        const dependencies = await ctx.db
            .query("taskDependencies")
            .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
            .collect();

        // Enrich with task details
        return await Promise.all(
            dependencies.map(async (dep) => {
                const dependsOnTask = await ctx.db.get(dep.dependsOnTaskId);
                return {
                    ...dep,
                    dependsOnTask,
                };
            })
        );
    },
});

/**
 * List tasks that depend on a given task (reverse lookup)
 */
export const listDependents = query({
    args: { taskId: v.id("tasks") },
    handler: async (ctx, args) => {
        const dependents = await ctx.db
            .query("taskDependencies")
            .withIndex("by_depends_on", (q) => q.eq("dependsOnTaskId", args.taskId))
            .collect();

        return await Promise.all(
            dependents.map(async (dep) => {
                const task = await ctx.db.get(dep.taskId);
                return {
                    ...dep,
                    task,
                };
            })
        );
    },
});

/**
 * Add a dependency
 */
export const add = mutation({
    args: {
        taskId: v.id("tasks"),
        dependsOnTaskId: v.id("tasks"),
        type: v.string(), // "FS" | "SS" | "FF" | "SF"
    },
    handler: async (ctx, args) => {
        // Prevent self-dependency
        if (args.taskId === args.dependsOnTaskId) {
            throw new Error("A task cannot depend on itself");
        }

        // Check if dependency already exists
        const existing = await ctx.db
            .query("taskDependencies")
            .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
            .filter((q) => q.eq(q.field("dependsOnTaskId"), args.dependsOnTaskId))
            .unique();

        if (existing) {
            throw new Error("This dependency already exists");
        }

        return await ctx.db.insert("taskDependencies", {
            taskId: args.taskId,
            dependsOnTaskId: args.dependsOnTaskId,
            type: args.type,
            createdAt: Date.now(),
        });
    },
});

/**
 * Update dependency type
 */
export const update = mutation({
    args: {
        id: v.id("taskDependencies"),
        type: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { type: args.type });
    },
});

/**
 * Remove a dependency
 */
export const remove = mutation({
    args: { id: v.id("taskDependencies") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
