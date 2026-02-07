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
import { useState, useMemo, useEffect } from "react";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Layers, User, FolderKanban, Flag } from "lucide-react";

interface KanbanBoardProps {
    tasks: any[];
    projects: any[];
    users: any[];
    onTaskClick?: (id: Id<"tasks">) => void;
}

export function KanbanBoard({ tasks: initialTasks, projects, users, onTaskClick }: KanbanBoardProps) {
    const { t, lang } = useLanguage();
    const [tasks, setTasks] = useState(initialTasks);
    const updateTaskStatus = useMutation(api.tasks.update);

    // Fetch dynamic custom statuses
    const customStatuses = useQuery(api.admin.getCustomStatuses, {});
    const customPriorities = useQuery(api.admin.getCustomPriorities, {});
    const viewer = useQuery(api.users.viewer, {});

    // Dynamic columns from custom statuses
    const [columns, setColumns] = useState<string[]>([]);

    // Default fallback statuses when no custom ones exist
    const defaultStatuses = [
        { slug: "todo", label: "За изпълнение", labelEn: "To Do", color: "#6b7280" },
        { slug: "in_progress", label: "В процес", labelEn: "In Progress", color: "#3b82f6" },
        { slug: "in_review", label: "За преглед", labelEn: "In Review", color: "#f59e0b" },
        { slug: "done", label: "Завършени", labelEn: "Done", color: "#22c55e" },
    ];

    useEffect(() => {
        if (customStatuses && customStatuses.length > 0) {
            setColumns(customStatuses.map(s => s.slug));
        } else if (customStatuses !== undefined) {
            // customStatuses loaded but is empty, use defaults
            setColumns(defaultStatuses.map(s => s.slug));
        }
    }, [customStatuses]);

    // Filters
    const [projectFilter, setProjectFilter] = useState<string>("all");
    const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");

    // Sync local tasks with prop changes
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

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

    // Filter tasks
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            if (projectFilter !== "all" && task.projectId !== projectFilter) return false;
            if (assigneeFilter === "me" && task.assigneeId !== viewer?._id) return false;
            if (assigneeFilter !== "all" && assigneeFilter !== "me" && task.assigneeId !== assigneeFilter) return false;
            if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
            return true;
        });
    }, [tasks, projectFilter, assigneeFilter, priorityFilter, viewer?._id]);

    // Group tasks by status
    const tasksByStatus = useMemo(() => {
        const grouped: Record<string, any[]> = {};
        columns.forEach(col => {
            grouped[col] = [];
        });
        filteredTasks.forEach(task => {
            if (grouped[task.status]) {
                grouped[task.status].push(task);
            } else if (columns.length > 0) {
                grouped[columns[0]]?.push(task);
            }
        });
        return grouped;
    }, [filteredTasks, columns]);

    const getColumnLabel = (slug: string) => {
        const status = customStatuses?.find(s => s.slug === slug);
        if (status) {
            return lang === "bg" ? status.label : status.slug;
        }
        // Fallback to defaults
        const fallback = defaultStatuses.find(s => s.slug === slug);
        if (fallback) {
            return lang === "bg" ? fallback.label : fallback.labelEn;
        }
        return slug;
    };

    const getColumnColor = (slug: string) => {
        const status = customStatuses?.find(s => s.slug === slug);
        if (status?.color) return status.color;
        // Fallback to defaults
        const fallback = defaultStatuses.find(s => s.slug === slug);
        return fallback?.color || "#6b7280";
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const activeId = active.id as string;

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
        if (columns.includes(activeId as string)) return;

        const activeTask = tasks.find(t => t._id === activeId);
        if (!activeTask) return;

        const activeContainer = activeTask.status;
        const overContainer = columns.includes(overId as string)
            ? overId as string
            : tasks.find(t => t._id === overId)?.status;

        if (!overContainer || activeContainer === overContainer) return;

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
                toast.success(t("taskStatusUpdated") || "Статусът е обновен");
            } catch (error) {
                toast.error(t("error") || "Грешка при обновяване");
            }
        }
    };

    if (!customStatuses || columns.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-muted-foreground">{t("loading") || "Зареждане..."}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Filter Bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">{t("filterByProject") || "Филтри"}:</span>
                </div>

                {/* Project Filter */}
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                        <FolderKanban className="h-3 w-3 mr-1" />
                        <SelectValue placeholder={t("allProjects")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("allProjects") || "Всички проекти"}</SelectItem>
                        {projects?.map(p => (
                            <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Assignee Filter */}
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                        <User className="h-3 w-3 mr-1" />
                        <SelectValue placeholder={t("allAssignees")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("allAssignees") || "Всички"}</SelectItem>
                        <SelectItem value="me">{t("myTasks") || "Моите задачи"}</SelectItem>
                        {users?.map(u => (
                            <SelectItem key={u._id} value={u._id}>{u.name || u.email}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Priority Filter */}
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                        <Flag className="h-3 w-3 mr-1" />
                        <SelectValue placeholder={t("allPriorities")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("allPriorities") || "Всички"}</SelectItem>
                        {customPriorities?.map(p => (
                            <SelectItem key={p.slug} value={p.slug}>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                                    {lang === "bg" ? p.label : p.slug}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Quick Reset */}
                {(projectFilter !== "all" || assigneeFilter !== "all" || priorityFilter !== "all") && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                            setProjectFilter("all");
                            setAssigneeFilter("all");
                            setPriorityFilter("all");
                        }}
                    >
                        ✕ {t("cancel") || "Изчисти"}
                    </Button>
                )}
            </div>

            {/* Kanban Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-5 flex-1 items-start overflow-x-auto pb-6 custom-scrollbar px-4 pt-4">
                    <SortableContext
                        items={columns}
                        strategy={horizontalListSortingStrategy}
                    >
                        {columns.map((colId) => (
                            <KanbanColumn
                                key={colId}
                                id={colId}
                                title={getColumnLabel(colId) || colId}
                                tasks={tasksByStatus[colId] || []}
                                color={getColumnColor(colId)}
                                projects={projects}
                                users={users}
                                onTaskClick={onTaskClick}
                            />
                        ))}
                    </SortableContext>
                </div>

                {/* Drag Overlay */}
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
                                    title={getColumnLabel(activeColumn) || activeColumn}
                                    tasks={tasksByStatus[activeColumn] || []}
                                    color={getColumnColor(activeColumn)}
                                    projects={projects}
                                    users={users}
                                />
                            </div>
                        ) : null}
                    </DragOverlay>,
                    document.body
                )}
            </DndContext>
        </div>
    );
}
