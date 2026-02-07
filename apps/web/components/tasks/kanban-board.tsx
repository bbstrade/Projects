"use client";

import { useMutation } from "convex/react";
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
}

interface User {
    _id: Id<"users">;
    name?: string;
    email?: string;
    avatar?: string;
}

interface KanbanBoardProps {
    tasks: Task[];
    users?: User[];
    onTaskClick?: (id: Id<"tasks">) => void;
}

const STATUS_COLUMNS = [
    { id: "todo", labelBg: "За изпълнение", labelEn: "To Do", color: "bg-slate-500" },
    { id: "in_progress", labelBg: "В процес", labelEn: "In Progress", color: "bg-blue-500" },
    { id: "in_review", labelBg: "В преглед", labelEn: "In Review", color: "bg-yellow-500" },
    { id: "done", labelBg: "Завършени", labelEn: "Done", color: "bg-green-500" },
    { id: "blocked", labelBg: "Блокирани", labelEn: "Blocked", color: "bg-red-500" },
];

export function KanbanBoard({ tasks, users, onTaskClick }: KanbanBoardProps) {
    const { lang } = useLanguage();
    const updateTask = useMutation(api.tasks.update);

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        // Dropped outside a valid droppable
        if (!destination) return;

        // Dropped in the same position
        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }

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

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-300px)]">
                {STATUS_COLUMNS.map((column) => {
                    const columnTasks = getTasksByStatus(column.id);
                    return (
                        <div
                            key={column.id}
                            className="flex-shrink-0 w-[320px] bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 flex flex-col"
                        >
                            {/* Column Header */}
                            <div className="flex items-center gap-2 mb-4 px-1">
                                <div className={cn("w-3 h-3 rounded-full", column.color)} />
                                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                                    {lang === "bg" ? column.labelBg : column.labelEn}
                                </h3>
                                <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                    {columnTasks.length}
                                </span>
                            </div>

                            {/* Droppable Area */}
                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={cn(
                                            "flex-1 space-y-3 min-h-[200px] p-1 rounded-lg transition-colors overflow-y-auto max-h-[calc(100vh-400px)]",
                                            snapshot.isDraggingOver && "bg-slate-200/50 dark:bg-slate-800/50"
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
                                                            "transition-transform",
                                                            snapshot.isDragging && "rotate-2 scale-105"
                                                        )}
                                                    >
                                                        <KanbanTaskCard
                                                            task={task}
                                                            assignee={getAssignee(task.assigneeId)}
                                                            onClick={() => onTaskClick?.(task._id)}
                                                        />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}

                                        {/* Empty state */}
                                        {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                                            <div className="flex items-center justify-center h-24 text-sm text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                                                {lang === "bg" ? "Няма задачи" : "No tasks"}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
        </DragDropContext>
    );
}
