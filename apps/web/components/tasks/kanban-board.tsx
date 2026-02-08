"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { KanbanTaskCard } from "./kanban-task-card";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";

interface Task {
    _id: Id<"tasks">;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: number;
    assigneeId?: Id<"users">;
    color?: string;
    projectId: Id<"projects">;
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

interface CustomStatus {
    slug: string;
    label: string;
    color?: string;
}

interface KanbanBoardProps {
    tasks: Task[];
    users?: User[];
    projects?: Project[];
    customStatuses?: CustomStatus[];
    onTaskClick?: (id: Id<"tasks">) => void;
}

const DEFAULT_STATUS_COLUMNS = [
    { id: "todo", labelBg: "За изпълнение", labelEn: "To Do", color: "bg-slate-500", borderColor: "border-slate-400" },
    { id: "in_progress", labelBg: "В процес", labelEn: "In Progress", color: "bg-blue-500", borderColor: "border-blue-400" },
    { id: "in_review", labelBg: "В преглед", labelEn: "In Review", color: "bg-yellow-500", borderColor: "border-yellow-400" },
    { id: "done", labelBg: "Завършени", labelEn: "Done", color: "bg-green-500", borderColor: "border-green-400" },
    { id: "blocked", labelBg: "Блокирани", labelEn: "Blocked", color: "bg-red-500", borderColor: "border-red-400" },
];

export function KanbanBoard({ tasks, users, projects, customStatuses, onTaskClick }: KanbanBoardProps) {
    const { lang } = useLanguage();
    const updateTask = useMutation(api.tasks.update);
    const user = useQuery(api.users.me);
    const updateColumnOrder = useMutation(api.users.updateKanbanColumnOrder);

    // Combine default columns with custom statuses (or just use custom statuses if available)
    const allColumns = useMemo(() => {
        // If customStatuses is provided, use it as the source of truth
        // We assume the backend ensures default statuses exist if needed
        let columns: any[] = [];

        if (customStatuses && customStatuses.length > 0) {
            columns = customStatuses.map(cs => ({
                id: cs.slug,
                labelBg: cs.label,
                labelEn: cs.slug.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
                color: cs.color ? "" : "bg-slate-500", // Fallback if no color
                borderColor: cs.color ? "" : "border-slate-400",
                customColor: cs.color,
                order: (cs as any).order || 0
            })).sort((a, b) => a.order - b.order);
        } else {
            // Fallback to defaults only if customStatuses is strictly empty (and loaded)
            // This safeguards against a completely empty board
            columns = DEFAULT_STATUS_COLUMNS;
        }

        // Sort based on user preference if available (overrides default order)
        if (user?.preferences?.kanbanColumnOrder) {
            const order = user.preferences.kanbanColumnOrder;
            return columns.sort((a, b) => {
                const indexA = order.indexOf(a.id);
                const indexB = order.indexOf(b.id);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return 0;
            });
        }

        return columns;
    }, [customStatuses, user?.preferences?.kanbanColumnOrder]);

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId, type } = result;

        if (!destination) return;

        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }

        // Handle Column Reordering
        if (type === "COLUMN") {
            const newColumnOrder = Array.from(allColumns);
            const [removed] = newColumnOrder.splice(source.index, 1);
            newColumnOrder.splice(destination.index, 0, removed);

            const newOrderIds = newColumnOrder.map(c => c.id);

            try {
                await updateColumnOrder({ columnOrder: newOrderIds });
            } catch (error) {
                toast.error("Failed to save layout");
            }
            return;
        }

        // Handle Task Reordering (Status Change)
        const newStatus = destination.droppableId;
        const taskId = draggableId as Id<"tasks">;

        // Optimistic update logic (optional, but good for UX)
        // Here we just call mutation
        try {
            await updateTask({ id: taskId, status: newStatus });
            toast.success(lang === "bg" ? "Статусът е обновен" : "Status updated");
        } catch (error) {
            toast.error(lang === "bg" ? "Грешка при обновяване" : "Error updating status");
        }
    };

    const getTasksByStatus = (status: string) => {
        return tasks.filter(task => task.status === status);
    };

    const getAssignee = (assigneeId?: Id<"users">) => {
        if (!assigneeId || !users) return undefined;
        return users.find(u => u._id === assigneeId);
    };

    const getProject = (projectId: Id<"projects">) => {
        return projects?.find(p => p._id === projectId);
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="board" direction="horizontal" type="COLUMN">
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex gap-6 overflow-x-auto pb-6 min-h-[calc(100vh-280px)] items-start px-2"
                    >
                        {allColumns.map((column, index) => {
                            const columnTasks = getTasksByStatus(column.id);
                            const customColor = (column as any).customColor;
                            return (
                                <Draggable key={column.id} draggableId={column.id} index={index}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={cn(
                                                "flex-shrink-0 w-[320px] rounded-2xl flex flex-col transition-all",
                                                "bg-slate-100/50 dark:bg-slate-900/40", // Column track background
                                                "border border-slate-200/60 dark:border-slate-800/60",
                                                "hover:border-slate-300 dark:hover:border-slate-700"
                                            )}
                                        >
                                            {/* Column Header */}
                                            <div
                                                className={cn(
                                                    "rounded-t-2xl border-t-[5px] px-5 py-4 cursor-grab active:cursor-grabbing bg-white dark:bg-slate-950/80 border-b border-slate-200/50 dark:border-slate-800/50",
                                                    !customColor && column.borderColor
                                                )}
                                                style={customColor ? { borderTopColor: customColor } : undefined}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={cn("w-3 h-3 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-900", !customColor && column.color)}
                                                            style={customColor ? { backgroundColor: customColor } : undefined}
                                                        />
                                                        <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 tracking-tight">
                                                            {lang === "bg" ? column.labelBg : column.labelEn}
                                                        </h3>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                                                        {columnTasks.length}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Droppable Area */}
                                            <Droppable droppableId={column.id} type="TASK">
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        className={cn(
                                                            "flex-1 space-y-3 p-3 transition-colors overflow-y-auto custom-scrollbar",
                                                            "min-h-[150px] max-h-[calc(100vh-380px)]",
                                                            snapshot.isDraggingOver ? "bg-slate-200/40 dark:bg-slate-800/40" : "bg-transparent"
                                                        )}
                                                    >
                                                        {columnTasks.map((task, index) => (
                                                            <Draggable key={task._id} draggableId={task._id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        style={{
                                                                            ...provided.draggableProps.style,
                                                                            transform: snapshot.isDragging ? provided.draggableProps.style?.transform : "translate(0, 0)", // Fix transform jitter
                                                                        }}
                                                                        className={cn(
                                                                            "transition-all duration-200",
                                                                            snapshot.isDragging && "z-50 rotate-1 scale-105 shadow-2xl opacity-90"
                                                                        )}
                                                                    >
                                                                        <div className={cn(snapshot.isDragging && "cursor-grabbing")}>
                                                                            <KanbanTaskCard
                                                                                task={task}
                                                                                assignee={getAssignee(task.assigneeId)}
                                                                                project={getProject(task.projectId)}
                                                                                onClick={() => onTaskClick?.(task._id)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}

                                                        {/* Simple Empty state */}
                                                        {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                                                            <div className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800/80 text-slate-400 dark:text-slate-600">
                                                                <span className="text-sm font-medium">{lang === "bg" ? "Празно" : "Empty"}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Droppable>

                                            {/* Footer gradient fade */}
                                            <div className="h-4 bg-gradient-to-t from-slate-100/50 to-transparent dark:from-slate-900/40 rounded-b-2xl pointer-events-none" />
                                        </div>
                                    )}
                                </Draggable>
                            );
                        })}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
}
