"use client";

import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState, useMemo } from "react";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { createPortal } from "react-dom";

interface KanbanBoardProps {
    tasks: any[];
    projects: any[];
    users: any[];
    onTaskClick?: (id: Id<"tasks">) => void;
}

export function KanbanBoard({ tasks: initialTasks, projects, users, onTaskClick }: KanbanBoardProps) {
    const [tasks, setTasks] = useState(initialTasks);
    const updateTaskStatus = useMutation(api.tasks.update);

    // Sort columns based on user screenshot order
    const [columns, setColumns] = useState(["todo", "in_progress", "in_review", "done"]);
    const columnLabels: Record<string, string> = {
        todo: "За изпълнение",
        in_progress: "В процес",
        in_review: "За преглед",
        done: "Завършени",
    };
    const columnColors: Record<string, string> = {
        todo: "gray",
        in_progress: "blue",
        in_review: "orange",
        done: "green",
    };

    const [activeTask, setActiveTask] = useState<any>(null);
    const [activeColumn, setActiveColumn] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Group tasks by status
    const tasksByStatus = useMemo(() => {
        const grouped: Record<string, any[]> = {
            todo: [],
            in_progress: [],
            in_review: [],
            done: [],
        };
        tasks.forEach(task => {
            if (grouped[task.status]) {
                grouped[task.status].push(task);
            } else {
                grouped.todo.push(task);
            }
        });
        return grouped;
    }, [tasks]);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const activeId = active.id as string;

        // Check if dragging a column
        if (columns.includes(activeId)) {
            setActiveColumn(activeId);
            return;
        }

        const task = tasks.find(t => t._id === activeId);
        if (task) setActiveTask(task);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        // Column dragging doesn't need DragOver logic in this implementation
        if (columns.includes(activeId as string)) return;

        const activeTask = tasks.find(t => t._id === activeId);
        if (!activeTask) return;

        // Find the container for 'over' (could be a task or a column)
        const activeContainer = activeTask.status;
        const overContainer = columns.includes(overId as string)
            ? overId as string
            : tasks.find(t => t._id === overId)?.status;

        if (!overContainer || activeContainer === overContainer) return;

        // Optimistically update task status in state during drag over
        setTasks(prev => {
            return prev.map(t => t._id === activeId ? { ...t, status: overContainer } : t);
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);
        setActiveColumn(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // If dragging columns
        if (columns.includes(activeId as string)) {
            if (activeId !== overId) {
                const oldIndex = columns.indexOf(activeId as string);
                const newIndex = columns.indexOf(overId as string);
                setColumns(arrayMove(columns, oldIndex, newIndex));
            }
            return;
        }

        const task = tasks.find(t => t._id === activeId);
        if (!task) return;

        const finalStatus = columns.includes(overId as string)
            ? overId as string
            : tasks.find(t => t._id === overId)?.status;

        if (finalStatus && task.status !== finalStatus) {
            try {
                await updateTaskStatus({
                    id: activeId as Id<"tasks">,
                    status: finalStatus as any
                });
                toast.success(`Статусът на "${task.title}" беше обновен`);
            } catch (error) {
                toast.error("Грешка при обновяване на статуса");
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-6 h-full items-start overflow-x-auto pb-6 custom-scrollbar px-2 pt-2">
                <SortableContext
                    items={columns}
                    strategy={horizontalListSortingStrategy}
                >
                    {columns.map((colId) => (
                        <KanbanColumn
                            key={colId}
                            id={colId}
                            title={columnLabels[colId]}
                            tasks={tasksByStatus[colId] || []}
                            color={columnColors[colId]}
                            projects={projects}
                            users={users}
                            onTaskClick={onTaskClick}
                        />
                    ))}
                </SortableContext>
            </div>

            {/* Drag Overlay for smooth preview */}
            {typeof document !== 'undefined' && createPortal(
                <DragOverlay dropAnimation={{
                    sideEffects: defaultDropAnimationSideEffects({
                        styles: {
                            active: {
                                opacity: "0.5",
                            },
                        },
                    }),
                }}>
                    {activeTask ? (
                        <div className="w-[320px] rotate-3 scale-105 shadow-2xl opacity-90 pointer-events-none">
                            <KanbanCard
                                id={activeTask._id}
                                task={activeTask}
                                projectName={projects?.find(p => p._id === activeTask.projectId)?.name}
                                assignee={users?.find(u => u._id === activeTask.assigneeId)}
                            />
                        </div>
                    ) : activeColumn ? (
                        <div className="rotate-2 scale-102 shadow-2xl opacity-90 pointer-events-none">
                            <KanbanColumn
                                id={activeColumn}
                                title={columnLabels[activeColumn]}
                                tasks={tasksByStatus[activeColumn] || []}
                                color={columnColors[activeColumn]}
                                projects={projects}
                                users={users}
                            />
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
