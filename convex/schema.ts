import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    projects: defineTable({
        name: v.string(),
        description: v.optional(v.string()),
        status: v.string(), // draft, active, on_hold, completed, archived
        priority: v.string(), // low, medium, high, critical
        startDate: v.optional(v.number()), // Unix timestamp
        endDate: v.optional(v.number()),
        teamId: v.string(), // Keeping as string for now to avoid breaking existing "default-team" usage unless we migrate
        ownerId: v.optional(v.id("users")), // Optional to support existing data
        templateId: v.optional(v.id("projectTemplates")),
        metadata: v.optional(v.any()),
        createdAt: v.optional(v.number()),
        updatedAt: v.optional(v.number()),
        team_members: v.optional(v.array(v.string())), // Array of names/emails as strings per requirements
        color: v.optional(v.string()), // Added for project color customization
    })
        .index("by_team", ["teamId"])
        .index("by_status", ["status"])
        .searchIndex("search_name", {
            searchField: "name",
            filterFields: ["teamId", "status"],
        }),

    tasks: defineTable({
        title: v.string(),
        description: v.optional(v.string()),
        projectId: v.id("projects"),
        assigneeId: v.optional(v.id("users")),
        creatorId: v.optional(v.id("users")),
        status: v.string(), // todo, in_progress, in_review, done, blocked
        priority: v.string(),
        dueDate: v.optional(v.number()),
        estimatedHours: v.optional(v.number()),
        actualHours: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
        labels: v.optional(v.array(v.string())), // Added for task labels UI
        parentTaskId: v.optional(v.id("tasks")),
        attachments: v.optional(v.array(v.string())), // Storage IDs
        createdAt: v.optional(v.number()),
        updatedAt: v.optional(v.number()),
        color: v.optional(v.string()), // Added for task color customization
    })
        .index("by_project", ["projectId"])
        .index("by_assignee", ["assigneeId"])
        .index("by_status", ["status"])
        .searchIndex("search_title", {
            searchField: "title",
            filterFields: ["projectId", "status"],
        }),

    subtasks: defineTable({
        title: v.string(),
        description: v.optional(v.string()),
        taskId: v.id("tasks"),
        assigneeId: v.optional(v.id("users")),
        completed: v.boolean(),
        labels: v.optional(v.array(v.string())),
        checklist: v.optional(v.array(v.object({
            id: v.string(),
            text: v.string(),
            completed: v.boolean(),
        }))),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_task", ["taskId"]),

    approvals: defineTable({
        title: v.string(),
        description: v.optional(v.string()),
        projectId: v.optional(v.id("projects")),
        taskId: v.optional(v.id("tasks")),
        requesterId: v.id("users"),
        type: v.string(), // document, decision, budget, other
        status: v.string(), // pending, approved, rejected, cancelled, revision
        workflowType: v.string(), // sequential, parallel
        currentStepIndex: v.number(),
        budget: v.optional(v.number()),
        priority: v.optional(v.string()), // low, medium, high, critical
        attachments: v.optional(v.array(v.object({
            name: v.string(),
            url: v.string(),
            type: v.string(),
            storageId: v.optional(v.id("_storage")),
            uploadedAt: v.number(),
        }))),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_project", ["projectId"])
        .index("by_status", ["status"])
        .index("by_requester", ["requesterId"])
        .index("by_task", ["taskId"]),

    approvalSteps: defineTable({
        approvalId: v.id("approvals"),
        stepNumber: v.number(),
        approverId: v.id("users"),
        status: v.string(), // pending, approved, rejected, skipped
        comments: v.optional(v.string()),
        decidedAt: v.optional(v.number()),
        createdAt: v.number(),
    })
        .index("by_approval", ["approvalId"])
        .index("by_approver", ["approverId"]),

    users: defineTable({
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        emailVerified: v.optional(v.boolean()),
        image: v.optional(v.string()),
        emailVerificationTime: v.optional(v.number()),
        phone: v.optional(v.string()), // Added for auth compatibility
        phoneVerificationTime: v.optional(v.number()), // Added for auth compatibility
        isAnonymous: v.optional(v.boolean()),
        avatar: v.optional(v.string()),
        tokenIdentifier: v.optional(v.string()),
        role: v.optional(v.string()), // admin, member
        systemRole: v.optional(v.string()), // superadmin, user
        currentTeamId: v.optional(v.string()),
        preferences: v.optional(v.object({
            theme: v.string(),
            notifications: v.boolean(),
            language: v.string(),
        })),
        createdAt: v.optional(v.number()),
        updatedAt: v.optional(v.number()),
    })
        .index("email", ["email"])
        .index("phone", ["phone"]) // Added for auth compatibility
        .index("by_token", ["tokenIdentifier"]),

    teams: defineTable({
        name: v.string(),
        description: v.optional(v.string()),
        ownerId: v.id("users"),
        settings: v.optional(v.any()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_owner", ["ownerId"]),

    teamMembers: defineTable({
        teamId: v.string(),
        userId: v.id("users"),
        role: v.string(), // owner, admin, member
        invitedBy: v.optional(v.id("users")),
        joinedAt: v.number(),
    })
        .index("by_team", ["teamId"])
        .index("by_user", ["userId"])
        .index("by_user_team", ["userId", "teamId"]),

    notifications: defineTable({
        userId: v.id("users"),
        type: v.string(),
        title: v.string(),
        message: v.string(),
        link: v.optional(v.string()), // URL to navigate when clicked
        entityId: v.optional(v.string()),
        entityType: v.optional(v.string()),
        read: v.boolean(),
        createdAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_user_read", ["userId", "read"]),

    approvalComments: defineTable({
        approvalId: v.id("approvals"),
        userId: v.id("users"),
        content: v.string(),
        attachments: v.optional(v.array(v.object({
            name: v.string(),
            url: v.string(),
            type: v.string(),
            storageId: v.optional(v.id("_storage")),
            uploadedAt: v.number(),
        }))),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_approval", ["approvalId"]),

    taskComments: defineTable({
        taskId: v.id("tasks"),
        userId: v.id("users"),
        content: v.string(),
        mentions: v.optional(v.array(v.id("users"))), // Users mentioned in comment
        attachments: v.optional(v.array(v.object({
            name: v.string(),
            url: v.string(),
            type: v.string(),
            size: v.number(),
            storageId: v.optional(v.id("_storage")),
            uploadedAt: v.number(),
        }))),
        parentCommentId: v.optional(v.id("taskComments")),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_task", ["taskId"])
        .index("by_parent", ["parentCommentId"]),

    projectComments: defineTable({
        projectId: v.id("projects"),
        userId: v.id("users"),
        content: v.string(),
        parentCommentId: v.optional(v.id("projectComments")),
        files: v.optional(v.array(v.string())), // Array of storage IDs or URLs
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_project", ["projectId"])
        .index("by_parent", ["parentCommentId"]),

    projectGuests: defineTable({
        projectId: v.id("projects"),
        email: v.string(),
        userId: v.optional(v.id("users")), // Optional, if they are a registered user
        permissions: v.array(v.string()), // view, comment, edit_tasks, create_tasks
        status: v.string(), // pending, active, revoked
        invitedBy: v.id("users"),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_project", ["projectId"])
        .index("by_email", ["email"]),

    projectTemplates: defineTable({
        name: v.string(),
        description: v.optional(v.string()),
        structure: v.any(), // JSON structure of tasks/phases
        createdBy: v.id("users"),
        createdAt: v.number(),
    }),

    files: defineTable({
        storageId: v.id("_storage"),
        fileName: v.string(),
        fileType: v.string(),
        fileSize: v.number(),
        projectId: v.optional(v.id("projects")),
        taskId: v.optional(v.id("tasks")),
        uploadedBy: v.id("users"),
        createdAt: v.number(),
    })
        .index("by_task", ["taskId"])
        .index("by_project", ["projectId"]),

    verificationTokens: defineTable({
        userId: v.id("users"),
        email: v.string(),
        token: v.string(),
        expiresAt: v.number(),
        createdAt: v.number(),
    })
        .index("by_token", ["token"])
        .index("by_user", ["userId"]),

    passwordResetTokens: defineTable({
        userId: v.id("users"),
        email: v.string(),
        token: v.string(),
        expiresAt: v.number(),
        used: v.boolean(),
        createdAt: v.number(),
    })
        .index("by_token", ["token"])
        .index("by_user", ["userId"]),

    notificationPreferences: defineTable({
        userId: v.id("users"),
        // Task notifications
        task_assigned: v.boolean(),
        deadline_reminder: v.boolean(),
        deadline_reminder_days: v.number(),
        status_change: v.boolean(),
        task_completed: v.boolean(),
        priority_change: v.boolean(),
        // Project notifications
        project_status_change: v.boolean(),
        project_member_added: v.boolean(),
        // Comment notifications
        mention_in_comment: v.boolean(),
        new_comment: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_user", ["userId"]),

    customStatuses: defineTable({
        type: v.string(), // "task" | "project"
        slug: v.string(), // key, e.g. "in_progress"
        label: v.string(), // Display name
        color: v.string(), // Hex code or tailwind class
        isDefault: v.boolean(),
        order: v.number(),
        teamId: v.optional(v.string()), // If scoped to team
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_type", ["type"])
        .index("by_team", ["teamId"]),

    customPriorities: defineTable({
        type: v.string(), // "task" | "project"
        slug: v.string(),
        label: v.string(),
        color: v.string(),
        isDefault: v.boolean(),
        order: v.number(),
        teamId: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_type", ["type"])
        .index("by_team", ["teamId"]),

    activityLogs: defineTable({
        userId: v.id("users"),
        action: v.string(),
        entityType: v.string(),
        entityId: v.optional(v.union(v.id("tasks"), v.id("projects"), v.id("approvals"), v.id("teams"), v.id("files"), v.string())),
        details: v.optional(v.any()),
        createdAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_entity", ["entityType", "entityId"]),

    taskDependencies: defineTable({
        taskId: v.id("tasks"),           // The task that depends on another
        dependsOnTaskId: v.id("tasks"),  // The task it depends on
        type: v.string(),                // "FS" | "SS" | "FF" | "SF"
        createdAt: v.number(),
    })
        .index("by_task", ["taskId"])
        .index("by_depends_on", ["dependsOnTaskId"]),
});
