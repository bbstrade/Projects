"use client";

import { useState } from "react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Plus, LayoutList, Users, Tag, Trash2, Edit2, Calendar, LayoutGrid, List } from "lucide-react";
import { TaskForm } from "./task-form";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
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
    const [view, setView] = useState<"list" | "grid">("list");
    const [editingTask, setEditingTask] = useState<any>(null);

    const handleDelete = async (id: Id<"tasks">) => {
        if (confirm("Изтриване на тази задача?")) {
            await deleteTask({ id });
            toast.success("Задачата е изтрита");
        }
    };

    const translateStatus = (status: string) => {
        const map: Record<string, string> = {
            todo: "За правене",
            in_progress: "В процес",
            in_review: "Преглед",
            done: "Готово",
            blocked: "Блокирана"
        };
        return map[status] || status;
    };

    if (tasks === undefined) {
        return <div className="p-4">Зареждане на задачи...</div>;
    }

    const renderTaskCard = (task: any) => {
        if (view === "grid") {
            return (
                <Card key={task._id} className="hover:shadow-md transition-shadow group relative">
                    <CardContent className="p-4 flex flex-col h-full gap-3">
                        <div className="flex justify-between items-start">
                            <Badge variant="outline" className={`
                                ${task.priority === 'high' || task.priority === 'critical' ? 'border-red-500 text-red-500' :
                                    task.priority === 'medium' ? 'border-yellow-500 text-yellow-500' : 'border-blue-500 text-blue-500'
                                }
                            `}>
                                {task.priority}
                            </Badge>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-md shadow-sm">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingTask(task)}>
                                    <Edit2 className="w-3 h-3 text-slate-500" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-red-500" onClick={() => handleDelete(task._id)}>
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>

                        <h4 className="font-semibold text-sm line-clamp-2">{task.title}</h4>

                        <div className="mt-auto flex items-center justify-between pt-2">
                            <Badge variant="secondary" className="text-xs">{translateStatus(task.status)}</Badge>
                            {task.assignee && (
                                <Avatar className="w-6 h-6" title={task.assignee.name}>
                                    <AvatarImage src={task.assignee.image} />
                                    <AvatarFallback>{task.assignee.name?.[0] || "?"}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                        {task.dueDate && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Calendar className="w-3 h-3" /> {format(new Date(task.dueDate), "d MMM", { locale: bg })}
                            </span>
                        )}
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card key={task._id} className="mb-3 hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        <div className={`w-1 h-8 rounded-full ${task.priority === 'high' || task.priority === 'critical' ? 'bg-red-500' :
                            task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}></div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-sm">{task.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs px-1 py-0">{translateStatus(task.status)}</Badge>
                                {task.dueDate && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {format(new Date(task.dueDate), "d MMM", { locale: bg })}
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
                            <span className="text-xs text-muted-foreground italic">Няма</span>
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
    };

    const renderGrouped = () => {
        if (grouping === "none") {
            return (
                <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-2"}>
                    {tasks.length === 0 && <p className="text-muted-foreground text-center py-8 col-span-full">Няма задачи.</p>}
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
                            {grouping === "status" ? translateStatus(key) : key} ({groupTasks.length})
                        </h4>
                        <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pl-2 border-l-2 border-slate-100 dark:border-slate-800" : "pl-2 border-l-2 border-slate-100 dark:border-slate-800"}>
                            {groupTasks.map(renderTaskCard)}
                        </div>
                    </div>
                ))}
                {Object.keys(groups).length === 0 && <p className="text-muted-foreground text-center">Няма намерени задачи.</p>}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-950 p-4 rounded-lg border border-border gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Групиране:</span>
                        <Select value={grouping} onValueChange={(v: any) => setGrouping(v)}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Групиране" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Няма</SelectItem>
                                <SelectItem value="assignee">Отговорник</SelectItem>
                                <SelectItem value="status">Статус</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center border rounded-lg overflow-hidden shrink-0">
                        <Button
                            variant={view === "list" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-9 w-9 rounded-none"
                            onClick={() => setView("list")}
                            title="Списък"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={view === "grid" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-9 w-9 rounded-none"
                            onClick={() => setView("grid")}
                            title="Мрежа"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                    </div>
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
