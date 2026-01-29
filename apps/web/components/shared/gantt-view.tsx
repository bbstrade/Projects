"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { format, addDays, startOfDay, differenceInDays, isSameDay } from "date-fns";
import { bg } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface GanttItem {
    id: string;
    title: string;
    startDate: number;
    endDate: number;
    progress: number;
    color?: string;
}

interface GanttViewProps {
    items: GanttItem[];
    rangeDays?: number; // Total days to show in timeline
}

export function GanttView({ items, rangeDays = 30 }: GanttViewProps) {
    const today = startOfDay(new Date());
    const timelineStart = startOfDay(addDays(today, -7));

    const days = useMemo(() => {
        return Array.from({ length: rangeDays }).map((_, i) => addDays(timelineStart, i));
    }, [timelineStart, rangeDays]);

    const getPosition = (date: number) => {
        const diff = differenceInDays(startOfDay(new Date(date)), timelineStart);
        return diff * 40; // 40px per day
    };

    const getDurationWidth = (start: number, end: number) => {
        const diff = differenceInDays(startOfDay(new Date(end)), startOfDay(new Date(start))) + 1;
        return Math.max(diff * 40, 24); // Min width
    };

    return (
        <div className="border border-border rounded-xl bg-white dark:bg-slate-950 overflow-hidden shadow-lg">
            <div className="flex h-full">
                {/* Sticky Left Sidebar for Titles */}
                <div className="w-48 flex-shrink-0 border-r border-border bg-slate-50/50 dark:bg-slate-900/50 z-30">
                    <div className="h-14 border-b border-border flex items-center px-4 font-bold text-xs uppercase tracking-wider text-muted-foreground bg-white dark:bg-slate-950">
                        Инициатива
                    </div>
                    <div className="py-4 space-y-3">
                        {items.map((item) => (
                            <div key={item.id} className="h-10 flex items-center px-4 text-sm font-medium truncate text-slate-700 dark:text-slate-300 border-b border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors">
                                {item.title}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline Scrollable Area */}
                <ScrollArea className="flex-1">
                    <div className="relative" style={{ width: rangeDays * 40 }}>
                        {/* Timeline Header */}
                        <div className="flex bg-white dark:bg-slate-950 border-b border-border sticky top-0 z-20 h-14">
                            {days.map((day, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex-shrink-0 w-10 flex flex-col items-center justify-center border-r border-border/30 text-[10px] font-medium transition-colors",
                                        isSameDay(day, today) ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                                    )}
                                >
                                    <span className="opacity-70">{format(day, "EEE", { locale: bg })}</span>
                                    <span className="text-xs font-bold">{format(day, "dd")}</span>
                                </div>
                            ))}
                        </div>

                        {/* Grid Lines (Vertical) */}
                        <div className="absolute inset-0 z-0 pointer-events-none flex">
                            {days.map((_, i) => (
                                <div key={i} className="w-10 border-r border-border/10 h-full" />
                            ))}
                        </div>

                        {/* Today Line */}
                        <div
                            className="absolute top-0 bottom-0 w-px bg-red-500 z-10 pointer-events-none transition-all duration-1000"
                            style={{ left: getPosition(today.getTime()) + 20 }}
                        >
                            <div className="absolute top-0 -left-1.5 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse" />
                            <div className="absolute inset-y-0 -left-[1px] w-[2px] bg-red-500/30 blur-[1px]" />
                        </div>

                        {/* Timeline Body */}
                        <div className="py-4 space-y-3 min-h-[400px]">
                            {items.length === 0 ? (
                                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm italic">
                                    Няма данни за показване
                                </div>
                            ) : (
                                items.map((item) => {
                                    const left = getPosition(item.startDate);
                                    const width = getDurationWidth(item.startDate, item.endDate);

                                    return (
                                        <div key={item.id} className="relative h-10 group">
                                            {/* Horizontal Row Background */}
                                            <div className="absolute inset-x-0 inset-y-0 border-b border-border/5 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-900/40 transition-colors" />

                                            {/* Bar */}
                                            <div
                                                className={cn(
                                                    "absolute h-7 top-1.5 rounded-full shadow-md border border-black/5 transition-all hover:scale-[1.01] hover:shadow-lg cursor-pointer overflow-hidden group/bar",
                                                    item.color || "bg-gradient-to-r from-blue-500 to-blue-600"
                                                )}
                                                style={{ left, width }}
                                                title={`${item.title} (${item.progress}%)`}
                                            >
                                                {/* Progress Overlay */}
                                                <div
                                                    className="absolute inset-y-0 left-0 bg-white/20 dark:bg-black/20 backdrop-blur-[1px]"
                                                    style={{ width: `${item.progress}%` }}
                                                />
                                                {/* Label (Mobile/Compact) */}
                                                <div className="absolute inset-0 px-3 flex items-center overflow-hidden">
                                                    <span className="text-[10px] font-extrabold text-white whitespace-nowrap drop-shadow-md">
                                                        {item.progress}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
        </div>
    );
}
