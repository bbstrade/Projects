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
 * Get team by string ID (for cases where teamId is stored as string)
 */
export const getByStringId = query({
    args: { teamId: v.string() },
    handler: async (ctx, args) => {
        // Try to find team by treating the string as an ID
        try {
            const teams = await ctx.db.query("teams").collect();
            return teams.find(t => t._id === args.teamId) || null;
        } catch {
            return null;
        }
    },
});

/**
 * List all teams
 */
/**
 * List all teams (Filtered by permissions)
 */
export const list = query({
    args: {
        view: v.optional(v.string()), // "all" | "my"
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) return [];

        // System Admin sees all teams if view="all"
        if (user.role === "admin" && args.view === "all") {
            const teams = await ctx.db.query("teams").order("desc").collect();
            // For admins viewing all, we don't necessarily have a role in every team.
            // We can check if they are a member, or just return null role.
            // Let's attach role if they ARE a member.
            const memberships = await ctx.db
                .query("teamMembers")
                .withIndex("by_user", (q) => q.eq("userId", user._id))
                .collect();

            const roleByTeamId = new Map(memberships.map(m => [m.teamId, m.role]));

            return teams.map(t => ({
                ...t,
                role: roleByTeamId.get(t._id) || (user.role === "admin" ? "system_admin" : null)
            }));
        }

        // Regular users (or default view) see only their teams
        const memberships = await ctx.db
            .query("teamMembers")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        const results = await Promise.all(
            memberships.map(async (m) => {
                const team = await ctx.db.get(m.teamId as Id<"teams">);
                if (!team) return null;
                return {
                    ...team,
                    role: m.role
                };
            })
        );

        return results.filter((t): t is NonNullable<typeof t> => t !== null);
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

        // Automatically switch to the new team
        // We only switch if the user doesn't have a current team, or if we decide to force switch.
        // For now, let's force switch to the newly created team as it's the expected UX.
        await ctx.db.patch(user._id, {
            currentTeamId: teamId,
        });

        return teamId;
    },
});

/**
 * Delete a team
 */
export const deleteTeam = mutation({
    args: { teamId: v.id("teams") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");

        const team = await ctx.db.get(args.teamId);
        if (!team) throw new Error("Team not found");

        // Only owner or system admin can delete
        if (team.ownerId !== user._id && user.role !== "admin") {
            throw new Error("Insufficient permissions");
        }

        // Delete all members
        const members = await ctx.db
            .query("teamMembers")
            .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
            .collect();

        for (const member of members) {
            await ctx.db.delete(member._id);
        }

        // Delete the team
        await ctx.db.delete(args.teamId);

        // If this was the user's current team, unset it
        // We might want to do this for all users who had this team active, strictly speaking.
        // For now, handling the requester is the critical part.
        if (user.currentTeamId === args.teamId) {
            await ctx.db.patch(user._id, { currentTeamId: undefined });
        }
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

/**
 * Add member to team by Email
 */
export const addMemberByEmail = mutation({
    args: {
        teamId: v.string(),
        email: v.string(),
        role: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { user: currentUser } = await checkTeamPermission(ctx, args.teamId, ["owner", "admin"]);

        const userToAdd = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", args.email))
            .unique();

        if (!userToAdd) {
            throw new Error("User with this email not found");
        }

        // Check if already a member
        const existing = await ctx.db
            .query("teamMembers")
            .withIndex("by_user_team", (q) =>
                q.eq("userId", userToAdd._id).eq("teamId", args.teamId)
            )
            .unique();

        if (existing) {
            throw new Error("User is already a member of this team");
        }

        return await ctx.db.insert("teamMembers", {
            teamId: args.teamId,
            userId: userToAdd._id,
            role: args.role || "member",
            invitedBy: currentUser._id,
            joinedAt: Date.now(),
        });
    },
});
