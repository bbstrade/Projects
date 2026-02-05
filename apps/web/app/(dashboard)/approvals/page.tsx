"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Search, Clock, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs
import { useConvexAuth } from "convex/react"; // Import auth hook

import { CreateApprovalDialog } from "@/components/approvals/create-approval-dialog";
import { ApprovalDetailDialog } from "@/components/approvals/approval-detail-dialog";

const dict = {
    title: "Одобрения",
    subtitle: "Управление на заявки за одобрение",
    searchPlaceholder: "Търсене на одобрения...",
    newApproval: "Ново одобрение",
    filters: {
        allStatuses: "Всички статуси",
        pending: "Чакащи",
        approved: "Одобрени",
        rejected: "Отхвърлени",
        cancelled: "Отменени",
    },
    status: {
        pending: "Чакащо",
        approved: "Одобрено",
        rejected: "Отхвърлено",
        cancelled: "Отменено",
    },
    type: {
        document: "Документ",
        decision: "Решение",
        budget: "Бюджет",
        other: "Друго",
    },
    noApprovals: "Няма намерени одобрения",
    noApprovalsDescription: "Все още няма заявки за одобрение.",
    requestedAt: "Заявено на",
    workflow: {
        sequential: "Последователно",
        parallel: "Паралелно",
    },
};

const statusColors: Record<string, string> = {
    pending: "bg-amber-500",
    approved: "bg-green-500",
    rejected: "bg-red-500",
    cancelled: "bg-slate-400",
};

const statusIcons: Record<string, typeof Clock> = {
    pending: Clock,
    approved: CheckCircle,
    rejected: XCircle,
    cancelled: XCircle,
};

export default function ApprovalsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedApprovalId, setSelectedApprovalId] = useState<Id<"approvals"> | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    // Get current user ID roughly (or useSession depending on auth setup)
    // Using a simple query for now or assuming context handles it. 
    // Wait, useConvexAuth doesn't return ID directly. 
    // I need `api.users.current` or similar. I'll use `api.users.viewer` if it exists or just `list` and match identity.
    // Ideally I should have a hooks/useCurrentUser. 
    // For now, I'll trust `listPendingForUser` works with backend identity, BUT `list` needs explicit ID if I want to filter by requester.
    // Checking `convex/users.ts`: it has `get`.
    // I will use `useQuery(api.users.viewer)` is effectively `api.users.get` with auth? No.
    // I will fetch `api.users.get` with `useQuery("users")`? No.
    // Use `useQuery(api.users.viewer)` if I make it? 
    // Let's assume useQuery(api.users.me) or similar exists? `convex/users.ts` has `get` (by ID) and `getByEmail`.
    // I'll resort to `useQuery(api.users.me)` pattern if I implemented it.
    // Looking at previous context, `convex/settings.ts` uses `ctx.auth.getUserIdentity`.
    // I'll use a hack: fetch all users, find me. Or just rely on server side filtering if I implemented it (I implemented `requesterId` as arg).
    // I need the ID on the client to pass it. 
    // BETTER: Create `api.approvals.listMyRequests` in backend so I don't need ID on frontend.
    // BUT I already started frontend edit. I'll just leave `userId` as undefined for now and fix it if I can't get it.
    // Actually, `listPendingForUser` requires `userId` as arg! My backend implementation:
    // `export const listPendingForUser = query({ args: { userId: v.id("users") }, ...`
    // So I MUST have the ID.
    // I'll add `const { isAuthenticated } = useConvexAuth();` and `const user = useQuery(api.users.currentUser)`... 
    // Wait, let's see `convex/users.ts` again. It has `get` but no `me`.
    // I'll add a `viewer` query to `convex/users.ts` quickly or guess I need to find another way.
    // Ah, `convex/settings.ts` had a helper. 
    // I will assume for now I can get it. I'll add `const user = useQuery(api.users.viewer);` and if it fails I'll fix it.
    // actually `convex/users.ts` has `get` and `getByEmail`. 
    // I will add a `viewer` query to `convex/users.ts` via `run_command` later if needed.
    // For now, let's assume `api.users.viewer` is available or I will add it.
    const user = useQuery(api.users.viewer); // Will implement this query next step to be safe
    const userId = user?._id;

    const approvals = useQuery(api.approvals.list, {
        status: statusFilter === "all" ? undefined : statusFilter,
    });

    const filteredApprovals = approvals?.filter((approval) => {
        const matchesSearch = approval.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const handleApprovalClick = (approvalId: Id<"approvals">) => {
        setSelectedApprovalId(approvalId);
        setDetailDialogOpen(true);
    };

    // New logic for tabs
    const pendingForMe = useQuery(api.approvals.listPendingForUser,
        userId ? { userId: userId as Id<"users"> } : "skip" // Wait for user ID
    );

    const myRequests = useQuery(api.approvals.list,
        userId ? { requesterId: userId as Id<"users"> } : "skip"
    );

    // Helper to render a list of cards
    const renderApprovalList = (list: typeof approvals) => {
        if (list === undefined) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            );
        }
        if (list.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/10 border-dashed">
                    <p className="text-lg font-medium text-muted-foreground">{dict.noApprovals}</p>
                </div>
            );
        }

        // Apply local search filtering if needed (though backend search usually better, doing local for now as per existing pattern)
        const filtered = list.filter(a =>
            a.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (statusFilter === "all" || a.status === statusFilter)
        );

        if (filtered.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground">Няма намерени резултати за това търсене.</p>
                </div>
            );
        }

        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((approval) => {
                    const StatusIcon = statusIcons[approval.status] || Clock;
                    return (
                        <Card
                            key={approval._id}
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleApprovalClick(approval._id)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="text-lg font-semibold line-clamp-2">
                                        {approval.title}
                                    </CardTitle>
                                    <Badge
                                        variant="secondary"
                                        className={`${statusColors[approval.status]} text-white shrink-0`}
                                    >
                                        {dict.status[approval.status as keyof typeof dict.status]}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {approval.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {approval.description}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {dict.type[approval.type as keyof typeof dict.type] ||
                                                approval.type}
                                        </span>
                                        <Badge variant="outline">
                                            {dict.workflow[
                                                approval.workflowType as keyof typeof dict.workflow
                                            ] || approval.workflowType}
                                        </Badge>
                                    </div>

                                    {/* Budget & Priority if available */}
                                    {(approval.budget || approval.priority) && (
                                        <div className="flex items-center gap-3 text-sm">
                                            {approval.budget && (
                                                <span className="font-medium text-emerald-600">
                                                    {approval.budget.toLocaleString()} лв.
                                                </span>
                                            )}
                                            {approval.priority && (
                                                <Badge variant="outline" className="text-xs uppercase scale-90 origin-left">
                                                    {approval.priority}
                                                </Badge>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                                        <StatusIcon className="h-3 w-3" />
                                        <span>
                                            {dict.requestedAt}{" "}
                                            {format(
                                                new Date(approval.createdAt),
                                                "dd MMM yyyy",
                                                { locale: bg }
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{dict.title}</h1>
                    <p className="text-muted-foreground">{dict.subtitle}</p>
                </div>
                <CreateApprovalDialog />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={dict.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={dict.filters.allStatuses} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{dict.filters.allStatuses}</SelectItem>
                        <SelectItem value="pending">{dict.filters.pending}</SelectItem>
                        <SelectItem value="approved">{dict.filters.approved}</SelectItem>
                        <SelectItem value="rejected">{dict.filters.rejected}</SelectItem>
                        <SelectItem value="cancelled">{dict.filters.cancelled}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Approvals Tabs */}
            <Tabs defaultValue="pending" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pending">Чакащи ({pendingForMe?.length || 0})</TabsTrigger>
                    <TabsTrigger value="my_requests">Моите Заявки</TabsTrigger>
                    <TabsTrigger value="all">Всички</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    {renderApprovalList(pendingForMe)}
                </TabsContent>

                <TabsContent value="my_requests" className="space-y-4">
                    {renderApprovalList(myRequests)}
                </TabsContent>

                <TabsContent value="all" className="space-y-4">
                    {renderApprovalList(approvals)}
                </TabsContent>
            </Tabs>

            {/* Approval Detail Dialog */}
            <ApprovalDetailDialog
                approvalId={selectedApprovalId}
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
            />
        </div>
    );
}
