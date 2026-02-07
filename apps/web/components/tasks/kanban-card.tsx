"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, Paperclip, Clock, CheckCircle2, Edit, Trash2, Eye, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";

interface KanbanCardProps {
    id: Id<"tasks">;
    task: any;
    projectName?: string;
    assignee?: any;
    onTaskClick?: (id: Id<"tasks">) => void;
}

export function KanbanCard({ id, task, projectName, assignee, onTaskClick }: KanbanCardProps) {
    const { t, lang } = useLanguage();
    const removeTask = useMutation(api.tasks.remove);
    const updateTask = useMutation(api.tasks.update);
    const customPriorities = useQuery(api.admin.getCustomPriorities, {});

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await removeTask({ id });
            toast.success(t("taskDeleted") || "Задачата беше изтрита");
        } catch (error) {
            toast.error(t("error") || "Грешка при изтриване");
        }
    };

    const handleMarkDone = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await updateTask({ id, status: "done" });
            toast.success(t("taskMarkedDone") || "Задачата е завършена");
        } catch (error) {
            toast.error(t("error") || "Грешка");
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

    // Get priority info
    const priority = customPriorities?.find(p => p.slug === task.priority);
    const priorityColor = priority?.color || "#6b7280";
    const priorityLabel = lang === "bg" ? priority?.label : priority?.slug || task.priority;

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="h-[120px] w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 opacity-60"
            />
        );
    }

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="group relative flex flex-col gap-2 p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-grab active:cursor-grabbing"
            onClick={() => onTaskClick?.(id)}
        >
            {/* Title Row */}
            <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-[13px] leading-snug text-slate-900 dark:text-slate-100 line-clamp-2 flex-1">
                    {task.title}
                </h4>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 opacity-0 group-hover:opacity-100 flex-shrink-0">
                            <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTaskClick?.(id); }}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("view") || "Преглед"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleMarkDone}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {t("markAsDone") || "Маркирай като завършена"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTaskClick?.(id); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t("edit") || "Редактирай"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("delete") || "Изтрий"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-1.5">
                {/* Priority Badge */}
                <Badge
                    variant="outline"
                    className="text-[9px] h-5 px-1.5 font-bold uppercase tracking-wider rounded-md border"
                    style={{
                        backgroundColor: priorityColor + "15",
                        color: priorityColor,
                        borderColor: priorityColor + "40",
                    }}
                >
                    {priorityLabel}
                </Badge>

                {/* Project Name */}
                {projectName && (
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-500 truncate max-w-[80px]">
                        {projectName}
                    </span>
                )}
            </div>

            {/* Footer Row */}
            <div className="flex items-center justify-between pt-2 mt-auto border-t border-slate-100 dark:border-slate-800/50">
                {/* Assignee */}
                <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5 ring-1 ring-white dark:ring-slate-900">
                        <AvatarImage src={assignee?.avatar} />
                        <AvatarFallback className="text-[8px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {assignee?.name?.substring(0, 2).toUpperCase() || "?"}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[70px]">
                        {assignee?.name || t("unassigned") || "Неразпределена"}
                    </span>
                </div>

                {/* Due Date */}
                {task.dueDate && (
                    <div className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold",
                        isOverdue ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30" : "text-slate-400"
                    )}>
                        <Clock className="h-3 w-3" />
                        {format(new Date(task.dueDate), "dd MMM")}
                    </div>
                )}
            </div>
        </div>
    );
}
