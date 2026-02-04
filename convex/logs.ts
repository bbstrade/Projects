import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * List activity logs (Super Admin only for now)
 */
export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) return [];

        // Restrict to Super Admin
        if (user.systemRole !== "superadmin") {
            // For now, return empty for regular users to avoid leaking global logs
            // TODO: Implement team-scoped logging filtering
            return [];
        }

        return await ctx.db.query("activityLogs").order("desc").take(100);
    },
});
