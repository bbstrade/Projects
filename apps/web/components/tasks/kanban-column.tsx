"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanCard } from "./kanban-card";
import { cn } from "@/lib/utils";
import { GripVertical, MoreHorizontal } from "lucide-react";

interface KanbanColumnProps {
    id: string;
    title: string;
    tasks: any[];
    color: string;
    projects: any[];
    users: any[];
    onTaskClick?: (id: any) => void;
}

export function KanbanColumn({ id, title, tasks, color, projects, users, onTaskClick }: KanbanColumnProps) {
    const {
        attributes,
        listeners,
        setNodeRef: setSortableRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: id,
        data: {
            type: "Column",
        },
    });

    const { setNodeRef: setDroppableRef } = useDroppable({
        id: id,
    });

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const headerColors: Record<string, string> = {
        gray: "from-slate-500 to-slate-600",
        blue: "from-blue-600 to-indigo-600",
        orange: "from-amber-500 to-orange-600",
        green: "from-emerald-500 to-teal-600",
    };

    if (isDragging) {
        return (
            <div
                ref={setSortableRef}
                style={style}
                className="flex flex-col w-[350px] min-h-[500px] h-full bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-primary/20 opacity-50"
            />
        );
    }

    return (
        <div
            ref={setSortableRef}
            style={style}
            className="flex flex-col w-[350px] h-full bg-slate-50/80 dark:bg-slate-950/40 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
        >
            {/* Column Header */}
            <div className={cn(
                "p-4 flex items-center justify-between text-white shadow-sm bg-gradient-to-br",
                headerColors[color] || headerColors.gray
            )}>
                <div className="flex items-center gap-2">
                    <div
                        {...attributes}
                        {...listeners}
                        className="p-1 hover:bg-white/20 rounded cursor-grab active:cursor-grabbing transition-colors"
                    >
                        <GripVertical className="h-4 w-4 opacity-70" />
                    </div>
                    <h3 className="font-bold text-sm uppercase tracking-wider">{title}</h3>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-black backdrop-blur-sm border border-white/10">
                        {tasks.length}
                    </div>
                    <button className="p-1 hover:bg-white/20 rounded-md transition-colors">
                        <MoreHorizontal className="h-4 w-4 opacity-70" />
                    </button>
                </div>
            </div>

            {/* Tasks Container */}
            <div
                ref={setDroppableRef}
                className="flex-1 p-3 overflow-y-auto space-y-4 custom-scrollbar min-h-[150px]"
            >
                <SortableContext
                    id={id}
                    items={tasks.map(t => t._id)}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.length > 0 ? (
                        tasks.map((task) => {
                            const project = projects?.find(p => p._id === task.projectId);
                            const assignee = users?.find(u => u._id === task.assigneeId);

                            return (
                                <KanbanCard
                                    key={task._id}
                                    id={task._id}
                                    task={task}
                                    projectName={project?.name}
                                    assignee={assignee}
                                    onTaskClick={onTaskClick}
                                />
                            );
                        })
                    ) : (
                        <div className="h-full min-h-[200px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Transparent drop zone spacer */}
                        </div>
                    )}
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-3">
                            <span className="text-xl">📋</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">
                            Няма задачи
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
