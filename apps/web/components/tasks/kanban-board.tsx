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

    // Combine default columns with custom statuses
    const allColumns = useMemo(() => {
        const defaultIds = DEFAULT_STATUS_COLUMNS.map(c => c.id);
        const customColumns = (customStatuses || [])
            .filter(cs => !defaultIds.includes(cs.slug))
            .map(cs => ({
                id: cs.slug,
                labelBg: cs.label,
                labelEn: cs.slug.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
                color: cs.color ? "" : "bg-purple-500",
                borderColor: cs.color ? "" : "border-purple-400",
                customColor: cs.color,
            }));

        const mergedColumns = [...DEFAULT_STATUS_COLUMNS, ...customColumns];

        // Sort based on user preference if available
        if (user?.preferences?.kanbanColumnOrder) {
            const order = user.preferences.kanbanColumnOrder;
            return mergedColumns.sort((a, b) => {
                const indexA = order.indexOf(a.id);
                const indexB = order.indexOf(b.id);
                // If both found, sort by index
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                // If only A found, A comes first
                if (indexA !== -1) return -1;
                // If only B found, B comes first
                if (indexB !== -1) return 1;
                // If neither found, keep original order (or put at end)
                return 0;
            });
        }

        return mergedColumns;
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

            // Optimistic update could be done here if we had local state for columns
            // But we rely on parent/convex, so we just call mutation
            try {
                await updateColumnOrder({ columnOrder: newOrderIds });
                // toast.success("Layout saved"); 
            } catch (error) {
                toast.error("Failed to save layout");
            }
            return;
        }

        // Handle Task Reordering (Status Change)
        const newStatus = destination.droppableId;
        const taskId = draggableId as Id<"tasks">;

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
                        className="flex gap-5 overflow-x-auto pb-4 min-h-[calc(100vh-300px)] items-start"
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
                                            {...provided.dragHandleProps} // Drag handle for the whole column
                                            className={cn(
                                                "flex-shrink-0 w-[300px] rounded-xl flex flex-col",
                                                "bg-gradient-to-b from-slate-100/80 to-slate-50/50 dark:from-slate-900/80 dark:to-slate-950/50",
                                                "border border-slate-200/60 dark:border-slate-800/60",
                                                "shadow-sm"
                                            )}
                                        >
                                            {/* Column Header with colored top border */}
                                            <div
                                                className={cn(
                                                    "rounded-t-xl border-t-4 px-4 py-3 cursor-grab active:cursor-grabbing", // Changed cursor
                                                    !customColor && column.borderColor
                                                )}
                                                style={customColor ? { borderTopColor: customColor } : undefined}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={cn("w-2.5 h-2.5 rounded-full shadow-sm", !customColor && column.color)}
                                                        style={customColor ? { backgroundColor: customColor } : undefined}
                                                    />
                                                    <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">
                                                        {lang === "bg" ? column.labelBg : column.labelEn}
                                                    </h3>
                                                    <span className="ml-auto text-xs font-bold text-white bg-slate-400 dark:bg-slate-600 px-2 py-0.5 rounded-full min-w-[24px] text-center">
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
                                                            "flex-1 space-y-3 p-3 rounded-b-xl transition-all overflow-y-auto",
                                                            "min-h-[200px] max-h-[calc(100vh-380px)]",
                                                            snapshot.isDraggingOver && "bg-slate-200/70 dark:bg-slate-800/70 ring-2 ring-inset ring-primary/30"
                                                        )}
                                                    >
                                                        {columnTasks.map((task, index) => (
                                                            <Draggable key={task._id} draggableId={task._id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        className={cn(
                                                                            "transition-all duration-200",
                                                                            snapshot.isDragging && "rotate-2 scale-105 shadow-2xl"
                                                                        )}
                                                                    >
                                                                        <KanbanTaskCard
                                                                            task={task}
                                                                            assignee={getAssignee(task.assigneeId)}
                                                                            project={getProject(task.projectId)}
                                                                            onClick={() => onTaskClick?.(task._id)}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}

                                                        {/* Empty state */}
                                                        {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                                                            <div className="flex flex-col items-center justify-center h-28 text-sm text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-900/50">
                                                                <span className="text-2xl mb-1">📋</span>
                                                                {lang === "bg" ? "Няма задачи" : "No tasks"}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Droppable>
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
