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

            {/* Approvals List */}
            {filteredApprovals === undefined ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : filteredApprovals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-lg font-medium text-muted-foreground">
                        {dict.noApprovals}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {dict.noApprovalsDescription}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredApprovals.map((approval) => {
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

                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
            )}

            {/* Approval Detail Dialog */}
            <ApprovalDetailDialog
                approvalId={selectedApprovalId}
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
            />
        </div>
    );
}
