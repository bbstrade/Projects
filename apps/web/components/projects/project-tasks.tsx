"use client";

import { useState } from "react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Plus, LayoutList, Users, Tag, Trash2, Edit2, Calendar } from "lucide-react";
import { TaskForm } from "./task-form";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

interface ProjectTasksProps {
    projectId: Id<"projects">;
}

export function ProjectTasks({ projectId }: ProjectTasksProps) {
    const tasks = useQuery(api.tasks.list, { projectId });
    const deleteTask = useMutation(api.tasks.remove);
    const [grouping, setGrouping] = useState<"none" | "assignee" | "status">("none");
    const [editingTask, setEditingTask] = useState<any>(null);

    const handleDelete = async (id: Id<"tasks">) => {
        if (confirm("Delete this task?")) {
            await deleteTask({ id });
            toast.success("Task deleted");
        }
    };

    if (tasks === undefined) {
        return <div className="p-4">Loading tasks...</div>;
    }

    const renderTaskCard = (task: any) => (
        <Card key={task._id} className="mb-3 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <div className={`w-1 h-8 rounded-full ${task.priority === 'high' || task.priority === 'critical' ? 'bg-red-500' :
                            task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}></div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-sm">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs px-1 py-0">{task.status}</Badge>
                            {task.dueDate && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {format(new Date(task.dueDate), "MMM d")}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {task.assignee ? (
                        <div className="flex items-center gap-2" title={task.assignee.name}>
                            <Avatar className="w-6 h-6">
                                <AvatarImage src={task.assignee.image} />
                                <AvatarFallback>{task.assignee.name?.[0] || "?"}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground hidden md:inline-block max-w-[100px] truncate">
                                {task.assignee.name}
                            </span>
                        </div>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                    )}

                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTask(task)}>
                            <Edit2 className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500" onClick={() => handleDelete(task._id)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const renderGrouped = () => {
        if (grouping === "none") {
            return (
                <div className="space-y-2">
                    {tasks.length === 0 && <p className="text-muted-foreground text-center py-8">No tasks yet.</p>}
                    {tasks.map(renderTaskCard)}
                </div>
            );
        }

        const groups: Record<string, any[]> = {};

        tasks.forEach(task => {
            const key = grouping === "assignee"
                ? (task.assignee?.email || "Unassigned")
                : task.status;

            if (!groups[key]) groups[key] = [];
            groups[key].push(task);
        });

        return (
            <div className="space-y-6">
                {Object.entries(groups).map(([key, groupTasks]) => (
                    <div key={key}>
                        <h4 className="font-bold text-sm text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                            {grouping === "assignee" && <Users className="w-4 h-4" />}
                            {grouping === "status" && <LayoutList className="w-4 h-4" />}
                            {key} ({groupTasks.length})
                        </h4>
                        <div className="pl-2 border-l-2 border-slate-100 dark:border-slate-800">
                            {groupTasks.map(renderTaskCard)}
                        </div>
                    </div>
                ))}
                {Object.keys(groups).length === 0 && <p className="text-muted-foreground text-center">No tasks found.</p>}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Group by:</span>
                    <Select value={grouping} onValueChange={(v: any) => setGrouping(v)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Grouping" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="assignee">Assignee</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <TaskForm projectId={projectId} />
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2 min-h-[400px]">
                {renderGrouped()}
            </div>

            <TaskForm
                projectId={projectId}
                task={editingTask}
                open={!!editingTask}
                onOpenChange={(open) => !open && setEditingTask(null)}
            />
        </div>
    );
}
