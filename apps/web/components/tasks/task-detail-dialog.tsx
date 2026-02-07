"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Calendar,
    Clock,
    MessageSquare,
    ListTodo,
    Info,
    Send,
    Plus,
    Trash2,
    FileText as FileIcon,
    Upload,
    Download,
    Loader2,
    Link2,
    CalendarIcon,
    Check,
    ChevronsUpDown,
    Edit,
} from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { TaskSubtasks } from "./task-subtasks";
import { TaskDependencies } from "./task-dependencies";
import { MentionInput } from "@/components/ui/mention-input";
import { ColorPicker } from "@/components/ui/color-picker";
import { useLanguage } from "@/components/language-provider";
import { bg as bgLocale, enUS as enLocale } from "date-fns/locale";

interface TaskDetailDialogProps {
    taskId: Id<"tasks"> | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TaskDetailDialog({ taskId, open, onOpenChange }: TaskDetailDialogProps) {
    const { t, lang } = useLanguage();
    const shouldFetch = !!taskId && open;

    const task = useQuery(api.tasks.get, shouldFetch ? { id: taskId! } : "skip");
    const subtasks = useQuery(api.tasks.listSubtasks, shouldFetch ? { parentTaskId: taskId! } : "skip");
    // @ts-ignore - Convex API types might be lagging
    const comments = useQuery(api.comments.list, shouldFetch ? { taskId: taskId! } : "skip");

    const customStatuses = useQuery(api.admin.getCustomStatuses, { type: "task" });
    const customPriorities = useQuery(api.admin.getCustomPriorities, { type: "task" });

    const updateTask = useMutation(api.tasks.update);
    const createSubtask = useMutation(api.tasks.create);
    // @ts-ignore
    const addComment = useMutation(api.comments.create);
    // @ts-ignore
    const deleteComment = useMutation(api.comments.remove);

    // Phase 5: Files
    // @ts-ignore
    const files = useQuery(api.files.listByTask, shouldFetch ? { taskId: taskId! } : "skip");
    // @ts-ignore
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    // @ts-ignore
    const saveFile = useMutation(api.files.saveFile);
    // @ts-ignore
    const removeFile = useMutation(api.files.remove);

    const [newComment, setNewComment] = useState("");
    const [commentMentions, setCommentMentions] = useState<Id<"users">[]>([]);
    const [commentFiles, setCommentFiles] = useState<File[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Editable fields state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [estimatedHours, setEstimatedHours] = useState<number | string>(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isChecklistHelpOpen, setIsChecklistHelpOpen] = useState(false);

    // Sync state with task data
    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || "");
            setEstimatedHours(task.estimatedHours || 0);
        }
    }, [task]);

    // Fetch team members for assignee selector
    const project = useQuery(api.projects.get, task?.projectId ? { id: task.projectId } : "skip");
    const teamMembers = useQuery(api.teams.getMembers, project?.teamId ? { teamId: project.teamId } : "skip");

    // Get current user correctly
    const currentUser = useQuery(api.users.viewer, {});

    const handleAddComment = async () => {
        if ((!newComment.trim() && commentFiles.length === 0) || !taskId || !currentUser) return;

        setIsSubmitting(true);
        try {
            // Upload files if any
            const attachments = [];
            if (commentFiles.length > 0) {
                for (const file of commentFiles) {
                    const postUrl = await generateUploadUrl();
                    const result = await fetch(postUrl, {
                        method: "POST",
                        headers: { "Content-Type": file.type },
                        body: file,
                    });

                    if (!result.ok) throw new Error("Upload failed");
                    const { storageId } = await result.json();

                    attachments.push({
                        name: file.name,
                        url: "", // We'll rely on storageId
                        storageId: storageId as Id<"_storage">,
                        type: file.type,
                        size: file.size,
                        uploadedAt: Date.now(),
                    });
                }
            }

            await addComment({
                taskId,
                userId: currentUser._id,
                content: newComment,
                mentions: commentMentions.length > 0 ? commentMentions : undefined,
                attachments: attachments.length > 0 ? attachments : undefined,
            });

            setNewComment("");
            setCommentMentions([]);
            setCommentFiles([]);
            toast.success(t("commentAdded") || "Коментарът е добавен");
        } catch (error) {
            toast.error(t("commentError") || "Грешка при добавяне на коментар");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleCommentChange = (value: string, mentions: Id<"users">[]) => {
        setNewComment(value);
        setCommentMentions(mentions);
    };

    const handleCommentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            setCommentFiles((prev) => [...prev, ...Array.from(files)]);
        }
    };

    const removeCommentFile = (index: number) => {
        setCommentFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAddSubtask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubtaskTitle.trim() || !taskId || !task) return;

        try {
            await createSubtask({
                title: newSubtaskTitle,
                projectId: task.projectId,
                parentTaskId: taskId,
                priority: "medium",
                status: "todo",
            });
            setNewSubtaskTitle("");
            toast.success(t("subtaskAdded") || "Под-задачата е добавена");
        } catch (error) {
            toast.error(t("subtaskError") || "Грешка при създаване на под-задача");
        }
    };

    const handleFileUpload = async (filesToCheck: FileList | File[]) => {
        const file = filesToCheck[0];
        if (!file || !taskId || !currentUser) return;

        setIsUploading(true);
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();

            await saveFile({
                storageId,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                taskId,
            });
            toast.success(t("fileUploaded"));
        } catch (error) {
            console.error(error);
            toast.error(t("uploadError") || "Грешка при качване на файл");
        } finally {
            setIsUploading(false);
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
        }
    };

    const onCommentDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setCommentFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
        }
    };

    const toggleSubtask = async (subtaskId: Id<"tasks">, currentStatus: string) => {
        await updateTask({
            id: subtaskId,
            status: currentStatus === "done" ? "todo" : "done",
        });
    };

    // Instead of returning null deeply, we should render the Dialog shell and show loading state
    // if (!task) return null; 

    // Helper to determine content
    const isLoading = task === undefined;
    const notFound = task === null;

    const priorityColors = {
        low: "bg-slate-100 text-slate-700",
        medium: "bg-blue-100 text-blue-700",
        high: "bg-orange-100 text-orange-700",
        critical: "bg-red-100 text-red-700",
    };

    const subtasksTotal = subtasks?.length || 0;
    const subtasksCompleted = subtasks?.filter(t => t.status === "done").length || 0;
    const progress = subtasksTotal === 0 ? 0 : Math.round((subtasksCompleted / subtasksTotal) * 100);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1200px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">{t("loadingTask") || "Зареждане на задача..."}</p>
                    </div>
                ) : notFound ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <Info className="w-12 h-12 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground font-medium">{t("taskNotFound") || "Задачата не е намерена или е изтрита."}</p>
                        <button className="px-4 py-2 border rounded hover:bg-slate-50" onClick={() => onOpenChange(false)}>{t("close") || "Затвори"}</button>
                    </div>
                ) : (
                    <>
                        {/* Header Section */}
                        <div className="flex-none p-6 pb-4 border-b">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    {(() => {
                                        const status = customStatuses?.find(s => s.slug === task.status);
                                        const priority = customPriorities?.find(p => p.slug === task.priority);
                                        return (
                                            <>
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs font-normal capitalize"
                                                    style={priority?.color ? { backgroundColor: priority.color + "20", color: priority.color, borderColor: priority.color + "40" } : {}}
                                                >
                                                    {lang === "bg" ? priority?.label : (priority?.slug || task.priority)}
                                                </Badge>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs font-normal"
                                                    style={status?.color ? { backgroundColor: status.color + "20", color: status.color, borderColor: status.color + "40" } : {}}
                                                >
                                                    {lang === "bg" ? status?.label : (status?.slug || task.status)}
                                                </Badge>
                                            </>
                                        );
                                    })()}
                                    {task.color && (
                                        <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: task.color }} />
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center">
                                <div className="flex-1 mr-4">
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        onBlur={() => {
                                            if (title !== task.title) {
                                                updateTask({ id: task._id, title });
                                                toast.success(t("titleUpdated") || "Заглавието е обновено");
                                            }
                                        }}
                                        className="text-2xl leading-tight font-bold text-slate-900 border-none shadow-none px-0 focus-visible:ring-0 h-auto"
                                    />
                                </div>
                            </div>
                            <DialogDescription className="sr-only">
                                {t("taskDetailsFor") || "Детайли за задача"} {task!.title}
                            </DialogDescription>
                            {/* Progress Bar - Only if subtasks exist */}
                            {subtasksTotal > 0 && (
                                <div className="mt-4 flex items-center gap-4">
                                    <Progress value={progress} className="h-2 w-[200px]" />
                                    <span className="text-xs font-medium text-muted-foreground">{progress}% {t("completed") || "завършени"} ({subtasksCompleted}/{subtasksTotal})</span>
                                </div>
                            )}
                        </div>

                        {/* Main Layout - 2 Columns */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* LEFT COLUMN - Main Content */}
                            <ScrollArea className="flex-1 border-r">
                                <div className="p-6 space-y-8 max-w-3xl mx-auto">

                                    {/* Description */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                            <Info className="h-4 w-4 text-slate-400" />
                                            {t("taskDescriptionLabel")}
                                        </h3>
                                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100/50 relative group">
                                            {isEditingDescription ? (
                                                <div className="relative">
                                                    <Textarea
                                                        value={description}
                                                        onChange={(e) => setDescription(e.target.value)}
                                                        onBlur={() => {
                                                            setIsEditingDescription(false);
                                                            if (description !== (task.description || "")) {
                                                                updateTask({ id: task._id, description });
                                                                toast.success(t("descriptionUpdated") || "Описанието е обновено");
                                                            }
                                                        }}
                                                        autoFocus
                                                        className="min-h-[100px] border-none shadow-none bg-white resize-none focus-visible:ring-0 p-2 text-slate-700 leading-relaxed"
                                                        placeholder={t("taskDescriptionPlaceholder")}
                                                    />
                                                    <Button
                                                        size="sm"
                                                        className="absolute bottom-2 right-2 h-6 text-xs"
                                                        onClick={() => {
                                                            setIsEditingDescription(false);
                                                            if (description !== (task.description || "")) {
                                                                updateTask({ id: task._id, description });
                                                                toast.success(t("descriptionUpdated") || "Описанието е обновено");
                                                            }
                                                        }}
                                                    >
                                                        {t("save")}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div
                                                    className="min-h-[60px] p-2 text-slate-700 leading-relaxed whitespace-pre-wrap cursor-pointer hover:bg-slate-100/50 rounded-md transition-colors"
                                                    onClick={() => setIsEditingDescription(true)}
                                                >
                                                    {description || <span className="text-slate-400 italic">{t("noDescription") || "Няма предоставено описание."}</span>}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsEditingDescription(true);
                                                        }}
                                                    >
                                                        <Edit className="h-3 w-3 text-slate-400" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Subtasks */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                                <ListTodo className="h-4 w-4 text-slate-400" />
                                                {t("subtasks")}
                                            </h3>
                                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                {subtasks?.length || 0}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs ml-auto text-muted-foreground"
                                                onClick={() => setIsChecklistHelpOpen(!isChecklistHelpOpen)}
                                            >
                                                <Info className="h-3 w-3 mr-1" />
                                                {t("help") || "Помощ"}
                                            </Button>
                                        </div>
                                        {isChecklistHelpOpen && (
                                            <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-lg animate-in fade-in slide-in-from-top-1">
                                                <p className="font-semibold mb-2">{t("subtasksHelpTitle") || "Как работят подзадачите:"}</p>
                                                <div className="space-y-1">
                                                    <p>• <strong>{t("subtasks") || "Подзадачи"}</strong> - {t("subtasksHelp1") || "самостоятелни задачи с описание, етикети и отговорник"}</p>
                                                    <p>• <strong>{t("checklists") || "Чеклисти"}</strong> - {t("subtasksHelp2") || "прости елементи за отбелязване в рамките на подзадача"}</p>
                                                    <p>• {t("subtasksHelp3") || "Кликнете върху подзадача за да я разширите и видите чеклиста"}</p>
                                                    <p>• {t("subtasksHelp4") || "Използвайте \"+\" за добавяне на нови елементи"}</p>
                                                </div>
                                            </div>
                                        )}
                                        <TaskSubtasks taskId={task._id} />
                                    </div>

                                    {/* Dependencies */}
                                    <div className="space-y-3">
                                        <TaskDependencies taskId={task._id} projectId={task.projectId} />
                                    </div>

                                    {/* Files */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                                <FileIcon className="h-4 w-4 text-slate-400" />
                                                {t("taskAttachmentsLabel")}
                                            </h3>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    id="file-upload"
                                                    className="hidden"
                                                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                                                    disabled={isUploading}
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={isUploading}
                                                    asChild
                                                    className="h-7 text-xs"
                                                >
                                                    <label htmlFor="file-upload" className="cursor-pointer">
                                                        {isUploading ? (
                                                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                                        ) : (
                                                            <Upload className="h-3 w-3 mr-2" />
                                                        )}
                                                        {isUploading ? t("taskUploading") : (t("upload") || "Качи")}
                                                    </label>
                                                </Button>
                                            </div>
                                        </div>

                                        <div
                                            className={cn(
                                                "grid grid-cols-2 gap-3 min-h-[100px] rounded-lg border-2 border-dashed transition-colors p-2",
                                                isDragging ? "border-blue-500 bg-blue-50" : "border-transparent"
                                            )}
                                            onDragOver={onDragOver}
                                            onDragLeave={onDragLeave}
                                            onDrop={onDrop}
                                        >
                                            {files && files.length > 0 ? (
                                                files.map((file: any) => (
                                                    <div key={file._id} className="flex items-center justify-between p-3 rounded-lg border bg-white shadow-sm group hover:border-blue-200 transition-colors">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="p-2 bg-blue-50 rounded text-blue-600">
                                                                <FileIcon className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-xs font-medium truncate max-w-[120px]" title={file.fileName}>
                                                                    {file.fileName}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {(file.fileSize / 1024).toFixed(1)} KB
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Button size="icon" variant="ghost" className="h-6 w-6" asChild>
                                                                <a href={file.url} target="_blank" rel="noopener noreferrer" download>
                                                                    <Download className="h-3 w-3 text-slate-400 hover:text-blue-600" />
                                                                </a>
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-6 w-6 hover:bg-red-50"
                                                                onClick={async () => {
                                                                    await removeFile({ fileId: file._id });
                                                                    toast.success(t("fileRemoved") || "Файлът е премахнат");
                                                                }}
                                                            >
                                                                <Trash2 className="h-3 w-3 text-slate-400 hover:text-red-600" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-2 text-center py-8 border-2 border-dashed rounded-lg border-slate-100">
                                                    <p className="text-xs text-slate-400">{t("noFiles") || "Няма прикачени файлове."}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </ScrollArea>

                            {/* RIGHT COLUMN - Sidebar */}
                            <div className="w-[350px] flex-none flex flex-col bg-slate-50/50">
                                <ScrollArea className="flex-1">
                                    <div className="p-6 space-y-6">

                                        {/* Properties Block */}
                                        <div className="space-y-4 bg-white p-4 rounded-xl border shadow-sm">
                                            {/* Status */}
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t("status")}</span>
                                                <Select
                                                    value={task.status}
                                                    onValueChange={async (value) => {
                                                        await updateTask({ id: task._id, status: value });
                                                        toast.success(t("statusUpdated") || "Статусът е променен");
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full h-9 bg-slate-50 border-slate-200">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {customStatuses?.map((opt) => (
                                                            <SelectItem key={opt.slug} value={opt.slug}>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: opt.color }} />
                                                                    {lang === "bg" ? opt.label : opt.slug}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Priority */}
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t("priority")}</span>
                                                <Select
                                                    value={task.priority}
                                                    onValueChange={async (value) => {
                                                        await updateTask({ id: task._id, priority: value });
                                                        toast.success(t("priorityUpdated") || "Приоритетът е променен");
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full h-9 bg-slate-50 border-slate-200">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {customPriorities?.map((opt) => (
                                                            <SelectItem key={opt.slug} value={opt.slug}>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: opt.color }} />
                                                                    {lang === "bg" ? opt.label : opt.slug}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Assignee - using Team Members */}
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t("assignee")}</span>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className="w-full justify-between h-9 bg-slate-50 border-slate-200 px-3 font-normal"
                                                        >
                                                            {task.assigneeId ? (
                                                                <div className="flex items-center gap-2 truncate">
                                                                    {(() => {
                                                                        const member = teamMembers?.find(m => m.user?._id === task.assigneeId);
                                                                        // Fallback to currentUser if not found (e.g. self-assign even if list issue)
                                                                        const user = member?.user || (currentUser?._id === task.assigneeId ? currentUser : null);
                                                                        if (!user) return <span>{t("unknownUser") || "Непознат потребител"}</span>;
                                                                        return (
                                                                            <>
                                                                                <Avatar className="h-5 w-5">
                                                                                    <AvatarImage src={user.avatar} />
                                                                                    <AvatarFallback className="text-[10px]">{user.name?.charAt(0)}</AvatarFallback>
                                                                                </Avatar>
                                                                                <span className="truncate text-sm">{user.name || user.email}</span>
                                                                            </>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">-- {t("none") || "Няма"} --</span>
                                                            )}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[300px] p-0" align="start">
                                                        <Command>
                                                            <CommandInput placeholder={t("search") || "Търси..."} />
                                                            <CommandList>
                                                                <CommandEmpty>{t("noResultsFound") || "Няма намерени резултати."}</CommandEmpty>
                                                                <CommandGroup>
                                                                    <CommandItem
                                                                        value="unassigned"
                                                                        onSelect={async () => {
                                                                            await updateTask({ id: task._id, assigneeId: undefined });
                                                                            toast.success(t("assigneeUpdated") || "Отговорникът е променен");
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                !task.assigneeId ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        -- {t("none") || "Няма"} --
                                                                    </CommandItem>
                                                                    {teamMembers?.map((member) => (
                                                                        <CommandItem
                                                                            key={member.userId}
                                                                            value={member.user?.name || member.user?.email || ""}
                                                                            onSelect={async () => {
                                                                                if (member.user?._id) {
                                                                                    await updateTask({ id: task._id, assigneeId: member.user._id });
                                                                                    toast.success(t("assigneeUpdated") || "Отговорникът е променен");
                                                                                }
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    task.assigneeId === member.userId ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            <div className="flex items-center gap-2">
                                                                                <Avatar className="h-6 w-6">
                                                                                    <AvatarImage src={member.user?.image} />
                                                                                    <AvatarFallback className="text-[10px]">{member.user?.name?.[0]}</AvatarFallback>
                                                                                </Avatar>
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-sm font-medium">{member.user?.name}</span>
                                                                                    <span className="text-xs text-muted-foreground">{member.role}</span>
                                                                                </div>
                                                                            </div>
                                                                        </CommandItem>
                                                                    ))}
                                                                    {/* Add Current User if not in list */}
                                                                    {currentUser && !teamMembers?.some(m => m.userId === currentUser._id) && (
                                                                        <CommandItem
                                                                            value={currentUser.name || currentUser.email || ""}
                                                                            onSelect={async () => {
                                                                                await updateTask({ id: task._id, assigneeId: currentUser._id });
                                                                                toast.success(t("assigneeUpdated") || "Отговорникът е променен");
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    task.assigneeId === currentUser._id ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            <div className="flex items-center gap-2">
                                                                                <Avatar className="h-6 w-6">
                                                                                    <AvatarImage src={currentUser.avatar} />
                                                                                    <AvatarFallback className="text-[10px]">{currentUser.name?.[0]}</AvatarFallback>
                                                                                </Avatar>
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-sm font-medium">{currentUser.name} ({t("me") || "Аз"})</span>
                                                                                </div>
                                                                            </div>
                                                                        </CommandItem>
                                                                    )}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            {/* Due Date */}
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t("dueDate")}</span>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal h-9 bg-slate-50 border-slate-200",
                                                                !task.dueDate && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {task.dueDate ? format(task.dueDate, "PPP", { locale: lang === "bg" ? bgLocale : enLocale }) : (t("selectDate") || "Изберете дата")}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <CalendarComponent
                                                            mode="single"
                                                            selected={task.dueDate ? new Date(task.dueDate) : undefined}
                                                            onSelect={async (date) => {
                                                                await updateTask({ id: task._id, dueDate: date?.getTime() });
                                                                toast.success(t("dueDateUpdated") || "Крайният срок е променен");
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            {/* Estimated Hours */}
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t("taskEstimatedHoursLabel") || "Прогноза (часове)"}</span>
                                                <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-slate-200 bg-slate-50">
                                                    <Clock className="h-4 w-4 text-slate-400" />
                                                    <Input
                                                        type="number"
                                                        value={estimatedHours}
                                                        onChange={(e) => setEstimatedHours(e.target.value)}
                                                        onBlur={() => {
                                                            const val = Number(estimatedHours);
                                                            if (!isNaN(val) && val !== task.estimatedHours) {
                                                                updateTask({ id: task._id, estimatedHours: val });
                                                                toast.success(t("estimatedHoursUpdated") || "Прогнозата е обновена");
                                                            }
                                                        }}
                                                        className="h-full border-none shadow-none bg-transparent focus-visible:ring-0 p-0 text-sm font-medium"
                                                        min={0}
                                                        step="0.5"
                                                    />
                                                </div>
                                            </div>

                                            {/* Color */}
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t("taskColorLabel") || "Цвят"}</span>
                                                <div className="pt-1">
                                                    <ColorPicker
                                                        value={task.color}
                                                        onChange={async (value) => {
                                                            await updateTask({ id: task._id, color: value });
                                                            toast.success(t("colorUpdated") || "Цветът е променен");
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comments List */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4 text-slate-400" />
                                                {t("comments")} ({comments?.length || 0})
                                            </h3>

                                            <div className="space-y-4 min-h-[100px]">
                                                {comments && comments.length > 0 ? (
                                                    comments.map((comment: any) => (
                                                        <div key={comment._id} className="flex gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                            <Avatar className="h-6 w-6 mt-1 flex-shrink-0">
                                                                <AvatarImage src={comment.userAvatar} />
                                                                <AvatarFallback className="text-[10px] bg-slate-100 text-slate-500">{comment.userName?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0 space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-semibold text-slate-700 truncate">{comment.userName}</span>
                                                                    <span className="text-[10px] text-slate-300 flex-shrink-0">
                                                                        {format(comment.createdAt, "d MMM, HH:mm", { locale: lang === "bg" ? bgLocale : enLocale })}
                                                                    </span>
                                                                </div>
                                                                <div className="bg-white p-2.5 rounded-2xl rounded-tl-none text-xs text-slate-600 leading-relaxed border shadow-sm">
                                                                    {comment.content}
                                                                    {/* Attachments */}
                                                                    {comment.attachments && comment.attachments.length > 0 && (
                                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                                            {comment.attachments.map((att: any, idx: number) => (
                                                                                <div key={idx} className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded border border-slate-100 text-[10px]">
                                                                                    <FileIcon className="h-3 w-3 text-blue-500" />
                                                                                    <span className="max-w-[100px] truncate" title={att.name}>{att.name}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8 text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                                                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-10" />
                                                        <p className="text-xs">{t("noComments") || "Няма коментари."}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea>

                                {/* Comment Input (Sticky Bottom of Sidebar) */}
                                <div
                                    className="p-4 border-t bg-white"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={onCommentDrop}
                                >
                                    <div className="space-y-2">
                                        {commentFiles.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                {commentFiles.map((file, idx) => (
                                                    <div key={idx} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-[10px] border border-blue-100 flex-shrink-0">
                                                        <span className="truncate max-w-[80px]">{file.name}</span>
                                                        <button onClick={() => removeCommentFile(idx)} className="text-blue-400 hover:text-blue-600">
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <MentionInput
                                            value={newComment}
                                            onChange={handleCommentChange}
                                            placeholder={t("taskCommentPlaceholder")}
                                            className="min-h-[80px] text-sm bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                            teamId={project?.teamId}
                                            disabled={isSubmitting}
                                        />

                                        <div className="flex items-center justify-end">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="file"
                                                    id="comment-file-upload"
                                                    className="hidden"
                                                    multiple
                                                    onChange={handleCommentFileUpload}
                                                    disabled={isSubmitting}
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 px-2 text-slate-500"
                                                    asChild
                                                >
                                                    <label htmlFor="comment-file-upload" className="cursor-pointer flex items-center gap-1">
                                                        <Upload className="h-3 w-3" />
                                                    </label>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={handleAddComment}
                                                    disabled={(!newComment.trim() && commentFiles.length === 0) || isSubmitting}
                                                    className="h-7 px-3 text-xs"
                                                >
                                                    {isSubmitting ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Send className="h-3 w-3 mr-1.5" />
                                                            {t("send")}
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog >
    );
}
