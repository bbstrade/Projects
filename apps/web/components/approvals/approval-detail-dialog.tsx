"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input"; // Import Input
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar
import {
    CheckCircle2,
    XCircle,
    Clock,
    FileCheck,
    User,
    MessageSquare,
    ArrowRight,
    GitBranch,
    AlertCircle,
    Send,
    Paperclip,
    Download,
    RotateCcw, // Icon for Revision
    FileText,
    Check, // Added from instruction
    X, // Added from instruction
    ChevronRight, // Added from instruction
    CornerDownRight // Added from instruction
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
    const [commentText, setCommentText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("details");
    const [selectedFile, setSelectedFile] = useState<File | null>(null); // New state for file

    const approval = useQuery(
        api.approvals.get,
        approvalId ? { approvalId } : "skip"
    );
    const commentsList = useQuery(
        api.approvals.getComments,
        approvalId ? { approvalId } : "skip"
    ); // Fetch comments
    const users = useQuery(api.users.list, {});
    const approveMutation = useMutation(api.approvals.approve);
    const rejectMutation = useMutation(api.approvals.reject);
    const requestRevision = useMutation(api.approvals.requestRevision); // Mutation for revision
    const addComment = useMutation(api.approvals.addComment); // Mutation for comments
    const generateUploadUrl = useMutation(api.files.generateUploadUrl); // Mutation for upload URL

    const viewer = useQuery(api.users.viewer);
    const currentUserId = viewer?._id;

    const getUserName = (userId: Id<"users">) => {
        const user = users?.find((u) => u._id === userId);
        return user?.name || "Неизвестен";
    };

    // Determine if user can act
    // For parallel: any pending step for this user.
    // For sequential: only if it matches current step index.
    const userStep = approval?.steps?.find(s => s.approverId === currentUserId);

    const canApprove = useMemo(() => {
        if (!approval || !currentUserId || !userStep) return false;
        if (approval.status !== 'pending') return false;

        if (approval.workflowType === 'parallel') {
            return userStep.status === 'pending';
        } else {
            // Sequential: must be current step
            return approval.currentStepIndex === userStep.stepNumber && userStep.status === 'pending';
        }
    }, [approval, currentUserId, userStep]);

    const handleApprove = async () => {
        // Placeholder for confirmation required (e.g. if budget > X) - mock for now
        const confirmationRequired = false;
        if (!commentText && confirmationRequired) {
            toast.error("Please add a comment");
            return;
        }
        setIsSubmitting(true);
        try {
            await approveMutation({ approvalId: approvalId!, comments: commentText || undefined });
            toast.success("Заявката е одобрена");
            setCommentText("");
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Възникна грешка при одобряването");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        setIsSubmitting(true);
        try {
            await rejectMutation({ approvalId: approvalId!, comments: commentText || undefined });
            toast.success("Заявката е отхвърлена");
            setCommentText("");
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Възникна грешка при отхвърлянето");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestRevision = async () => {
        if (!commentText) {
            toast.error("Моля добавете коментар за какво се изисква редакция");
            return;
        }
        setIsSubmitting(true);
        try {
            await requestRevision({ approvalId: approvalId!, comments: commentText });
            toast.success("Изпратена е заявка за редакция");
            setCommentText("");
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Грешка при заявка за редакция");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddComment = async () => {
        if ((!commentText.trim() && !selectedFile) || !approvalId) return;
        setIsSubmitting(true);
        try {
            let attachments = undefined;
            if (selectedFile) {
                // 1. Get upload URL
                const postUrl = await generateUploadUrl();
                // 2. Upload file
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": selectedFile.type },
                    body: selectedFile,
                });
                if (!result.ok) throw new Error("Upload failed");
                const { storageId } = await result.json();

                attachments = [{
                    name: selectedFile.name,
                    type: selectedFile.type,
                    url: "",
                    storageId: storageId as Id<"_storage">,
                    uploadedAt: Date.now(),
                }];
            }

            await addComment({ approvalId, content: commentText, attachments });
            setCommentText("");
            setSelectedFile(null);
            toast.success("Коментарът е добавен");
        } catch (error: any) {
            toast.error(error.message || "Грешка при добавяне на коментар");
        } finally {
            setIsSubmitting(false);
        }
    };

    const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
        pending: { label: "Изчакващ", variant: "secondary" },
        approved: { label: "Одобрен", variant: "default" },
        rejected: { label: "Отхвърлен", variant: "destructive" },
        cancelled: { label: "Отменен", variant: "outline" },
        revision_requested: { label: "Изисква редакция", variant: "destructive" },
    };

    const typeLabels: Record<string, string> = {
        document: "📄 Документ",
        decision: "✅ Решение",
        budget: "💰 Бюджет",
        other: "📋 Друго",
    };

    // Mock dict for statusColors, replace with actual logic if available
    const statusColors: Record<string, string> = {
        pending: "bg-yellow-500",
        approved: "bg-green-500",
        rejected: "bg-red-500",
        cancelled: "bg-gray-500",
        revision_requested: "bg-orange-500",
    };

    // Mock dict for status labels, replace with actual logic if available
    const dict = {
        status: {
            pending: "Изчакващ",
            approved: "Одобрен",
            rejected: "Отхвърлен",
            cancelled: "Отменен",
            revision_requested: "Изисква редакция",
        }
    };


    if (!approval) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="sr-only">Зареждане</DialogTitle>
                        <DialogDescription className="sr-only">
                            Зареждане на детайли за одобрение
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-pulse text-muted-foreground">
                            Зареждане...
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <FileCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-lg">{approval.title}</DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-1">
                                {typeLabels[approval.type] || approval.type} • {format(new Date(approval.createdAt), "d MMM yyyy", {
                                    locale: bg,
                                })}
                            </DialogDescription>
                        </div>
                        <Badge variant={statusLabels[approval.status]?.variant || "secondary"}>
                            {statusLabels[approval.status]?.label || approval.status}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-4 flex-1 overflow-hidden">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(approval.createdAt), "dd MMM yyyy, HH:mm", {
                                locale: bg,
                            })}
                        </div>
                        {/* Status Badge */}
                        <Badge variant="secondary" className={`${statusColors[approval.status]} text-white`}>
                            {dict.status[approval.status as keyof typeof dict.status]}
                        </Badge>

                        {/* Priority Badge */}
                        {approval.priority && (
                            <Badge variant="outline" className="uppercase text-xs">
                                {approval.priority} Priority
                            </Badge>
                        )}

                        {/* Budget Display */}
                        {approval.budget && (
                            <div className="font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                                {approval.budget.toLocaleString()} BGN
                            </div>
                        )}
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details">Детайли & Одобрение</TabsTrigger>
                            <TabsTrigger value="comments">Коментари ({commentsList?.length || 0})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="flex-1 overflow-auto mt-4 px-1">
                            {/* Description */}
                            {approval.description && (
                                <div className="mb-6 bg-muted/30 p-4 rounded-lg text-sm">
                                    <h4 className="font-semibold mb-2 text-foreground">Описание</h4>
                                    <p className="whitespace-pre-wrap text-muted-foreground">{approval.description}</p>
                                </div>
                            )}

                            {/* Attachments */}
                            {approval.attachments && approval.attachments.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                                        <Paperclip className="h-4 w-4" /> Прикачени файлове
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {approval.attachments.map((file, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 border rounded-md bg-background hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                                    <span className="text-sm truncate">{file.name}</span>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                                                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                                                        <Download className="h-3 w-3" />
                                                    </a>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Workflow Steps Visualizer */}
                            <div className="mb-6">
                                <h4 className="font-semibold mb-3">Процес на одобрение</h4>
                                <div className="space-y-4">
                                    {/* Requester Step */}
                                    <div className="flex items-start gap-3 relative">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 z-10">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            <div className="w-0.5 h-full bg-border -my-1" />
                                        </div>
                                        <div className="pb-6">
                                            <div className="font-medium">Заявено</div>
                                            <div className="text-sm text-muted-foreground">
                                                От {getUserName(approval.requesterId)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {format(new Date(approval.createdAt), "dd MMM HH:mm", { locale: bg })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Approval Steps */}
                                    {approval.steps?.sort((a, b) => a.stepNumber - b.stepNumber).map((step, index) => {
                                        const isLast = index === (approval.steps?.length || 0) - 1;
                                        const isPending = step.status === "pending";
                                        const isApproved = step.status === "approved";
                                        const isRejected = step.status === "rejected";
                                        const isCurrent = approval.currentStepIndex === step.stepNumber;

                                        // Visual tweaks logic
                                        let icon = <Clock className="h-4 w-4" />;
                                        let colorClass = "bg-gray-100 text-gray-500";

                                        if (isApproved) {
                                            icon = <CheckCircle2 className="h-5 w-5" />;
                                            colorClass = "bg-green-100 text-green-600";
                                        } else if (isRejected) {
                                            icon = <XCircle className="h-5 w-5" />;
                                            colorClass = "bg-red-100 text-red-600";
                                        } else if (isCurrent && approval.status === 'pending') {
                                            colorClass = "bg-amber-100 text-amber-600 ring-2 ring-amber-200 ring-offset-2";
                                        }

                                        return (
                                            <div key={step._id} className="flex items-start gap-3 relative">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all ${colorClass}`}>
                                                        {icon}
                                                    </div>
                                                    {!isLast && <div className="w-0.5 h-full bg-border -my-1" />}
                                                </div>
                                                <div className="pb-6">
                                                    <div className="font-medium text-sm">Стъпка {step.stepNumber + 1}</div>
                                                    <div className="text-sm text-muted-foreground">{getUserName(step.approverId)}</div>

                                                    {step.decidedAt && (
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            {format(new Date(step.decidedAt), "dd MMM HH:mm", { locale: bg })}
                                                        </div>
                                                    )}
                                                    {step.comments && (
                                                        <div className="mt-2 text-sm bg-muted/50 p-2 rounded italic border-l-2 border-muted-foreground/20">
                                                            "{step.comments}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </TabsContent>

                        <TabsContent value="comments" className="flex-1 overflow-hidden flex flex-col mt-4">
                            <ScrollArea className="flex-1 pr-4">
                                {commentsList === undefined ? (
                                    <p className="text-center text-sm py-4">Зареждане на коментари...</p>
                                ) : commentsList.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p>Няма коментари</p>
                                        <p className="text-xs">Бъдете първият, който ще коментира.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {commentsList.map((comment) => (
                                            <div key={comment._id} className="flex gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>{comment.user?.name?.[0] || "?"}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span className="font-medium text-foreground">{comment.user?.name || "User"}</span>
                                                        <span>{format(new Date(comment._creationTime), "dd MMM HH:mm", { locale: bg })}</span>
                                                    </div>
                                                    <div className="bg-muted/40 p-3 rounded-md text-sm">
                                                        {comment.content}
                                                    </div>
                                                    {comment.attachments && comment.attachments.length > 0 && (
                                                        <div className="mt-2 text-xs flex flex-wrap gap-2">
                                                            {comment.attachments.map((file: any, i: number) => (
                                                                <a
                                                                    key={i}
                                                                    href={file.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 bg-background border px-2 py-1 rounded hover:bg-muted/50"
                                                                >
                                                                    <Paperclip className="h-3 w-3" />
                                                                    <span>{file.name}</span>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>

                            <div className="mt-4 pt-4 border-t space-y-2">
                                {/* File Preview / Input Area */}
                                <div className="flex items-center gap-2">
                                    {selectedFile ? (
                                        <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full text-xs border">
                                            <Paperclip className="h-3 w-3" />
                                            <span className="max-w-[150px] truncate">{selectedFile.name}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4 ml-1 rounded-full hover:bg-muted"
                                                onClick={() => setSelectedFile(null)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                <Paperclip className="h-4 w-4" />
                                            </Button>
                                            <Input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) setSelectedFile(file);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 items-end">
                                    <Textarea
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Напишете коментар..."
                                        className="min-h-[80px]"
                                    />
                                    <Button size="icon" onClick={handleAddComment} disabled={(!commentText.trim() && !selectedFile) || isSubmitting}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {activeTab === 'details' && canApprove ? (
                        <div className="w-full mt-4 pt-4 border-t space-y-4">
                            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                                <AlertCircle className="h-4 w-4" />
                                <span>Ваш ред е да вземете решение.</span>
                            </div>

                            <Textarea
                                placeholder="Добавете коментар към решението (задължително за редакция/отказ)..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                            />

                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={handleRequestRevision}
                                    disabled={isSubmitting}
                                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Върни за редакция
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleReject}
                                    disabled={isSubmitting}
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Откажи
                                </Button>
                                <Button
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={handleApprove}
                                    disabled={isSubmitting}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Одобри
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex w-full justify-end">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Затвори
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
