import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get notification by ID
 */
export const get = query({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.notificationId);
    },
});

/**
 * List notifications for a user
 */
export const list = query({
    args: {
        userId: v.id("users"),
        unreadOnly: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let q = ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc");

        if (args.unreadOnly) {
            q = q.filter((q) => q.eq(q.field("read"), false));
        }

        const notifications = await q.collect();

        if (args.limit) {
            return notifications.slice(0, args.limit);
        }

        return notifications;
    },
});

/**
 * Get unread count for a user
 */
export const unreadCount = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_user_read", (q) =>
                q.eq("userId", args.userId).eq("read", false)
            )
            .collect();

        return unread.length;
    },
});

/**
 * Create a notification
 */
export const create = mutation({
    args: {
        userId: v.id("users"),
        type: v.string(),
        title: v.string(),
        message: v.string(),
        entityId: v.optional(v.string()),
        entityType: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("notifications", {
            userId: args.userId,
            type: args.type,
            title: args.title,
            message: args.message,
            entityId: args.entityId,
            entityType: args.entityType,
            read: false,
            createdAt: Date.now(),
        });
    },
});

/**
 * Mark notification as read
 */
export const markAsRead = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.notificationId, { read: true });
    },
});

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_user_read", (q) =>
                q.eq("userId", args.userId).eq("read", false)
            )
            .collect();

        for (const notification of unread) {
            await ctx.db.patch(notification._id, { read: true });
        }

        return { marked: unread.length };
    },
});

/**
 * Delete old notifications (cleanup)
 */
export const deleteOld = mutation({
    args: {
        userId: v.id("users"),
        olderThanDays: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const daysAgo = args.olderThanDays || 30;
        const cutoff = Date.now() - daysAgo * 24 * 60 * 60 * 1000;

        const oldNotifications = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.lt(q.field("createdAt"), cutoff))
            .collect();

        for (const notification of oldNotifications) {
            await ctx.db.delete(notification._id);
        }

        return { deleted: oldNotifications.length };
    },
});
