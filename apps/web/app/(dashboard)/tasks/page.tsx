"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { StatsCards } from "@/components/shared/stats-cards";
import { GanttView } from "@/components/shared/gantt-view";
import { CalendarView } from "@/components/shared/calendar-view";
import {
    LayoutDashboard, List, Calendar as CalendarIcon, GanttChart as GanttChartIcon,
    Search, Plus, Filter, Trash2, CheckCircle2, Clock, AlertCircle, ListTodo
} from "lucide-react";
import { FilterPopover } from "@/components/ui/filter-popover";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type ViewMode = "kanban" | "list" | "gantt" | "calendar";

export default function TasksPage() {
    const { t, lang } = useLanguage();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [assigneeFilter, setAssigneeFilter] = useState("all");
    const [projectFilter, setProjectFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState<ViewMode>("kanban");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Detail Dialog State
    const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const openTask = (taskId: Id<"tasks">) => {
        setSelectedTaskId(taskId);
        setIsDetailOpen(true);
    };

    // Fetch data
    const projects = useQuery(api.projects.list, {});
    const users = useQuery(api.users.list, {});
    const tasks = useQuery(api.tasks.listAll, {});

    const firstProjectId = projects?.[0]?._id;

    // Sorting & Filtering Logic
    const processedTasks = useMemo(() => {
        if (!tasks) return [];

        let filtered = tasks.filter((task) => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "all" || task.status === statusFilter;
            const matchesPriority = priorityFilter === "all" || task.priority?.toLowerCase() === priorityFilter;
            const matchesAssignee = assigneeFilter === "all" || task.assigneeId === assigneeFilter;
            const matchesProject = projectFilter === "all" || task.projectId === projectFilter;
            return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesProject;
        });

        return [...filtered].sort((a, b) => {
            switch (sortBy) {
                case "oldest":
                    return a._creationTime - b._creationTime;
                case "name":
                    return a.title.localeCompare(b.title);
                case "deadline":
                    return (a.dueDate || Infinity) - (b.dueDate || Infinity);
                case "priority":
                    const priorityMap: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
                    return (priorityMap[a.priority?.toLowerCase()] ?? 4) - (priorityMap[b.priority?.toLowerCase()] ?? 4);
                case "newest":
                default:
                    return b._creationTime - a._creationTime;
            }
        });
    }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter, projectFilter, sortBy]);

    // Calculate stats
    const stats = useMemo(() => {
        if (!processedTasks) return null;
        const now = Date.now();
        return {
            total: processedTasks.length,
            todo: processedTasks.filter(t => t.status === "todo").length,
            inProgress: processedTasks.filter(t => t.status === "in_progress").length,
            completed: processedTasks.filter(t => t.status === "done").length,
            overdue: processedTasks.filter(t => t.dueDate && t.dueDate < now && t.status !== "done").length,
        };
    }, [processedTasks]);

    const taskStats = [
        { label: t("statsTotal") || "Общо задачи", value: stats?.total || 0, icon: ListTodo, color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" },
        { label: t("statsTodo") || "За изпълнение", value: stats?.todo || 0, icon: Clock, color: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400" },
        { label: t("statsInProgress") || "В процес", value: stats?.inProgress || 0, icon: Clock, color: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" },
        { label: t("statsCompleted") || "Завършени", value: stats?.completed || 0, icon: CheckCircle2, color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" },
        { label: t("statsOverdue") || "Просрочени", value: stats?.overdue || 0, icon: AlertCircle, color: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400" },
    ];

    const clearFilters = () => {
        setStatusFilter("all");
        setPriorityFilter("all");
        setAssigneeFilter("all");
        setProjectFilter("all");
        setSearchQuery("");
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {t("tasksTitle") || "Задачи"}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t("tasksSubtitle") || "Управлявайте задачите по проекти"}
                    </p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="shadow-lg hover:shadow-xl transition-all">
                    <Plus className="mr-2 h-5 w-5" />
                    {t("newTask") || "Нова Задача"}
                </Button>
            </div>

            {/* Stats */}
            <StatsCards stats={taskStats.slice(0, 5)} />

            {/* Toolbar & Filters */}
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-950 p-2 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "h-10 px-4 font-bold transition-all",
                                showFilters ? "bg-slate-100 dark:bg-slate-800 text-blue-600 border-blue-200 dark:border-blue-900" : "text-slate-600 border-slate-200"
                            )}
                        >
                            <Filter className={cn("mr-2 h-4 w-4", showFilters && "fill-current")} />
                            {t("filters") || "Филтри"}
                        </Button>

                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[180px] h-10 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all hover:bg-white">
                                <SelectValue placeholder={t("sortBy") || "Сортиране"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">{t("sortNewest") || "Най-нови"}</SelectItem>
                                <SelectItem value="oldest">{t("sortOldest") || "Най-стари"}</SelectItem>
                                <SelectItem value="name">{t("sortName") || "Име (А-Я)"}</SelectItem>
                                <SelectItem value="deadline">{t("sortDeadline") || "Краен срок"}</SelectItem>
                                <SelectItem value="priority">{t("sortPriority") || "Приоритет"}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* View Modes */}
                        <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl border border-border/50">
                            {[
                                { mode: "kanban" as ViewMode, Icon: LayoutDashboard, label: t("viewKanban") || "Канбан" },
                                { mode: "list" as ViewMode, Icon: List, label: t("viewList") || "Списък" },
                                { mode: "calendar" as ViewMode, Icon: CalendarIcon, label: t("viewCalendar") || "Календар" },
                                { mode: "gantt" as ViewMode, Icon: GanttChartIcon, label: "Gantt" },
                            ].map(({ mode, Icon, label }) => (
                                <Button
                                    key={mode}
                                    variant={viewMode === mode ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode(mode)}
                                    className={cn(
                                        "h-8 flex items-center gap-2 px-3 rounded-lg text-[11px] font-bold transition-all",
                                        viewMode === mode
                                            ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                                            : "text-slate-500 hover:text-slate-900"
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                {showFilters && (
                    <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-border shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex flex-wrap gap-2">
                            <FilterPopover
                                title={t("status") || "Статус"}
                                value={statusFilter}
                                onChange={setStatusFilter}
                                options={[
                                    { label: t("allStatuses") || "Всички статуси", value: "all" },
                                    { label: t("statsTodo") || "За изпълнение", value: "todo" },
                                    { label: t("statsInProgress") || "В процес", value: "in_progress" },
                                    { label: "В преглед", value: "in_review" },
                                    { label: t("statsCompleted") || "Завършени", value: "done" },
                                ]}
                            />

                            <FilterPopover
                                title={t("priority") || "Приоритет"}
                                value={priorityFilter}
                                onChange={setPriorityFilter}
                                options={[
                                    { label: t("allPriorities") || "Всички приоритети", value: "all" },
                                    { label: "Висок", value: "high" },
                                    { label: "Среден", value: "medium" },
                                    { label: "Нисък", value: "low" },
                                    { label: "Критичен", value: "critical" },
                                ]}
                            />

                            <FilterPopover
                                title={t("filterByAssignee") || "Отговорник"}
                                value={assigneeFilter}
                                onChange={setAssigneeFilter}
                                options={[
                                    { label: t("allAssignees") || "Всички отговорници", value: "all" },
                                    ...(users?.map(user => ({
                                        label: user.name || "Unknown",
                                        value: user._id
                                    })) || [])
                                ]}
                            />

                            <FilterPopover
                                title={t("project") || "Проект"}
                                value={projectFilter}
                                onChange={setProjectFilter}
                                options={[
                                    { label: t("allProjects") || "Всички проекти", value: "all" },
                                    ...(projects?.map(project => ({
                                        label: project.name || "Unknown",
                                        value: project._id
                                    })) || [])
                                ]}
                            />
                        </div>

                        <div className="flex justify-between items-center mt-6 pt-6 border-t border-border/50">
                            <div className="flex-1"></div>

                            {(statusFilter !== "all" || priorityFilter !== "all" || assigneeFilter !== "all" || projectFilter !== "all") && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-10 px-4 text-xs font-bold text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-all gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {t("clearFilters") || "Изчисти филтри"}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Task Content */}
            {tasks === undefined ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : processedTasks.length === 0 ? (
                <div className="bg-white dark:bg-slate-950 rounded-2xl border border-dashed border-border p-12 text-center">
                    <div className="bg-slate-100 dark:bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Filter className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {t("noTasksFound") || "Няма намерени задачи"}
                    </h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                        {t("noTasksDescription") || "Създайте нова задача, за да започнете."}
                    </p>
                    <Button variant="outline" onClick={clearFilters} className="mt-6">
                        {t("clearFilters") || "Изчисти филтрите"}
                    </Button>
                </div>
            ) : (
                <>
                    {viewMode === "kanban" && (
                        <KanbanBoard
                            tasks={processedTasks}
                            projects={projects || []}
                            users={users || []}
                            onTaskClick={openTask}
                        />
                    )}

                    {viewMode === "list" && (
                        <div className="flex flex-col gap-3">
                            {processedTasks.map((task) => {
                                const assignee = users?.find(u => u._id === task.assigneeId);
                                return (
                                    <TaskCard
                                        key={task._id}
                                        id={task._id}
                                        title={task.title}
                                        description={task.description}
                                        status={task.status}
                                        priority={task.priority}
                                        dueDate={task.dueDate}
                                        viewMode="list"
                                        assignee={{ name: assignee?.name, image: assignee?.avatar }}
                                        color={task.color}
                                        // @ts-ignore
                                        onClick={() => openTask(task._id)}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {viewMode === "gantt" && (
                        <GanttView
                            items={processedTasks.map(t => ({
                                id: t._id,
                                title: t.title,
                                startDate: t.createdAt || t._creationTime,
                                endDate: t.dueDate || (t.createdAt || t._creationTime) + 86400000,
                                progress: t.status === "done" ? 100 : t.status === "in_progress" ? 50 : 0,
                                color: t.priority === "critical" ? "bg-rose-500" :
                                    t.priority === "high" ? "bg-amber-500" : "bg-blue-500"
                            }))}
                        />
                    )}

                    {viewMode === "calendar" && (
                        <CalendarView
                            tasks={processedTasks.map(t => ({
                                id: t._id,
                                title: t.title,
                                dueDate: t.dueDate || (t.createdAt || t._creationTime),
                                status: t.status,
                                priority: t.priority
                            }))}
                            onTaskClick={(id: string) => openTask(id as Id<"tasks">)}
                        />
                    )}
                </>
            )}

            {/* Dialogs */}
            {firstProjectId && (
                <CreateTaskDialog
                    open={createDialogOpen}
                    onOpenChange={setCreateDialogOpen}
                    projectId={projectFilter !== "all" ? (projectFilter as Id<"projects">) : firstProjectId}
                />
            )}

            {selectedTaskId && (
                <TaskDetailDialog
                    taskId={selectedTaskId}
                    open={isDetailOpen}
                    onOpenChange={setIsDetailOpen}
                />
            )}
        </div>
    );
}
