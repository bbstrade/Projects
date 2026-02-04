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
                <h2 className="text-xl font-semibold">Task not found</h2>
                <Button variant="link" onClick={() => router.back()}>
                    Go back
                </Button>
            </div>
        );
    }

    const handleUpdateTitle = async () => {
        if (title !== task.title) {
            await updateTask({ id: taskId, title });
            toast.success("Title updated");
        }
        setIsEditingTitle(false);
    };

    const handleUpdateDesc = async () => {
        if (description !== task.description) {
            await updateTask({ id: taskId, description });
            toast.success("Description updated");
        }
        setIsEditingDesc(false);
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this task?")) {
            await removeTask({ id: taskId });
            toast.success("Task deleted");
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
                            Back
                        </Button>
                        <Separator orientation="vertical" className="h-4" />
                        <span className="text-sm">Task Details</span>
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
                            <Button variant="outline" size="sm">Share</Button>
                            <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
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
                                        Description
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
                                            <Button size="sm" variant="ghost" onClick={() => setIsEditingDesc(false)}>Cancel</Button>
                                            <Button size="sm" onClick={handleUpdateDesc}>Save</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className="min-h-[100px] p-4 rounded-md border bg-card hover:bg-accent/10 cursor-pointer transition-colors whitespace-pre-wrap text-sm"
                                        onClick={() => setIsEditingDesc(true)}
                                    >
                                        {task.description || <span className="text-muted-foreground italic">No description provided. Click to add...</span>}
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
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Details</h3>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                                    <div className="font-medium capitalize">{task.status.replace("_", " ")}</div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Priority</label>
                                    <Badge variant={task.priority === "high" || task.priority === "critical" ? "destructive" : "secondary"}>
                                        {task.priority}
                                    </Badge>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Assignee</label>
                                    <TaskAssigneeSelector
                                        taskId={taskId}
                                        projectId={task.projectId}
                                        currentAssigneeId={task.assigneeId}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <span>{task.dueDate ? format(task.dueDate, "MMM d, yyyy") : "No due date"}</span>
                                    </div>
                                </div>

                                <Separator />

                                <div className="text-xs text-muted-foreground space-y-1">
                                    <div>Created {task.createdAt && format(task.createdAt, "MMM d, yyyy HH:mm")}</div>
                                    <div>Updated {task.updatedAt && format(task.updatedAt, "MMM d, yyyy HH:mm")}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
