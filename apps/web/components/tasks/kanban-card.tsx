"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, Paperclip, Calendar, Info, Clock, CheckCircle2, Edit, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

interface KanbanCardProps {
    id: Id<"tasks">;
    task: any;
    projectName?: string;
    assignee?: any;
    onTaskClick?: (id: Id<"tasks">) => void;
}

export function KanbanCard({ id, task, projectName, assignee, onTaskClick }: KanbanCardProps) {
    const removeTask = useMutation(api.tasks.remove);
    const updateTask = useMutation(api.tasks.update);

    const handleDelete = async () => {
        try {
            await removeTask({ id });
            toast.success("Задачата беше изтрита");
        } catch (error) {
            toast.error("Грешка при изтриване на задачата");
        }
    };

    const handleMarkDone = async () => {
        try {
            await updateTask({ id, status: "done" });
            toast.success("Задачата е маркирана като завършена");
        } catch (error) {
            toast.error("Грешка при обновяване на задачата");
        }
    };
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: id,
        data: {
            type: "task",
            task,
        },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        ...(task.color ? { borderLeftColor: task.color, borderLeftWidth: '4px' } : {})
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="h-[200px] w-full rounded-xl border-2 border-dashed border-primary/20 bg-slate-50/50 dark:bg-slate-900/50 opacity-50 backdrop-blur-sm"
            />
        );
    }

    const priorityLabels: Record<string, string> = {
        low: "Нисък",
        medium: "Среден",
        high: "Висок",
        critical: "Критичен",
    };

    const priorityColors: Record<string, string> = {
        low: "bg-slate-100/50 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700",
        medium: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
        high: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
        critical: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="group relative flex flex-col gap-3 p-4 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 cursor-grab active:cursor-grabbing"
            onClick={() => onTaskClick?.(id)}
        >
            <div className="flex items-start justify-between gap-3">
                <h4 className="font-bold text-[13px] leading-snug text-slate-900 dark:text-slate-100 line-clamp-2">
                    {task.title}
                </h4>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 flex-shrink-0">
                            <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onTaskClick?.(id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Преглед
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleMarkDone}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Маркирай като завършена
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onTaskClick?.(id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Редактирай
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Изтрий
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {task.description && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {task.description}
                </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="outline" className={cn(
                    "text-[9px] h-5 px-1.5 gap-1 font-black uppercase tracking-wider border rounded-md",
                    priorityColors[task.priority?.toLowerCase() || "medium"]
                )}>
                    {priorityLabels[task.priority?.toLowerCase() || "medium"]}
                </Badge>

                {projectName && (
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                        {projectName}
                    </div>
                )}

                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-600 ml-auto">
                    <div className="flex items-center gap-0.5">
                        <Paperclip className="h-3 w-3" />
                        <span className="text-[9px] font-bold">1</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 ring-2 ring-white dark:ring-slate-900">
                        <AvatarImage src={assignee?.avatar} />
                        <AvatarFallback className="text-[8px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {assignee?.name?.substring(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[100px]">
                        {assignee?.name || "Неразпределена"}
                    </span>
                </div>

                {task.dueDate && (
                    <div className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight",
                        new Date(task.dueDate) < new Date() ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20" : "text-slate-400"
                    )}>
                        <Clock className="h-3 w-3" />
                        {format(new Date(task.dueDate), "dd MMM")}
                    </div>
                )}
            </div>
        </div>
    );
}
