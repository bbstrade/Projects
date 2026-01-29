"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    CheckCircle2,
    XCircle,
    Clock,
    FileCheck,
    User,
    MessageSquare,
    ArrowRight,
    GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { bg } from "date-fns/locale";

interface ApprovalDetailDialogProps {
    approvalId: Id<"approvals"> | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ApprovalDetailDialog({
    approvalId,
    open,
    onOpenChange,
}: ApprovalDetailDialogProps) {
    const [comments, setComments] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const approval = useQuery(
        api.approvals.get,
        approvalId ? { approvalId } : "skip"
    );
    const users = useQuery(api.users.list, {});
    const approveMutation = useMutation(api.approvals.approve);
    const rejectMutation = useMutation(api.approvals.reject);

    const getUserName = (userId: Id<"users">) => {
        const user = users?.find((u) => u._id === userId);
        return user?.name || "Неизвестен";
    };

    const handleApprove = async () => {
        if (!approvalId || !users?.[0]) return;
        setIsProcessing(true);
        try {
            await approveMutation({
                approvalId,
                approverId: users[0]._id, // In real app, use authenticated user
                comments: comments || undefined,
            });
            toast.success("Заявката беше одобрена!");
            setComments("");
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Грешка при одобрение");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!approvalId || !users?.[0]) return;
        setIsProcessing(true);
        try {
            await rejectMutation({
                approvalId,
                approverId: users[0]._id,
                comments: comments || undefined,
            });
            toast.success("Заявката беше отхвърлена");
            setComments("");
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Грешка при отхвърляне");
        } finally {
            setIsProcessing(false);
        }
    };

    const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
        pending: { label: "Изчакващ", variant: "secondary" },
        approved: { label: "Одобрен", variant: "default" },
        rejected: { label: "Отхвърлен", variant: "destructive" },
        cancelled: { label: "Отменен", variant: "outline" },
    };

    const typeLabels: Record<string, string> = {
        document: "📄 Документ",
        decision: "✅ Решение",
        budget: "💰 Бюджет",
        other: "📋 Друго",
    };

    if (!approval) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-pulse text-muted-foreground">
                            Зареждане...
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    const stepStatusIcon = (status: string) => {
        switch (status) {
            case "approved":
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "rejected":
                return <XCircle className="h-5 w-5 text-red-500" />;
            default:
                return <Clock className="h-5 w-5 text-yellow-500" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <FileCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-lg">{approval.title}</DialogTitle>
                            <DialogDescription className="flex items-center gap-2 mt-1">
                                <span>{typeLabels[approval.type] || approval.type}</span>
                                <span className="text-muted-foreground">•</span>
                                <span>
                                    {format(new Date(approval.createdAt), "d MMM yyyy", {
                                        locale: bg,
                                    })}
                                </span>
                            </DialogDescription>
                        </div>
                        <Badge variant={statusLabels[approval.status]?.variant || "secondary"}>
                            {statusLabels[approval.status]?.label || approval.status}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Description */}
                    {approval.description && (
                        <div className="rounded-lg border p-3 bg-muted/30">
                            <p className="text-sm text-muted-foreground">{approval.description}</p>
                        </div>
                    )}

                    {/* Workflow Info */}
                    <div className="flex items-center gap-2 text-sm">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Работен процес:</span>
                        <Badge variant="outline" className="font-normal">
                            {approval.workflowType === "sequential"
                                ? "Последователно"
                                : "Паралелно"}
                        </Badge>
                    </div>

                    <Separator />

                    {/* Approval Steps */}
                    <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Одобряващи ({approval.steps?.length || 0})
                        </h4>
                        <ScrollArea className="h-[180px] rounded-md border">
                            <div className="p-3 space-y-2">
                                {approval.steps?.map((step, index) => (
                                    <div
                                        key={step._id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                                            step.status === "approved" && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
                                            step.status === "rejected" && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
                                            step.status === "pending" && "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
                                        )}
                                    >
                                        {stepStatusIcon(step.status)}
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">
                                                {getUserName(step.approverId)}
                                            </div>
                                            {step.comments && (
                                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                    <MessageSquare className="h-3 w-3" />
                                                    {step.comments}
                                                </p>
                                            )}
                                            {step.decidedAt && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {format(new Date(step.decidedAt), "d MMM yyyy, HH:mm", {
                                                        locale: bg,
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                        <Badge
                                            variant={
                                                step.status === "approved"
                                                    ? "default"
                                                    : step.status === "rejected"
                                                        ? "destructive"
                                                        : "secondary"
                                            }
                                            className="text-xs"
                                        >
                                            {step.status === "approved"
                                                ? "Одобрен"
                                                : step.status === "rejected"
                                                    ? "Отхвърлен"
                                                    : "Изчакващ"}
                                        </Badge>
                                        {approval.workflowType === "sequential" &&
                                            index < (approval.steps?.length || 0) - 1 && (
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Comments Input (only if pending) */}
                    {approval.status === "pending" && (
                        <>
                            <Separator />
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Коментар (по избор)
                                </label>
                                <Textarea
                                    placeholder="Добавете коментар към вашето решение..."
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows={2}
                                    className="resize-none"
                                />
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {approval.status === "pending" ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isProcessing}
                            >
                                Затвори
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={isProcessing}
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Отхвърли
                            </Button>
                            <Button onClick={handleApprove} disabled={isProcessing}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Одобри
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Затвори
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
