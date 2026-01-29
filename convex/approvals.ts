import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get approval by ID
 */
export const get = query({
    args: { approvalId: v.id("approvals") },
    handler: async (ctx, args) => {
        const approval = await ctx.db.get(args.approvalId);
        if (!approval) return null;

        // Get approval steps
        const steps = await ctx.db
            .query("approvalSteps")
            .withIndex("by_approval", (q) => q.eq("approvalId", args.approvalId))
            .collect();

        return { ...approval, steps };
    },
});

/**
 * List approvals with optional filters
 */
export const list = query({
    args: {
        status: v.optional(v.string()),
        projectId: v.optional(v.id("projects")),
    },
    handler: async (ctx, args) => {
        let q = ctx.db.query("approvals").order("desc");

        if (args.status) {
            q = q.filter((q) => q.eq(q.field("status"), args.status));
        }

        if (args.projectId) {
            q = q.filter((q) => q.eq(q.field("projectId"), args.projectId));
        }

        return await q.collect();
    },
});

/**
 * List approvals pending for a specific user
 */
export const listPendingForUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const pendingSteps = await ctx.db
            .query("approvalSteps")
            .withIndex("by_approver", (q) => q.eq("approverId", args.userId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();

        const approvals = await Promise.all(
            pendingSteps.map((step) => ctx.db.get(step.approvalId))
        );

        return approvals.filter(Boolean);
    },
});

/**
 * Create a new approval request
 */
export const create = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        projectId: v.optional(v.id("projects")),
        taskId: v.optional(v.id("tasks")),
        type: v.string(), // document, decision, budget, other
        workflowType: v.string(), // sequential, parallel
        approverIds: v.array(v.id("users")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");
        const requesterId = user._id;

        const now = Date.now();

        // Create the approval
        const approvalId = await ctx.db.insert("approvals", {
            title: args.title,
            description: args.description,
            projectId: args.projectId,
            taskId: args.taskId,
            requesterId,
            type: args.type,
            status: "pending",
            workflowType: args.workflowType,
            currentStepIndex: 0,
            createdAt: now,
            updatedAt: now,
        });

        // Create approval steps for each approver
        for (let i = 0; i < args.approverIds.length; i++) {
            await ctx.db.insert("approvalSteps", {
                approvalId,
                stepNumber: i,
                approverId: args.approverIds[i],
                status: i === 0 || args.workflowType === "parallel" ? "pending" : "pending",
                createdAt: now,
            });
        }

        return approvalId;
    },
});

/**
 * Approve a step
 */
export const approve = mutation({
    args: {
        approvalId: v.id("approvals"),
        comments: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");
        const approverId = user._id;

        const approval = await ctx.db.get(args.approvalId);
        if (!approval) throw new Error("Approval not found");
        if (approval.status !== "pending") throw new Error("Approval is not pending");

        // Find the step for this approver
        const step = await ctx.db
            .query("approvalSteps")
            .withIndex("by_approval", (q) => q.eq("approvalId", args.approvalId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("approverId"), approverId),
                    q.eq(q.field("status"), "pending")
                )
            )
            .first();

        if (!step) throw new Error("No pending step found for this user");

        const now = Date.now();

        // Update the step
        await ctx.db.patch(step._id, {
            status: "approved",
            comments: args.comments,
            decidedAt: now,
        });

        // Check if all steps are approved
        const allSteps = await ctx.db
            .query("approvalSteps")
            .withIndex("by_approval", (q) => q.eq("approvalId", args.approvalId))
            .collect();

        const allApproved = allSteps.every(
            (s) => s._id === step._id ? true : s.status === "approved"
        );

        if (allApproved) {
            await ctx.db.patch(args.approvalId, {
                status: "approved",
                updatedAt: now,
            });
        } else if (approval.workflowType === "sequential") {
            // Move to next step
            await ctx.db.patch(args.approvalId, {
                currentStepIndex: approval.currentStepIndex + 1,
                updatedAt: now,
            });
        }

        return { success: true };
    },
});

/**
 * Reject an approval
 */
export const reject = mutation({
    args: {
        approvalId: v.id("approvals"),
        comments: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");
        const approverId = user._id;

        const approval = await ctx.db.get(args.approvalId);
        if (!approval) throw new Error("Approval not found");
        if (approval.status !== "pending") throw new Error("Approval is not pending");

        // Find the step for this approver
        const step = await ctx.db
            .query("approvalSteps")
            .withIndex("by_approval", (q) => q.eq("approvalId", args.approvalId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("approverId"), approverId),
                    q.eq(q.field("status"), "pending")
                )
            )
            .first();

        if (!step) throw new Error("No pending step found for this user");

        const now = Date.now();

        // Update the step
        await ctx.db.patch(step._id, {
            status: "rejected",
            comments: args.comments,
            decidedAt: now,
        });

        // Reject the whole approval
        await ctx.db.patch(args.approvalId, {
            status: "rejected",
            updatedAt: now,
        });

        return { success: true };
    },
});

/**
 * Cancel an approval (by requester)
 */
export const cancel = mutation({
    args: {
        approvalId: v.id("approvals"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");
        const requesterId = user._id;

        const approval = await ctx.db.get(args.approvalId);
        if (!approval) throw new Error("Approval not found");

        if (approval.requesterId !== requesterId) {
            throw new Error("Only the requester can cancel this approval");
        }
        if (approval.status !== "pending") {
            throw new Error("Can only cancel pending approvals");
        }

        await ctx.db.patch(args.approvalId, {
            status: "cancelled",
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});
