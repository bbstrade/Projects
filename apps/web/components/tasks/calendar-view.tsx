"use client";

import { useState, useMemo } from "react";
import { Id } from "@/convex/_generated/dataModel";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    isPast
} from "date-fns";
import { bg, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";

interface Task {
    _id: Id<"tasks">;
    title: string;
    status: string;
    priority: string;
    dueDate?: number;
    color?: string;
}

interface CalendarViewProps {
    tasks: Task[];
    onTaskClick?: (id: Id<"tasks">) => void;
}

const priorityColors: Record<string, string> = {
    low: "bg-slate-400",
    medium: "bg-blue-500",
    high: "bg-orange-500",
    critical: "bg-red-500",
};

export function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
    const { lang } = useLanguage();
    const locale = lang === "bg" ? bg : enUS;
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Get days for the calendar grid (include padding days from prev/next months)
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }, [currentMonth]);

    // Group tasks by date
    const tasksByDate = useMemo(() => {
        const map = new Map<string, Task[]>();

        tasks.forEach(task => {
            if (task.dueDate) {
                const dateKey = format(new Date(task.dueDate), "yyyy-MM-dd");
                const existing = map.get(dateKey) || [];
                existing.push(task);
                map.set(dateKey, existing);
            }
        });

        return map;
    }, [tasks]);

    const getTasksForDay = (date: Date) => {
        const dateKey = format(date, "yyyy-MM-dd");
        return tasksByDate.get(dateKey) || [];
    };

    const weekDays = lang === "bg"
        ? ["Пон", "Вт", "Ср", "Чет", "Пет", "Съб", "Нед"]
        : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
        <Card className="p-6 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {format(currentMonth, "LLLL yyyy", { locale })}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="h-8 w-8"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(new Date())}
                        className="h-8"
                    >
                        {lang === "bg" ? "Днес" : "Today"}
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="h-8 w-8"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                    <div
                        key={day}
                        className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(day => {
                    const dayTasks = getTasksForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const today = isToday(day);

                    return (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                "min-h-[100px] p-1 rounded-lg border transition-colors",
                                isCurrentMonth
                                    ? "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                                    : "bg-slate-50/50 dark:bg-slate-950/50 border-transparent",
                                today && "ring-2 ring-primary ring-offset-1"
                            )}
                        >
                            {/* Day number */}
                            <div className={cn(
                                "text-right text-sm font-medium mb-1 px-1",
                                isCurrentMonth ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-600",
                                today && "text-primary font-bold"
                            )}>
                                {format(day, "d")}
                            </div>

                            {/* Tasks */}
                            <div className="space-y-0.5">
                                {dayTasks.slice(0, 3).map(task => {
                                    const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "done";

                                    return (
                                        <div
                                            key={task._id}
                                            className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer",
                                                "hover:opacity-80 transition-opacity",
                                                task.color
                                                    ? "text-white"
                                                    : isOverdue
                                                        ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                                                        : task.status === "done"
                                                            ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 line-through"
                                                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                            )}
                                            style={task.color ? { backgroundColor: task.color } : undefined}
                                            onClick={() => onTaskClick?.(task._id)}
                                            title={task.title}
                                        >
                                            <span className={cn(
                                                "inline-block w-1.5 h-1.5 rounded-full mr-1",
                                                priorityColors[task.priority?.toLowerCase()] || priorityColors.medium
                                            )} />
                                            {task.title}
                                        </div>
                                    );
                                })}

                                {/* More indicator */}
                                {dayTasks.length > 3 && (
                                    <div className="text-[9px] text-slate-400 px-1.5 font-medium">
                                        +{dayTasks.length - 3} {lang === "bg" ? "още" : "more"}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
