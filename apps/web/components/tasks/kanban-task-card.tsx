"use client";

import { Id } from "@/convex/_generated/dataModel";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { Calendar, Flag, MessageSquare, Paperclip } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";

interface Task {
    _id: Id<"tasks">;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: number;
    color?: string;
    labels?: string[];
    estimatedHours?: number;
}

interface User {
    _id: Id<"users">;
    name?: string;
    email?: string;
    avatar?: string;
}

interface KanbanTaskCardProps {
    task: Task;
    assignee?: User;
    onClick?: () => void;
}

const priorityConfig: Record<string, { color: string; bgColor: string; label: string; labelEn: string }> = {
    low: { color: "text-slate-500", bgColor: "bg-slate-100 dark:bg-slate-800", label: "Нисък", labelEn: "Low" },
    medium: { color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/50", label: "Среден", labelEn: "Medium" },
    high: { color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/50", label: "Висок", labelEn: "High" },
    critical: { color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/50", label: "Критичен", labelEn: "Critical" },
};

export function KanbanTaskCard({ task, assignee, onClick }: KanbanTaskCardProps) {
    const { lang } = useLanguage();

    const priority = priorityConfig[task.priority?.toLowerCase()] || priorityConfig.medium;

    const getDueDateInfo = () => {
        if (!task.dueDate) return null;

        const date = new Date(task.dueDate);
        const isOverdue = isPast(date) && task.status !== "done";
        const isTodays = isToday(date);
        const isTomorrows = isTomorrow(date);

        let text = format(date, "dd MMM");
        let className = "text-slate-500";

        if (isOverdue) {
            text = lang === "bg" ? "Просрочено" : "Overdue";
            className = "text-red-500 font-semibold";
        } else if (isTodays) {
            text = lang === "bg" ? "Днес" : "Today";
            className = "text-amber-500 font-semibold";
        } else if (isTomorrows) {
            text = lang === "bg" ? "Утре" : "Tomorrow";
            className = "text-blue-500";
        }

        return { text, className, isOverdue };
    };

    const dueDateInfo = getDueDateInfo();

    return (
        <Card
            className={cn(
                "group cursor-pointer hover:shadow-lg transition-all duration-200",
                "bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800",
                "hover:border-slate-300 dark:hover:border-slate-700",
                "relative overflow-hidden"
            )}
            onClick={onClick}
        >
            {/* Color stripe */}
            {task.color && (
                <div
                    className="absolute top-0 left-0 w-1 h-full"
                    style={{ backgroundColor: task.color }}
                />
            )}

            <div className={cn("p-3 space-y-3", task.color && "pl-4")}>
                {/* Priority indicator */}
                <div className="flex items-center justify-between">
                    <div className={cn(
                        "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                        priority.bgColor, priority.color
                    )}>
                        <Flag className="h-3 w-3" />
                        {lang === "bg" ? priority.label : priority.labelEn}
                    </div>

                    {/* Labels preview */}
                    {task.labels && task.labels.length > 0 && (
                        <div className="flex gap-1">
                            {task.labels.slice(0, 2).map((label, i) => (
                                <span
                                    key={i}
                                    className="px-1.5 py-0.5 text-[9px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded"
                                >
                                    {label}
                                </span>
                            ))}
                            {task.labels.length > 2 && (
                                <span className="text-[9px] text-slate-400">+{task.labels.length - 2}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Title */}
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {task.title}
                </h4>

                {/* Description preview */}
                {task.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {task.description}
                    </p>
                )}

                {/* Footer: Assignee + Due Date */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    {/* Assignee */}
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 border-2 border-white dark:border-slate-900 shadow-sm">
                            <AvatarImage src={assignee?.avatar} />
                            <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                                {assignee?.name?.substring(0, 2).toUpperCase() || "??"}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate max-w-[80px]">
                            {assignee?.name?.split(" ")[0] || (lang === "bg" ? "Не е зададен" : "Unassigned")}
                        </span>
                    </div>

                    {/* Due Date */}
                    {dueDateInfo && (
                        <div className={cn(
                            "flex items-center gap-1 text-[11px]",
                            dueDateInfo.className
                        )}>
                            <Calendar className={cn("h-3 w-3", dueDateInfo.isOverdue && "animate-pulse")} />
                            {dueDateInfo.text}
                        </div>
                    )}
                </div>

                {/* Estimated hours if present */}
                {task.estimatedHours && (
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        ⏱️ {task.estimatedHours}h {lang === "bg" ? "оценка" : "estimated"}
                    </div>
                )}
            </div>
        </Card>
    );
}
