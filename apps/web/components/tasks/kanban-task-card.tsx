"use client";

import { Id } from "@/convex/_generated/dataModel";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { Calendar, Flag, Folder } from "lucide-react";
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

interface Project {
    _id: Id<"projects">;
    name: string;
    color?: string;
}

interface KanbanTaskCardProps {
    task: Task;
    assignee?: User;
    project?: Project;
    onClick?: () => void;
}

const priorityConfig: Record<string, { color: string; bgColor: string; dotColor: string; label: string; labelEn: string }> = {
    low: { color: "text-slate-600", bgColor: "bg-slate-100 dark:bg-slate-800", dotColor: "bg-slate-400", label: "Нисък", labelEn: "Low" },
    medium: { color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-900/40", dotColor: "bg-blue-500", label: "Среден", labelEn: "Medium" },
    high: { color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-900/40", dotColor: "bg-orange-500", label: "Висок", labelEn: "High" },
    critical: { color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-900/40", dotColor: "bg-red-500", label: "Критичен", labelEn: "Critical" },
};

export function KanbanTaskCard({ task, assignee, project, onClick }: KanbanTaskCardProps) {
    const { lang } = useLanguage();

    const priority = priorityConfig[task.priority?.toLowerCase()] || priorityConfig.medium;

    const getDueDateInfo = () => {
        if (!task.dueDate) return null;

        const date = new Date(task.dueDate);
        const isOverdue = isPast(date) && task.status !== "done";
        const isTodays = isToday(date);
        const isTomorrows = isTomorrow(date);

        let text = format(date, "dd MMM");
        let className = "text-slate-500 bg-slate-100 dark:bg-slate-800";

        if (isOverdue) {
            text = lang === "bg" ? "Просрочено" : "Overdue";
            className = "text-red-600 bg-red-100 dark:bg-red-900/50 font-semibold";
        } else if (isTodays) {
            text = lang === "bg" ? "Днес" : "Today";
            className = "text-amber-600 bg-amber-100 dark:bg-amber-900/50 font-semibold";
        } else if (isTomorrows) {
            text = lang === "bg" ? "Утре" : "Tomorrow";
            className = "text-blue-600 bg-blue-100 dark:bg-blue-900/50";
        }

        return { text, className, isOverdue };
    };

    const dueDateInfo = getDueDateInfo();

    // Determine card border/accent color
    const cardColor = task.color || project?.color;

    return (
        <Card
            className={cn(
                "group cursor-pointer transition-all duration-200",
                "bg-white dark:bg-slate-950",
                "border-slate-200/80 dark:border-slate-800",
                "hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700",
                "hover:-translate-y-0.5",
                "relative overflow-hidden"
            )}
            onClick={onClick}
        >
            {/* Color stripe on top */}
            {cardColor && (
                <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: cardColor }}
                />
            )}

            <div className={cn("p-3 space-y-2.5", cardColor && "pt-4")}>
                {/* Top Row: Priority + Project */}
                <div className="flex items-center justify-between gap-2">
                    {/* Priority */}
                    <div className={cn(
                        "flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                        priority.bgColor, priority.color
                    )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", priority.dotColor)} />
                        {lang === "bg" ? priority.label : priority.labelEn}
                    </div>

                    {/* Project badge */}
                    {project && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded truncate max-w-[100px]">
                            <Folder className="h-2.5 w-2.5 flex-shrink-0" />
                            <span className="truncate">{project.name}</span>
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

                {/* Labels */}
                {task.labels && task.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {task.labels.slice(0, 3).map((label, i) => (
                            <span
                                key={i}
                                className="px-1.5 py-0.5 text-[9px] font-medium bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded"
                            >
                                {label}
                            </span>
                        ))}
                        {task.labels.length > 3 && (
                            <span className="text-[9px] text-slate-400 px-1">+{task.labels.length - 3}</span>
                        )}
                    </div>
                )}

                {/* Footer: Assignee + Due Date */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/50">
                    {/* Assignee */}
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 border-2 border-white dark:border-slate-900 shadow-sm">
                            <AvatarImage src={assignee?.avatar} />
                            <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                                {assignee?.name?.substring(0, 2).toUpperCase() || "??"}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate max-w-[70px]">
                            {assignee?.name?.split(" ")[0] || (lang === "bg" ? "N/A" : "N/A")}
                        </span>
                    </div>

                    {/* Due Date */}
                    {dueDateInfo && (
                        <div className={cn(
                            "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded",
                            dueDateInfo.className
                        )}>
                            <Calendar className={cn("h-3 w-3", dueDateInfo.isOverdue && "animate-pulse")} />
                            {dueDateInfo.text}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
