import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get team by ID
 */
export const get = query({
    args: { teamId: v.id("teams") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.teamId);
    },
});

/**
 * List all teams
 */
/**
 * List all teams (Filtered by permissions)
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

        // System Admin sees all teams
        if (user.role === "admin") {
            return await ctx.db.query("teams").order("desc").collect();
        }

        // Regular users see only their teams
        const memberships = await ctx.db
            .query("teamMembers")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        const teams = await Promise.all(
            memberships.map((m) => ctx.db.get(m.teamId as Id<"teams">))
        );

        return teams.filter((t) => t !== null);
    },
});

/**
 * List teams for a specific user
 */
export const listForUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const memberships = await ctx.db
            .query("teamMembers")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const teams = await Promise.all(
            memberships.map((m) =>
                ctx.db
                    .query("teams")
                    .filter((q) => q.eq(q.field("_id"), m.teamId as Id<"teams">))
                    .first()
            )
        );

        return teams.filter(Boolean);
    },
});

/**
 * Get team members
 */
export const getMembers = query({
    args: { teamId: v.string() },
    handler: async (ctx, args) => {
        const memberships = await ctx.db
            .query("teamMembers")
            .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
            .collect();

        const members = await Promise.all(
            memberships.map(async (m) => {
                const user = await ctx.db.get(m.userId);
                return {
                    ...m,
                    user,
                };
            })
        );

        return members;
    },
});

/**
 * Create a new team
 */
export const create = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");
        const ownerId = user._id;

        const now = Date.now();

        // Create the team
        const teamId = await ctx.db.insert("teams", {
            name: args.name,
            description: args.description,
            ownerId,
            createdAt: now,
            updatedAt: now,
        });

        // Add owner as a team member
        await ctx.db.insert("teamMembers", {
            teamId: teamId,
            userId: ownerId,
            role: "owner",
            joinedAt: now,
        });

        return teamId;
    },
});

/**
 * Helper to check permissions
 */
async function checkTeamPermission(
    ctx: any,
    teamId: string,
    requiredRoles: string[] = ["owner", "admin"]
) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique();

    if (!user) throw new Error("User not found");

    // System Admin has full access
    if (user.role === "admin") return { user, member: null, isSystemAdmin: true };

    const member = await ctx.db
        .query("teamMembers")
        .withIndex("by_user_team", (q: any) =>
            q.eq("userId", user._id).eq("teamId", teamId)
        )
        .unique();

    if (!member || !requiredRoles.includes(member.role)) {
        throw new Error("Insufficient permissions");
    }

    return { user, member, isSystemAdmin: false };
}

/**
 * Update team
 */
export const update = mutation({
    args: {
        teamId: v.id("teams"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        settings: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        // Only Owner or System Admin should update team details
        await checkTeamPermission(ctx, args.teamId, ["owner"]);

        const { teamId, ...fields } = args;
        await ctx.db.patch(teamId, {
            ...fields,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Add member to team
 */
export const addMember = mutation({
    args: {
        teamId: v.string(),
        userId: v.id("users"),
        role: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { user } = await checkTeamPermission(ctx, args.teamId, ["owner", "admin"]);

        // Check if already a member
        const existing = await ctx.db
            .query("teamMembers")
            .withIndex("by_user_team", (q) =>
                q.eq("userId", args.userId).eq("teamId", args.teamId)
            )
            .unique();

        if (existing) {
            throw new Error("User is already a member of this team");
        }

        return await ctx.db.insert("teamMembers", {
            teamId: args.teamId,
            userId: args.userId,
            role: args.role || "member",
            invitedBy: user._id,
            joinedAt: Date.now(),
        });
    },
});

/**
 * Remove member from team
 */
export const removeMember = mutation({
    args: {
        teamId: v.string(),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        await checkTeamPermission(ctx, args.teamId, ["owner", "admin"]);

        const membership = await ctx.db
            .query("teamMembers")
            .withIndex("by_user_team", (q) =>
                q.eq("userId", args.userId).eq("teamId", args.teamId)
            )
            .unique();

        if (!membership) {
            throw new Error("User is not a member of this team");
        }

        if (membership.role === "owner") {
            throw new Error("Cannot remove the team owner");
        }

        await ctx.db.delete(membership._id);
    },
});

/**
 * Update member role
 */
export const updateMemberRole = mutation({
    args: {
        teamId: v.string(),
        userId: v.id("users"),
        role: v.string(), // owner, admin, member
    },
    handler: async (ctx, args) => {
        // Only Owner can change roles (or System Admin)
        await checkTeamPermission(ctx, args.teamId, ["owner"]);

        const membership = await ctx.db
            .query("teamMembers")
            .withIndex("by_user_team", (q) =>
                q.eq("userId", args.userId).eq("teamId", args.teamId)
            )
            .unique();

        if (!membership) {
            throw new Error("User is not a member of this team");
        }

        await ctx.db.patch(membership._id, { role: args.role });
    },
});
