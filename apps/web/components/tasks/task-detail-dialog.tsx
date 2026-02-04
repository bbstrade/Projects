"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TaskSubtasks } from "./task-subtasks";
import { TaskDependencies } from "./task-dependencies";
import { MentionInput } from "@/components/ui/mention-input";

const dict = {
    title: "Детайли за задача",
    description: "Описание",
    priority: "Приоритет",
    status: "Статус",
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
    const task = useQuery(api.tasks.get, taskId ? { id: taskId } : "skip");
    const subtasks = useQuery(api.tasks.listSubtasks, taskId ? { parentTaskId: taskId } : "skip");
    // @ts-ignore - Convex API types might be lagging
    const comments = useQuery(api.comments.list, taskId ? { taskId: taskId } : "skip");

    const updateTask = useMutation(api.tasks.update);
    const createSubtask = useMutation(api.tasks.create);
    // @ts-ignore
    const addComment = useMutation(api.comments.create);
    // @ts-ignore
    const deleteComment = useMutation(api.comments.remove);

    // Phase 5: Files
    // @ts-ignore
    const files = useQuery(api.files.listByTask, taskId ? { taskId } : "skip");
    // @ts-ignore
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    // @ts-ignore
    const saveFile = useMutation(api.files.saveFile);
    // @ts-ignore
    const removeFile = useMutation(api.files.remove);

    const [newComment, setNewComment] = useState("");
    const [commentMentions, setCommentMentions] = useState<Id<"users">[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Get current user (mocking for now as we don't have full auth session access in this component easily)
    const users = useQuery(api.users.list, {});
    const currentUser = users?.[0];

    const handleAddComment = async () => {
        if (!newComment.trim() || !taskId || !currentUser) return;

        setIsSubmitting(true);
        try {
            await addComment({
                taskId,
                userId: currentUser._id,
                content: newComment,
                mentions: commentMentions.length > 0 ? commentMentions : undefined,
            });
            setNewComment("");
            setCommentMentions([]);
            toast.success("Коментарът е добавен");
        } catch (error) {
            toast.error("Грешка при добавяне на коментар");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCommentChange = (value: string, mentions: Id<"users">[]) => {
        setNewComment(value);
        setCommentMentions(mentions);
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

    if (!task) return null;

    const priorityColors = {
        low: "bg-slate-100 text-slate-700",
        medium: "bg-blue-100 text-blue-700",
        high: "bg-orange-100 text-orange-700",
        critical: "bg-red-100 text-red-700",
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={cn("text-xs font-normal capitalize", priorityColors[task.priority as keyof typeof priorityColors])}>
                            {dict[`prio${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}` as keyof typeof dict]}
                        </Badge>
                        <Badge variant="secondary" className="text-xs font-normal">
                            {task.status.replace("_", " ")}
                        </Badge>
                    </div>
                    <DialogTitle className="text-2xl leading-tight">
                        {task.title}
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 border-b">
                        <TabsList className="w-full justify-start bg-transparent h-12 p-0 gap-6">
                            <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-0">
                                <Info className="h-4 w-4 mr-2" />
                                Описание
                            </TabsTrigger>
                            <TabsTrigger value="subtasks" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-0">
                                <ListTodo className="h-4 w-4 mr-2" />
                                {dict.subtasks} ({subtasks?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="comments" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-0">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                {dict.comments} ({comments?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="files" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-0">
                                <FileIcon className="h-4 w-4 mr-2" />
                                {dict.files} ({files?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="dependencies" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-0">
                                <Link2 className="h-4 w-4 mr-2" />
                                {dict.dependencies}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        <TabsContent value="details" className="m-0 space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-900 border-b pb-1">
                                    {dict.description}
                                </h4>
                                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {task.description || dict.noDescription}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-8 pt-4">
                                <div className="space-y-4">
                                    {/* Status */}
                                    <div className="space-y-2">
                                        <span className="text-slate-400 text-xs uppercase font-medium tracking-wider">{dict.status}</span>
                                        <Select
                                            value={task.status}
                                            onValueChange={async (value) => {
                                                await updateTask({ id: task._id, status: value });
                                                toast.success("Статусът е променен");
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
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
                                    <div className="space-y-2">
                                        <span className="text-slate-400 text-xs uppercase font-medium tracking-wider">{dict.priority}</span>
                                        <Select
                                            value={task.priority}
                                            onValueChange={async (value) => {
                                                await updateTask({ id: task._id, priority: value });
                                                toast.success("Приоритетът е променен");
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
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
                                </div>

                                <div className="space-y-4">
                                    {/* Due Date */}
                                    <div className="space-y-2">
                                        <span className="text-slate-400 text-xs uppercase font-medium tracking-wider">{dict.dueDate}</span>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
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
                                    <div className="space-y-2">
                                        <span className="text-slate-400 text-xs uppercase font-medium tracking-wider">Прогноза</span>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                            <span className="text-slate-700 font-medium">{task.estimatedHours || 0} часа</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>


                        <TabsContent value="subtasks" className="m-0">
                            <TaskSubtasks taskId={task._id} />
                        </TabsContent>

                        <TabsContent value="comments" className="m-0 flex flex-col h-full space-y-4">
                            <div className="space-y-6">
                                {comments && comments.length > 0 ? (
                                    // ... existing comment mapping ...
                                    comments.map((comment: any) => (
                                        <div key={comment._id} className="flex gap-3 group">
                                            <Avatar className="h-8 w-8 mt-1">
                                                <AvatarImage src={comment.userAvatar} />
                                                <AvatarFallback className="text-[10px]">{comment.userName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-slate-900">{comment.userName}</span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {format(comment.createdAt, "HH:mm, d MMM", { locale: bg })}
                                                    </span>
                                                </div>
                                                <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none text-sm text-slate-700 leading-relaxed border border-slate-100">
                                                    {comment.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-slate-400">
                                        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p>{dict.noComments}</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="files" className="m-0 space-y-4">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-sm font-semibold">{dict.files}</h4>
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
                                    >
                                        <label htmlFor="file-upload" className="cursor-pointer">
                                            {isUploading ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Upload className="h-4 w-4 mr-2" />
                                            )}
                                            {isUploading ? dict.uploading : "Качи файл"}
                                        </label>
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                {files && files.length > 0 ? (
                                    files.map((file: any) => (
                                        <div key={file._id} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 group hover:bg-white transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2 bg-blue-100 rounded text-blue-600">
                                                    <FileIcon className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-medium truncate max-w-[200px]" title={file.fileName}>
                                                        {file.fileName}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {(file.fileSize / 1024).toFixed(1)} KB • {format(file.createdAt, "d MMM", { locale: bg })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                                                    <a href={file.url} target="_blank" rel="noopener noreferrer" download>
                                                        <Download className="h-4 w-4 text-slate-500" />
                                                    </a>
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={async () => {
                                                        await removeFile({ fileId: file._id });
                                                        toast.success(dict.fileRemoved);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-slate-400">
                                        <FileIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p>{dict.noFiles}</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="dependencies" className="m-0">
                            <TaskDependencies taskId={task._id} projectId={task.projectId} />
                        </TabsContent>
                    </ScrollArea>

                    <div className="p-4 border-t bg-slate-50 mt-auto">
                        <div className="relative">
                            <MentionInput
                                value={newComment}
                                onChange={handleCommentChange}
                                placeholder={dict.addComment}
                                className="pr-12 pb-12 bg-white resize-none"
                                teamId={task?.projectId ? undefined : undefined}
                                disabled={isSubmitting}
                            />
                            <div className="absolute bottom-8 right-3">
                                <Button
                                    size="sm"
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim() || isSubmitting}
                                    className="rounded-full px-4 h-9"
                                >
                                    <Send className="h-4 w-4 mr-2" />
                                    {dict.send}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
