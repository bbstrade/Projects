import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

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
        requesterId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        let q = ctx.db.query("approvals").order("desc");

        if (args.status) {
            q = q.filter((q) => q.eq(q.field("status"), args.status));
        }

        if (args.projectId) {
            q = q.filter((q) => q.eq(q.field("projectId"), args.projectId));
        }

        if (args.requesterId) {
            q = q.filter((q) => q.eq(q.field("requesterId"), args.requesterId));
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
        budget: v.optional(v.number()),
        priority: v.optional(v.string()),
        attachments: v.optional(v.array(v.object({
            name: v.string(),
            url: v.string(),
            type: v.string(),
            storageId: v.optional(v.id("_storage")),
            uploadedAt: v.number(),
        }))),
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
            budget: args.budget,
            priority: args.priority,
            attachments: args.attachments,
            createdAt: now,
            updatedAt: now,
        });

        // Create approval steps
        if (args.workflowType === "parallel") {
            // All approvers active immediately
            for (let i = 0; i < args.approverIds.length; i++) {
                await ctx.db.insert("approvalSteps", {
                    approvalId,
                    approverId: args.approverIds[i],
                    stepNumber: 0, // All at same step
                    status: "pending",
                    createdAt: now,
                });
            }
        } else {
            // Sequential
            for (let i = 0; i < args.approverIds.length; i++) {
                await ctx.db.insert("approvalSteps", {
                    approvalId,
                    approverId: args.approverIds[i],
                    stepNumber: i,
                    status: i === 0 ? "pending" : "pending", // Technically all are pending but UI shows current
                    createdAt: now,
                });
            }
        }

        // Notify Approvers
        // For parallel: notify all. For sequential: notify first.
        const approversToNotifyIds = args.workflowType === "parallel"
            ? args.approverIds
            : [args.approverIds[0]];

        const approversToNotify = await Promise.all(
            approversToNotifyIds.map(id => ctx.db.get(id))
        );

        const recipientEmails = approversToNotify
            .map(u => u?.email)
            .filter((email): email is string => !!email);

        if (recipientEmails.length > 0) {
            await ctx.scheduler.runAfter(0, internal.emails.sendEmail, {
                to: recipientEmails,
                subject: `New Approval Request: ${args.title}`,
                html: `
                    <h1>New Approval Request</h1>
                    <p>You have been requested to approve: <strong>${args.title}</strong></p>
                    <p>${args.description || ""}</p>
                    <p>Please log in to the dashboard to review.</p>
                `,
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

        // Notify Requester
        const requester = await ctx.db.get(approval.requesterId);
        if (requester?.email) {
            await ctx.scheduler.runAfter(0, internal.emails.sendEmail, {
                to: requester.email,
                subject: `Approval Rejected: ${approval.title}`,
                html: `<p>Your request <strong>${approval.title}</strong> has been rejected.</p><p>Comments: ${args.comments || "None"}</p>`,
            });
        }

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

/**
 * Request revision (by approver)
 */
export const requestRevision = mutation({
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

        const now = Date.now();

        // Update status to revision
        await ctx.db.patch(args.approvalId, {
            status: "revision",
            currentStepIndex: 0,
            updatedAt: now,
        });

        // Reset all steps to pending
        const steps = await ctx.db
            .query("approvalSteps")
            .withIndex("by_approval", (q) => q.eq("approvalId", args.approvalId))
            .collect();

        for (const step of steps) {
            await ctx.db.patch(step._id, {
                status: "pending",
                decidedAt: undefined,
                comments: undefined,
            });
        }

        // If comments provided, add as a comment
        if (args.comments) {
            await ctx.db.insert("approvalComments", {
                approvalId: args.approvalId,
                userId: approverId,
                content: args.comments,
                createdAt: now,
                updatedAt: now,
            });
        }

        // Notify Requester
        const requester = await ctx.db.get(approval.requesterId);
        if (requester?.email) {
            await ctx.scheduler.runAfter(0, internal.emails.sendEmail, {
                to: requester.email,
                subject: `Revision Requested: ${approval.title}`,
                html: `<p>Revisions have been requested for <strong>${approval.title}</strong>.</p><p>Comments: ${args.comments || "None"}</p>`,
            });
        }

        return { success: true };
    },
});

/**
 * Add a comment to an approval
 */
export const addComment = mutation({
    args: {
        approvalId: v.id("approvals"),
        content: v.string(),
        attachments: v.optional(v.array(v.object({
            name: v.string(),
            url: v.string(),
            type: v.string(),
            storageId: v.optional(v.id("_storage")),
            uploadedAt: v.number(),
        }))),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");

        await ctx.db.insert("approvalComments", {
            approvalId: args.approvalId,
            userId: user._id,
            content: args.content,
            attachments: args.attachments,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

/**
 * Get comments for an approval
 */
export const getComments = query({
    args: { approvalId: v.id("approvals") },
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query("approvalComments")
            .withIndex("by_approval", (q) => q.eq("approvalId", args.approvalId))
            .order("asc") // Older first
            .collect();

        // Enrich with user info
        const commentsWithUser = await Promise.all(
            comments.map(async (c) => {
                const user = await ctx.db.get(c.userId);
                return { ...c, user };
            })
        );

        return commentsWithUser;
    },
});
