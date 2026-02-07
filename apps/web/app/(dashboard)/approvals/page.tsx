"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
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
import { bg, enUS } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs
import { useConvexAuth } from "convex/react"; // Import auth hook
import { useLanguage } from "@/components/language-provider";

import { CreateApprovalDialog } from "@/components/approvals/create-approval-dialog";
import { ApprovalDetailDialog } from "@/components/approvals/approval-detail-dialog";

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
    const { t, lang } = useLanguage();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedApprovalId, setSelectedApprovalId] = useState<Id<"approvals"> | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    const dateLocale = lang === "bg" ? bg : enUS;

    // Get current user ID
    const user = useQuery(api.users.viewer);
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
    const renderApprovalList = (list: typeof approvals | typeof pendingForMe) => {
        if (list === undefined) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            );
        }

        const validList = list.filter((a) => a !== null) as Doc<"approvals">[];

        if (validList.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/10 border-dashed">
                    <p className="text-lg font-medium text-muted-foreground">{t("noApprovals")}</p>
                </div>
            );
        }

        // Apply local search filtering
        const filtered = validList.filter(a =>
            a.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (statusFilter === "all" || a.status === statusFilter)
        );

        if (filtered.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground">{t("noResultsFound")}</p>
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
                                        {t(`status${approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}`)}
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
                                            {t(`type${approval.type.charAt(0).toUpperCase() + approval.type.slice(1)}`)}
                                        </span>
                                        <Badge variant="outline">
                                            {t(`workflow${approval.workflowType.charAt(0).toUpperCase() + approval.workflowType.slice(1)}`)}
                                        </Badge>
                                    </div>

                                    {/* Budget & Priority if available */}
                                    {(approval.budget || approval.priority) && (
                                        <div className="flex items-center gap-3 text-sm">
                                            {approval.budget && (
                                                <span className="font-medium text-emerald-600">
                                                    {approval.budget.toLocaleString()} {lang === "bg" ? "лв." : "BGN"}
                                                </span>
                                            )}
                                            {approval.priority && (
                                                <Badge variant="outline" className="text-xs uppercase scale-90 origin-left">
                                                    {t(`prio${approval.priority.charAt(0).toUpperCase() + approval.priority.slice(1)}`)}
                                                </Badge>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                                        <StatusIcon className="h-3 w-3" />
                                        <span>
                                            {t("requestedAt")}{" "}
                                            {format(
                                                new Date(approval.createdAt),
                                                "dd MMM yyyy",
                                                { locale: dateLocale }
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
                    <h1 className="text-3xl font-bold tracking-tight">{t("approvalsTitle")}</h1>
                    <p className="text-muted-foreground">{t("approvalsSubtitle")}</p>
                </div>
                <CreateApprovalDialog />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={t("approvalsSearch")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t("filterAllStatuses")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("filterAllStatuses")}</SelectItem>
                        <SelectItem value="pending">{t("filterPending")}</SelectItem>
                        <SelectItem value="approved">{t("filterApproved")}</SelectItem>
                        <SelectItem value="rejected">{t("filterRejected")}</SelectItem>
                        <SelectItem value="cancelled">{t("filterCancelled")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Approvals Tabs */}
            <Tabs defaultValue="pending" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pending">{t("filterPending")} ({pendingForMe?.length || 0})</TabsTrigger>
                    <TabsTrigger value="my_requests">{t("myRequests") || (lang === "bg" ? "Моите Заявки" : "My Requests")}</TabsTrigger>
                    <TabsTrigger value="all">{lang === "bg" ? "Всички" : "All"}</TabsTrigger>
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

