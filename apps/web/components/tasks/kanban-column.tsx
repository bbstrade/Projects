"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanCard } from "./kanban-card";
import { cn } from "@/lib/utils";
import { GripVertical, MoreHorizontal, Plus } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface KanbanColumnProps {
    id: string;
    title: string;
    tasks: any[];
    color: string;
    projects: any[];
    users: any[];
    onTaskClick?: (id: any) => void;
    defaultProjectId?: Id<"projects">;
}

export function KanbanColumn({ id, title, tasks, color, projects, users, onTaskClick, defaultProjectId }: KanbanColumnProps) {
    const { t } = useLanguage();
    const [isAdding, setIsAdding] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const createTask = useMutation(api.tasks.create);

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

    const handleQuickAdd = async () => {
        if (!newTaskTitle.trim()) return;
        try {
            const projectId = defaultProjectId || projects?.[0]?._id;
            if (!projectId) {
                toast.error(t("selectProject") || "Изберете проект");
                return;
            }
            await createTask({
                title: newTaskTitle.trim(),
                status: id,
                priority: "medium",
                projectId,
            });
            setNewTaskTitle("");
            setIsAdding(false);
            toast.success(t("taskAdded") || "Задачата е добавена");
        } catch (error) {
            toast.error(t("error") || "Грешка");
        }
    };

    if (isDragging) {
        return (
            <div
                ref={setSortableRef}
                style={style}
                className="flex flex-col w-[320px] min-h-[500px] h-full bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-primary/20 opacity-50"
            />
        );
    }

    // Generate header style from dynamic color
    const headerStyle = {
        background: `linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -20)} 100%)`,
    };

    return (
        <div
            ref={setSortableRef}
            style={style}
            className="flex flex-col w-[320px] h-full bg-white dark:bg-slate-950/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
        >
            {/* Column Header */}
            <div
                className="p-4 flex items-center justify-between text-white shadow-sm"
                style={headerStyle}
            >
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
                    <button
                        className="p-1 hover:bg-white/20 rounded-md transition-colors"
                        onClick={() => setIsAdding(true)}
                        title={t("quickAddTask")}
                    >
                        <Plus className="h-4 w-4 opacity-70" />
                    </button>
                </div>
            </div>

            {/* Quick Add Input */}
            {isAdding && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b">
                    <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder={t("addTaskPlaceholder") || "Заглавие на задачата..."}
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleQuickAdd();
                            if (e.key === "Escape") {
                                setIsAdding(false);
                                setNewTaskTitle("");
                            }
                        }}
                    />
                    <div className="flex gap-2 mt-2">
                        <Button size="sm" className="h-7 text-xs flex-1" onClick={handleQuickAdd}>
                            {t("add") || "Добави"}
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => {
                                setIsAdding(false);
                                setNewTaskTitle("");
                            }}
                        >
                            {t("cancel") || "Отказ"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Tasks Container */}
            <div
                ref={setDroppableRef}
                className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar min-h-[150px] relative"
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
                        <div className="h-full min-h-[100px] flex items-center justify-center">
                            {/* Transparent drop zone */}
                        </div>
                    )}
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-3">
                            <span className="text-xl">📋</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">
                            {t("noTasksInColumn") || "Няма задачи"}
                        </span>
                        <span className="text-[9px] text-slate-300 dark:text-slate-700 mt-1">
                            {t("dropTaskHere") || "Пуснете задача тук"}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper function to darken/lighten a hex color
function adjustColor(hex: string, amount: number): string {
    try {
        const color = hex.replace("#", "");
        const num = parseInt(color, 16);
        let r = (num >> 16) + amount;
        let g = ((num >> 8) & 0x00FF) + amount;
        let b = (num & 0x0000FF) + amount;
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
    } catch {
        return hex;
    }
}
