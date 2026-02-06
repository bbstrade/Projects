"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { format } from "date-fns";
import { Calendar, Clock, MoreHorizontal, Edit, Trash2, CheckCircle2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { TaskDetailDialog } from "./task-detail-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const statusColors: Record<string, string> = {
    todo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    in_review: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    done: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    blocked: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const statusLabels: Record<string, string> = {
    todo: "За изпълнение",
    in_progress: "В процес",
    in_review: "В преглед",
    done: "Завършена",
    blocked: "Блокирана",
};

const priorityColors: Record<string, string> = {
    low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    medium: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
    high: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
    critical: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
};

const priorityLabels: Record<string, string> = {
    low: "Нисък",
    medium: "Среден",
    high: "Висок",
    critical: "Критичен",
};

interface TaskCardProps {
    id: Id<"tasks">;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: number;
    viewMode?: "grid" | "list";
    assignee?: { name?: string; image?: string };
    color?: string; // Added color prop
    onEdit?: (id: Id<"tasks">) => void;
    onClick?: (id: Id<"tasks">) => void; // Added onClick prop
}

export function TaskCard({
    id,
    title,
    description,
    status,
    priority,
    dueDate,
    viewMode = "grid",
    assignee,
    color: customColor, // Added color prop
    onEdit,
    onClick, // Destructure onClick
}: TaskCardProps) {
    const removeTask = useMutation(api.tasks.remove);
    const updateTask = useMutation(api.tasks.update);
    // Removed internal state


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

    const priorityKey = priority?.toLowerCase() || "medium";
    const statusKey = status || "todo";

    const cardStyle = customColor ? {
        borderLeftColor: customColor,
        borderLeftWidth: '4px',
    } : {};

    if (viewMode === "list") {
        return (
            <>
                <div
                    className="flex flex-col md:flex-row md:items-center gap-4 px-5 py-4 border rounded-xl bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                    onClick={() => onClick?.(id)}
                    style={cardStyle}
                >
                    <div className="flex flex-1 items-start gap-4 min-w-0">
                        {/* Status Checkbox */}
                        <div
                            className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all text-white",
                                statusKey === "done"
                                    ? "bg-emerald-500 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                    : "border-slate-200 dark:border-slate-800"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMarkDone();
                            }}
                        >
                            {statusKey === "done" && <CheckCircle2 className="h-4 w-4" />}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                    {title}
                                </h3>
                                <Badge className={cn("text-[9px] h-4 px-1.5 font-black uppercase tracking-tighter leading-none shrink-0", statusColors[statusKey])}>
                                    {statusLabels[statusKey] || status}
                                </Badge>
                            </div>
                            {description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                        {/* Assignee */}
                        <div className="flex items-center gap-2 min-w-[140px]">
                            <Avatar className="h-7 w-7 border border-border/50">
                                <AvatarImage src={assignee?.image} />
                                <AvatarFallback className="text-[10px] bg-slate-100 dark:bg-slate-800 uppercase font-bold">
                                    {assignee?.name?.substring(0, 2) || "??"}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[100px]">
                                {assignee?.name || "Неразпределена"}
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Priority */}
                            <Badge variant="outline" className={cn("text-[9px] h-5 px-2 font-black uppercase leading-none border-transparent", priorityColors[priorityKey])}>
                                {priorityLabels[priorityKey] || priority}
                            </Badge>

                            {/* Date */}
                            {dueDate && (
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 min-w-[80px]">
                                    <Clock className="h-3.5 w-3.5" />
                                    {format(new Date(dueDate), "dd MMM")}
                                </div>
                            )}

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick?.(id); }}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Преглед
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMarkDone(); }}>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Маркирай като завършена
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(id); }}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Редактирай
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Изтрий
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Card
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => onClick?.(id)}
                style={cardStyle}
            >
                <CardHeader className="pb-3 pt-4">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm leading-tight text-slate-800 dark:text-slate-100 line-clamp-2 group-hover:text-primary transition-colors">
                            {title}
                        </h3>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors shrink-0">
                                    <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick?.(id); }}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Преглед
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMarkDone(); }}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Маркирай като завършена
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(id); }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Редактирай
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Изтрий
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 border border-border/50">
                                <AvatarImage src={assignee?.image} />
                                <AvatarFallback className="text-[10px] bg-slate-100 uppercase">
                                    {assignee?.name?.substring(0, 2) || "??"}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                                {assignee?.name?.split(' ')[0] || "---"}
                            </span>
                        </div>

                        {dueDate && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(dueDate), "dd.MM.yyyy")}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-border/50 transition-all">
                        <Badge className={cn("text-[8px] px-1 h-4 leading-none font-black uppercase tracking-tighter", statusColors[statusKey])}>
                            {statusLabels[statusKey] || status}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[8px] px-1 h-4 leading-none font-black uppercase tracking-tighter", priorityColors[priorityKey])}>
                            {priorityLabels[priorityKey] || priority}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
            {/* Removed internal Dialog */}
        </>
    );
}
