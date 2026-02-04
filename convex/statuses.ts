import { v } from "convex/values";
import { query } from "./_generated/server";

export const list = query({
    args: {
        type: v.string(), // "task" | "project"
        teamId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let q = ctx.db
            .query("customStatuses")
            .withIndex("by_type", (q) => q.eq("type", args.type));

        const statuses = await q.collect();

        // Filter by teamId (if provided) or null (default/global)
        // Also include defaults if needed, but usually frontend handles defaults + custom
        return statuses.filter(
            (s) => s.teamId === args.teamId || !s.teamId
        ).sort((a, b) => a.order - b.order);
    },
});
