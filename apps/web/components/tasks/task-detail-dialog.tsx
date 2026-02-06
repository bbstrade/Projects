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
import { bg } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress"; // Import Progress
import { TaskSubtasks } from "./task-subtasks";
import { TaskDependencies } from "./task-dependencies";
import { MentionInput } from "@/components/ui/mention-input";
import { ColorPicker } from "@/components/ui/color-picker";

const dict = {
    title: "Детайли за задача",
    description: "Описание",
    priority: "Приоритет",
    status: "Статус",
    assignee: "Отговорник",
    dueDate: "Краен срок",
    subtasks: "Под-задачи",
    comments: "Коментари",
    dependencies: "Зависимости",
    addComment: "Напишете коментар...",
    addSubtask: "Нова под-задача...",
    noDescription: "Няма предоставено описание.",
    noComments: "Все още няма коментари.",
    noSubtasks: "Няма добавени под-задачи.",
    send: "Изпрати",
    delete: "Изтрий",
    prioLow: "Нисък",
    prioMedium: "Среден",
    prioHigh: "Висок",
    prioCritical: "Критичен",
    files: "Файлове",
    uploading: "Прикачване...",
    noFiles: "Няма прикачени файлове.",
    fileUploaded: "Файлът е прикачен успешно",
    fileRemoved: "Файлът е премахнат",
};

const STATUS_OPTIONS = [
    { value: "todo", label: "Предстои" },
    { value: "in_progress", label: "В прогрес" },
    { value: "in_review", label: "За преглед" },
    { value: "done", label: "Завършено" },
    { value: "blocked", label: "Блокирано" },
];

const PRIORITY_OPTIONS = [
    { value: "low", label: "Нисък" },
    { value: "medium", label: "Среден" },
    { value: "high", label: "Висок" },
    { value: "critical", label: "Критичен" },
];

interface TaskDetailDialogProps {
    taskId: Id<"tasks"> | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TaskDetailDialog({ taskId, open, onOpenChange }: TaskDetailDialogProps) {
    const shouldFetch = !!taskId && open;

    const task = useQuery(api.tasks.get, shouldFetch ? { id: taskId! } : "skip");
    const subtasks = useQuery(api.tasks.listSubtasks, shouldFetch ? { parentTaskId: taskId! } : "skip");
    // @ts-ignore - Convex API types might be lagging
    const comments = useQuery(api.comments.list, shouldFetch ? { taskId: taskId! } : "skip");

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
    const [estimatedHours, setEstimatedHours] = useState<number | string>(0); // Use string for input handling

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

    // Get current user (mocking for now as we don't have full auth session access in this component easily)
    const users = useQuery(api.users.list, {});
    const currentUser = users?.[0];

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
            toast.success("Коментарът е добавен");
        } catch (error) {
            toast.error("Грешка при добавяне на коментар");
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
            toast.success("Под-задачата е добавена");
        } catch (error) {
            toast.error("Грешка при създаване на под-задача");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
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
            toast.success(dict.fileUploaded);
        } catch (error) {
            console.error(error);
            toast.error("Грешка при качване на файл");
        } finally {
            setIsUploading(false);
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
                        <p className="text-muted-foreground">Зареждане на задача...</p>
                    </div>
                ) : notFound ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <Info className="w-12 h-12 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground font-medium">Задачата не е намерена или е изтрита.</p>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Затвори</Button>
                    </div>
                ) : (
                    <>
                        {/* Header Section */}
                        <div className="flex-none p-6 pb-4 border-b">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={cn("text-xs font-normal capitalize", priorityColors[task.priority as keyof typeof priorityColors])}>
                                        {dict[`prio${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}` as keyof typeof dict]}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs font-normal">
                                        {STATUS_OPTIONS.find((o) => o.value === task.status)?.label || task.status}
                                    </Badge>
                                    {task.color && (
                                        <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: task.color }} />
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 mr-4">
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onBlur={() => {
                                        if (title !== task.title) {
                                            updateTask({ id: task._id, title });
                                            toast.success("Заглавието е обновено");
                                        }
                                    }}
                                    className="text-2xl leading-tight font-bold text-slate-900 border-none shadow-none px-0 focus-visible:ring-0 h-auto"
                                />
                            </div>
                            <DialogDescription className="sr-only">
                                Детайли за задача {task.title}
                            </DialogDescription>
                            {/* Progress Bar - Only if subtasks exist */}
                            {subtasksTotal > 0 && (
                                <div className="mt-4 flex items-center gap-4">
                                    <Progress value={progress} className="h-2 w-[200px]" />
                                    <span className="text-xs font-medium text-muted-foreground">{progress}% завършени ({subtasksCompleted}/{subtasksTotal})</span>
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
                                            {dict.description}
                                        </h3>
                                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100/50">
                                            <Textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                onBlur={() => {
                                                    if (description !== (task.description || "")) {
                                                        updateTask({ id: task._id, description });
                                                        toast.success("Описанието е обновено");
                                                    }
                                                }}
                                                className="min-h-[100px] border-none shadow-none bg-transparent resize-none focus-visible:ring-0 p-2 text-slate-700 leading-relaxed"
                                                placeholder={dict.noDescription}
                                            />
                                        </div>
                                    </div>

                                    {/* Subtasks */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                            <ListTodo className="h-4 w-4 text-slate-400" />
                                            {dict.subtasks}
                                        </h3>
                                        <TaskSubtasks taskId={task._id} />
                                    </div>

                                    {/* Dependencies */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                            <Link2 className="h-4 w-4 text-slate-400" />
                                            {dict.dependencies}
                                        </h3>
                                        <TaskDependencies taskId={task._id} projectId={task.projectId} />
                                    </div>

                                    {/* Files */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                                <FileIcon className="h-4 w-4 text-slate-400" />
                                                {dict.files}
                                            </h3>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    id="file-upload"
                                                    className="hidden"
                                                    onChange={handleFileUpload}
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
                                                        {isUploading ? dict.uploading : "Качи"}
                                                    </label>
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
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
                                                                    toast.success(dict.fileRemoved);
                                                                }}
                                                            >
                                                                <Trash2 className="h-3 w-3 text-slate-400 hover:text-red-600" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-2 text-center py-8 border-2 border-dashed rounded-lg border-slate-100">
                                                    <p className="text-xs text-slate-400">{dict.noFiles}</p>
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
                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{dict.status}</span>
                                                <Select
                                                    value={task.status}
                                                    onValueChange={async (value) => {
                                                        await updateTask({ id: task._id, status: value });
                                                        toast.success("Статусът е променен");
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full h-9 bg-slate-50 border-slate-200">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {STATUS_OPTIONS.map((opt) => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Priority */}
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{dict.priority}</span>
                                                <Select
                                                    value={task.priority}
                                                    onValueChange={async (value) => {
                                                        await updateTask({ id: task._id, priority: value });
                                                        toast.success("Приоритетът е променен");
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full h-9 bg-slate-50 border-slate-200">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PRIORITY_OPTIONS.map((opt) => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Assignee - using Team Members */}
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{dict.assignee}</span>
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
                                                                        const user = member?.user || users?.find(u => u._id === task.assigneeId);
                                                                        if (!user) return <span>Непознат потребител</span>;
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
                                                                <span className="text-muted-foreground">-- Няма --</span>
                                                            )}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[300px] p-0" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Търси..." />
                                                            <CommandList>
                                                                <CommandEmpty>Няма намерени резултати.</CommandEmpty>
                                                                <CommandGroup>
                                                                    <CommandItem
                                                                        value="unassigned"
                                                                        onSelect={async () => {
                                                                            await updateTask({ id: task._id, assigneeId: undefined });
                                                                            toast.success("Отговорникът е премахнат");
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                !task.assigneeId ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        -- Няма --
                                                                    </CommandItem>
                                                                    {teamMembers?.map((member) => (
                                                                        <CommandItem
                                                                            key={member.userId}
                                                                            value={member.user?.name || member.user?.email || ""}
                                                                            onSelect={async () => {
                                                                                if (member.user?._id) {
                                                                                    await updateTask({ id: task._id, assigneeId: member.user._id });
                                                                                    toast.success("Отговорникът е променен");
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
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            {/* Due Date */}
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{dict.dueDate}</span>
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
                                                            {task.dueDate ? format(task.dueDate, "PPP", { locale: bg }) : "Изберете дата"}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <CalendarComponent
                                                            mode="single"
                                                            selected={task.dueDate ? new Date(task.dueDate) : undefined}
                                                            onSelect={async (date) => {
                                                                await updateTask({ id: task._id, dueDate: date?.getTime() });
                                                                toast.success("Крайният срок е променен");
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            {/* Estimated Hours */}
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Прогноза (часове)</span>
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
                                                                toast.success("Прогнозата е обновена");
                                                            }
                                                        }}
                                                        className="h-full border-none shadow-none bg-transparent focus-visible:ring-0 p-0 text-sm font-medium"
                                                        min={0}
                                                    />
                                                </div>
                                            </div>

                                            {/* Color */}
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Цвят</span>
                                                <div className="pt-1">
                                                    <ColorPicker
                                                        value={task.color}
                                                        onChange={async (value) => {
                                                            await updateTask({ id: task._id, color: value });
                                                            toast.success("Цветът е променен");
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comments List */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4 text-slate-400" />
                                                {dict.comments} ({comments?.length || 0})
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
                                                                        {format(comment.createdAt, "d MMM, HH:mm", { locale: bg })}
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
                                                        <p className="text-xs">{dict.noComments}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea>

                                {/* Comment Input (Sticky Bottom of Sidebar) */}
                                <div className="p-4 border-t bg-white">
                                    <div className="relative">
                                        {commentFiles.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
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
                                            placeholder={dict.addComment}
                                            className="min-h-[80px] pr-2 pb-10 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                            teamId={task?.projectId ? undefined : undefined}
                                            disabled={isSubmitting}
                                        />

                                        <div className="absolute bottom-2 right-2 flex items-center gap-1">
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
                                                variant="ghost"
                                                className="rounded-full h-7 w-7 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                                asChild
                                            >
                                                <label htmlFor="comment-file-upload" className="cursor-pointer flex items-center justify-center">
                                                    <Upload className="h-3 w-3" />
                                                </label>
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleAddComment}
                                                disabled={(!newComment.trim() && commentFiles.length === 0) || isSubmitting}
                                                className="rounded-full h-7 px-3 text-xs"
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Send className="h-3 w-3 mr-1.5" />
                                                        {dict.send}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
