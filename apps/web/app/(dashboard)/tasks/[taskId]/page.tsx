"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useLanguage } from "@/components/language-provider";
import { Loader2, ArrowLeft, Calendar, User, Flag, CheckCircle2, Paperclip, MessageSquare, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import { TaskSubtasks } from "@/components/tasks/task-subtasks";
import { TaskAttachments } from "@/components/tasks/task-attachments";
import { TaskComments } from "@/components/tasks/task-comments";
import { TaskAssigneeSelector } from "@/components/tasks/task-assignee-selector";
import { TaskProjectSelector } from "@/components/tasks/task-project-selector";

export default function TaskDetailsPage() {
    const { t } = useLanguage();
    const params = useParams();
    const router = useRouter();
    const taskId = params.taskId as Id<"tasks">;

    // Fetch Task
    const task = useQuery(api.tasks.get, { id: taskId });
    const updateTask = useMutation(api.tasks.update);
    const removeTask = useMutation(api.tasks.remove);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState("");
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [description, setDescription] = useState("");

    // Initialize local state when task loads
    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || "");
        }
    }, [task]);

    if (task === undefined) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (task === null) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <h2 className="text-xl font-semibold">Задачата не е намерена</h2>
                <Button variant="link" onClick={() => router.back()}>
                    Назад
                </Button>
            </div>
        );
    }

    const handleUpdateTitle = async () => {
        if (title !== task.title) {
            await updateTask({ id: taskId, title });
            toast.success("Заглавието е обновено");
        }
        setIsEditingTitle(false);
    };

    const handleUpdateDesc = async () => {
        if (description !== task.description) {
            await updateTask({ id: taskId, description });
            toast.success("Описанието е обновено");
        }
        setIsEditingDesc(false);
    };

    const handleDelete = async () => {
        if (confirm("Сигурни ли сте, че искате да изтриете тази задача?")) {
            await removeTask({ id: taskId });
            toast.success("Задачата е изтрита");
            router.back();
        }
    };

    return (
        <div className="flex flex-col h-full bg-background min-h-screen">
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header / Navigation */}
                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                        <Button variant="ghost" size="sm" onClick={() => router.back()}>
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Назад
                        </Button>
                        <Separator orientation="vertical" className="h-4" />
                        <span className="text-sm">Детайли за задача</span>
                    </div>

                    {/* Title Section */}
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                            {isEditingTitle ? (
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onBlur={handleUpdateTitle}
                                    onKeyDown={(e) => e.key === "Enter" && handleUpdateTitle()}
                                    autoFocus
                                    className="text-2xl font-bold h-auto py-2"
                                />
                            ) : (
                                <h1
                                    className="text-2xl font-bold cursor-pointer hover:bg-muted/50 p-2 rounded -ml-2 transition-colors"
                                    onClick={() => setIsEditingTitle(true)}
                                >
                                    {task.title}
                                </h1>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {/* Placeholder for Quick Actions */}
                            <Button variant="outline" size="sm">Сподели</Button>
                            <Button variant="destructive" size="sm" onClick={handleDelete}>Изтрий</Button>
                        </div>
                    </div>

                    {/* Main Content Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column (Details) */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Description */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        Описание
                                    </h3>
                                </div>
                                {isEditingDesc ? (
                                    <div className="space-y-2">
                                        <Textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={6}
                                            className="resize-none"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <Button size="sm" variant="ghost" onClick={() => setIsEditingDesc(false)}>Отказ</Button>
                                            <Button size="sm" onClick={handleUpdateDesc}>Запази</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className="min-h-[100px] p-4 rounded-md border bg-card hover:bg-accent/10 cursor-pointer transition-colors whitespace-pre-wrap text-sm"
                                        onClick={() => setIsEditingDesc(true)}
                                    >
                                        {task.description || <span className="text-muted-foreground italic">Няма описание. Кликнете за добавяне...</span>}
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Subtasks Section */}
                            <TaskSubtasks taskId={taskId} />

                            <Separator />

                            {/* Attachments Section */}
                            <TaskAttachments taskId={taskId} projectId={task.projectId} />

                            <Separator />

                            {/* Comments Section */}
                            <TaskComments taskId={taskId} />

                        </div>

                        {/* Right Column (Sidebar) */}
                        <div className="space-y-6">
                            <div className="p-4 rounded-lg border bg-card space-y-4">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Детайли</h3>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Статус</label>
                                    <Select
                                        defaultValue={task.status}
                                        onValueChange={(value) => updateTask({ id: taskId, status: value })}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todo">За изпълнение</SelectItem>
                                            <SelectItem value="in_progress">В процес</SelectItem>
                                            <SelectItem value="in_review">В преглед</SelectItem>
                                            <SelectItem value="done">Завършена</SelectItem>
                                            <SelectItem value="blocked">Блокирана</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Приоритет</label>
                                    <Select
                                        defaultValue={task.priority}
                                        onValueChange={(value) => updateTask({ id: taskId, priority: value })}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Нисък</SelectItem>
                                            <SelectItem value="medium">Среден</SelectItem>
                                            <SelectItem value="high">Висок</SelectItem>
                                            <SelectItem value="critical">Критичен</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Отговорник</label>
                                    <TaskAssigneeSelector
                                        taskId={taskId}
                                        projectId={task.projectId}
                                        currentAssigneeId={task.assigneeId}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Проект</label>
                                    <TaskProjectSelector
                                        taskId={taskId}
                                        currentProjectId={task.projectId}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Краен срок</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full h-8 justify-start text-left font-normal",
                                                    !task.dueDate && "text-muted-foreground"
                                                )}
                                            >
                                                <Calendar className="mr-2 h-4 w-4" />
                                                {task.dueDate ? format(task.dueDate, "dd MMM yyyy") : <span>Изберете дата</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <CalendarComponent
                                                mode="single"
                                                selected={task.dueDate ? new Date(task.dueDate) : undefined}
                                                onSelect={(date) => updateTask({ id: taskId, dueDate: date ? date.getTime() : undefined })}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <Separator />

                                <div className="text-xs text-muted-foreground space-y-1">
                                    <div>Създадена {task.createdAt && format(task.createdAt, "dd MMM yyyy HH:mm")}</div>
                                    <div>Обновена {task.updatedAt && format(task.updatedAt, "dd MMM yyyy HH:mm")}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
