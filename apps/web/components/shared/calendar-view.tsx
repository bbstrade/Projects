"use client";

import React, { useState, useMemo } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths
} from "date-fns";
import { bg } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarTask {
    id: string;
    title: string;
    dueDate: number;
    status: string;
    priority: string;
}

interface CalendarViewProps {
    tasks: CalendarTask[];
    onTaskClick?: (id: string) => void;
}

export function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const days = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentMonth]);

    const getTasksForDay = (day: Date) => {
        return tasks.filter((task) => isSameDay(new Date(task.dueDate), day));
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const statusColors: Record<string, string> = {
        todo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        blocked: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    };

    return (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-border overflow-hidden shadow-xl">
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-border">
                <h2 className="text-xl font-bold capitalize">
                    {format(currentMonth, "MMMM yyyy", { locale: bg })}
                </h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                        Днес
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 border-b border-border">
                {["Пон", "Вто", "Сря", "Чет", "Пет", "Съб", "Нед"].map((day) => (
                    <div key={day} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
                {days.map((day, i) => {
                    const dayTasks = getTasksForDay(day);
                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, currentMonth);

                    return (
                        <div
                            key={i}
                            className={cn(
                                "min-h-[120px] p-2 border-r border-b border-border transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/20",
                                !isCurrentMonth && "bg-slate-50/30 dark:bg-slate-900/5 text-muted-foreground/50"
                            )}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={cn(
                                    "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all",
                                    isToday ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-600/20" : "text-slate-600 dark:text-slate-400"
                                )}>
                                    {format(day, "d")}
                                </span>
                            </div>

                            <div className="space-y-1">
                                {dayTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        onClick={() => onTaskClick?.(task.id)}
                                        className={cn(
                                            "px-2 py-1 text-[10px] font-bold rounded-md truncate cursor-pointer transition-transform hover:scale-[1.02]",
                                            statusColors[task.status] || "bg-blue-100 text-blue-700"
                                        )}
                                        title={task.title}
                                    >
                                        {task.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
