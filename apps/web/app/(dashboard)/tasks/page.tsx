"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TaskCard } from "@/components/tasks/task-card";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { CalendarView } from "@/components/tasks/calendar-view";
import { format } from "date-fns";
import {
    LayoutGrid, List, Filter, Calendar,
    CheckCircle2, Clock, BarChart3, GanttChart as GanttChartIcon,
    AlertTriangle, Trash2, ListTodo
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { FilterPopover } from "@/components/ui/filter-popover";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { StatsCards } from "@/components/shared/stats-cards";
import { GanttView } from "@/components/shared/gantt-view";
import { Id } from "@/convex/_generated/dataModel";

export default function TasksPage() {
    const tasks = useQuery(api.tasks.listAll, {});
    const users = useQuery(api.users.list);
    const projects = useQuery(api.projects.list);
    const metrics = useQuery(api.analytics.taskMetrics, {});
    const customStatuses = useQuery(api.admin.getCustomStatuses, { type: "task" });

    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [assigneeFilter, setAssigneeFilter] = useState("all");
    const [projectFilter, setProjectFilter] = useState("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState<"grid" | "list" | "gantt" | "calendar">("grid");
    const [showFilters, setShowFilters] = useState(false);

    // Task Detail Dialog State
    const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null);

    const { lang } = useLanguage();

    const processedTasks = useMemo(() => {
        if (!tasks) return [];

        let filtered = tasks.filter((task) => {
            const matchesStatus = statusFilter === "all" || task.status === statusFilter;
            const matchesPriority = priorityFilter === "all" || task.priority?.toLowerCase() === priorityFilter;
            const matchesAssignee = assigneeFilter === "all" || task.assigneeId === assigneeFilter;
            const matchesProject = projectFilter === "all" || task.projectId === projectFilter;

            let matchesTimeframe = true;
            if (dateRange?.from && task.dueDate) {
                if (dateRange.to) {
                    matchesTimeframe = task.dueDate >= dateRange.from.getTime() && task.dueDate <= dateRange.to.getTime();
                } else {
                    matchesTimeframe = task.dueDate >= dateRange.from.getTime();
                }
            }

            return matchesStatus && matchesPriority && matchesAssignee && matchesProject && matchesTimeframe;
        });

        // Sorting
        return [...filtered].sort((a, b) => {
            switch (sortBy) {
                case "oldest":
                    return (a.createdAt || 0) - (b.createdAt || 0);
                case "title":
                    return a.title.localeCompare(b.title);
                case "dueDate":
                    return (a.dueDate || Infinity) - (b.dueDate || Infinity);
                case "priority":
                    const priorityMap: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
                    return (priorityMap[a.priority?.toLowerCase() || "medium"] ?? 4) - (priorityMap[b.priority?.toLowerCase() || "medium"] ?? 4);
                case "newest":
                default:
                    return (b.createdAt || 0) - (a.createdAt || 0);
            }
        });
    }, [tasks, statusFilter, priorityFilter, assigneeFilter, projectFilter, dateRange, sortBy]);

    const labels = {
        bg: {
            title: "Задачи",
            subtitle: "Управлявайте и следете всички ваши задачи.",
            status: "Статус",
            priority: "Приоритет",
            assignee: "Изпълнител",
            project: "Проект",
            all: "Всички",
            todo: "За изпълнение",
            in_progress: "В процес",
            in_review: "В преглед",
            done: "Завършени",
            blocked: "Блокирани",
            high: "Висок",
            medium: "Среден",
            low: "Нисък",
            critical: "Критичен",
            noTasks: "Няма намерени задачи",
            start: "Започнете като създадете своя първа задача.",
            sortBy: "Сортиране",
            newest: "Най-нови",
            oldest: "Най-стари",
            titleSort: "Заглавие (А-Я)",
            dueDate: "Краен срок",
            timeframe: "Период",
            filters: "Филтри",
            clearFilters: "Изчисти филтри",
            allAssignees: "Всички изпълнители",
            allProjects: "Всички проекти",
            board: "Борд",
            list: "Списък",
            stats: {
                total: "Общо задачи",
                inProgress: "В процес",
                completed: "Завършени",
                overdue: "Просрочени"
            }
        },
        en: {
            title: "Tasks",
            subtitle: "Manage and track all your tasks.",
            status: "Status",
            priority: "Priority",
            assignee: "Assignee",
            project: "Project",
            all: "All",
            todo: "To Do",
            in_progress: "In Progress",
            in_review: "In Review",
            done: "Done",
            blocked: "Blocked",
            high: "High",
            medium: "Medium",
            low: "Low",
            critical: "Critical",
            noTasks: "No tasks found",
            start: "Get started by creating your first task.",
            sortBy: "Sort By",
            newest: "Newest",
            oldest: "Oldest",
            titleSort: "Title (A-Z)",
            dueDate: "Due Date",
            timeframe: "Timeframe",
            filters: "Filters",
            clearFilters: "Clear Filters",
            allAssignees: "All Assignees",
            allProjects: "All Projects",
            board: "Board",
            list: "List",
            stats: {
                total: "Total Tasks",
                inProgress: "In Progress",
                completed: "Completed",
                overdue: "Overdue"
            }
        }
    };

    const t = labels[lang];

    const taskStats = [
        { label: t.stats.total, value: metrics?.totalTasks || 0, icon: ListTodo, color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" },
        { label: t.stats.inProgress, value: metrics?.inProgress || 0, icon: Clock, color: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" },
        { label: t.stats.completed, value: metrics?.completed || 0, icon: CheckCircle2, color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" },
        { label: t.stats.overdue, value: metrics?.overdue || 0, icon: AlertTriangle, color: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" },
    ];

    const handleTaskClick = (id: Id<"tasks">) => {
        setSelectedTaskId(id);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors duration-300">
            {/* Header Area */}
            <div className="bg-white dark:bg-slate-950 border-b border-border shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight">{t.title}</h1>
                            <p className="text-muted-foreground text-sm mt-1">{t.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <CreateTaskDialog />
                        </div>
                    </div>

                    {/* Stats Area */}
                    <StatsCards stats={taskStats} />

                    {/* Filters & Tools */}
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-2xl border border-border/50">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={cn(
                                        "h-10 px-4 font-bold transition-all",
                                        showFilters ? "bg-slate-100 dark:bg-slate-800 text-blue-600 border-blue-200 dark:border-blue-900" : "text-slate-600 border-slate-200 bg-white"
                                    )}
                                >
                                    <Filter className={cn("mr-2 h-4 w-4", showFilters && "fill-current")} />
                                    {t.filters}
                                </Button>

                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-[180px] h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all hover:bg-white shadow-sm">
                                        <SelectValue placeholder={t.sortBy} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">{t.newest}</SelectItem>
                                        <SelectItem value="oldest">{t.oldest}</SelectItem>
                                        <SelectItem value="title">{t.titleSort}</SelectItem>
                                        <SelectItem value="dueDate">{t.dueDate}</SelectItem>
                                        <SelectItem value="priority">{t.priority}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-6">
                                {/* View Modes */}
                                <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-1 rounded-xl border border-border shadow-sm">
                                    {[
                                        { mode: "grid", Icon: LayoutGrid, label: t.board },
                                        { mode: "list", Icon: List, label: t.list },
                                        { mode: "gantt", Icon: GanttChartIcon, label: "Gantt" },
                                        { mode: "calendar", Icon: Calendar, label: lang === "bg" ? "Календар" : "Calendar" },
                                    ].map(({ mode, Icon, label }) => (
                                        <Button
                                            key={mode}
                                            variant={viewMode === mode ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() => setViewMode(mode as any)}
                                            className={cn(
                                                "h-8 flex items-center gap-2 px-3 rounded-lg text-[11px] font-bold transition-all",
                                                viewMode === mode
                                                    ? "bg-slate-100 dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white"
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

                        {/* Collapsible Filters */}
                        {showFilters && (
                            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-border shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex flex-wrap gap-2">
                                    <FilterPopover
                                        title={t.status}
                                        value={statusFilter}
                                        onChange={setStatusFilter}
                                        options={[
                                            { label: t.all, value: "all" },
                                            { label: t.todo, value: "todo" },
                                            { label: t.in_progress, value: "in_progress" },
                                            { label: t.in_review, value: "in_review" },
                                            { label: t.done, value: "done" },
                                            { label: t.blocked, value: "blocked" },
                                        ]}
                                    />

                                    <FilterPopover
                                        title={t.priority}
                                        value={priorityFilter}
                                        onChange={setPriorityFilter}
                                        options={[
                                            { label: t.all, value: "all" },
                                            { label: t.critical, value: "critical" },
                                            { label: t.high, value: "high" },
                                            { label: t.medium, value: "medium" },
                                            { label: t.low, value: "low" },
                                        ]}
                                    />

                                    <FilterPopover
                                        title={t.assignee}
                                        value={assigneeFilter}
                                        onChange={setAssigneeFilter}
                                        options={[
                                            { label: t.allAssignees, value: "all" },
                                            ...(users?.map(user => ({
                                                label: user.name || "Unknown",
                                                value: user._id
                                            })) || [])
                                        ]}
                                    />

                                    <FilterPopover
                                        title={t.project}
                                        value={projectFilter}
                                        onChange={setProjectFilter}
                                        options={[
                                            { label: t.allProjects, value: "all" },
                                            ...(projects?.map(project => ({
                                                label: project.name,
                                                value: project._id
                                            })) || [])
                                        ]}
                                    />

                                    <div className="flex items-center">
                                        <DateRangePicker
                                            date={dateRange}
                                            onDateChange={setDateRange}
                                            placeholder={t.timeframe}
                                            className="h-9 border-dashed"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end items-center mt-6 pt-6 border-t border-border/50">
                                    {(statusFilter !== "all" || priorityFilter !== "all" || assigneeFilter !== "all" || projectFilter !== "all" || dateRange !== undefined) && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setStatusFilter("all");
                                                setPriorityFilter("all");
                                                setAssigneeFilter("all");
                                                setProjectFilter("all");
                                                setDateRange(undefined);
                                            }}
                                            className="h-10 px-4 text-xs font-bold text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-all gap-2"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            {t.clearFilters}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-[1600px] mx-auto">
                    {processedTasks === undefined ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="bg-white dark:bg-card border border-border rounded-xl p-5 h-[200px] animate-pulse">
                                    <div className="flex justify-between mb-4">
                                        <div className="size-10 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                                        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                    </div>
                                    <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                                    <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded mb-6"></div>
                                </div>
                            ))}
                        </div>
                    ) : processedTasks.length === 0 ? (
                        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center bg-white dark:bg-slate-950">
                            <div className="bg-slate-100 dark:bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                <ListTodo className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t.noTasks}</h2>
                            <p className="mt-2 text-muted-foreground max-w-sm mx-auto">{t.start}</p>
                            <div className="mt-6 flex items-center gap-3">
                                <Button variant="outline" onClick={() => {
                                    setStatusFilter("all");
                                    setPriorityFilter("all");
                                    setAssigneeFilter("all");
                                    setProjectFilter("all");
                                }}>
                                    {t.clearFilters}
                                </Button>
                                <CreateTaskDialog />
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Kanban Board View */}
                            {viewMode === "grid" && (
                                <KanbanBoard
                                    tasks={processedTasks}
                                    users={users}
                                    projects={projects}
                                    customStatuses={customStatuses}
                                    onTaskClick={handleTaskClick}
                                />
                            )}

                            {/* List View */}
                            {viewMode === "list" && (
                                <div className="flex flex-col gap-3">
                                    {processedTasks.map((task) => {
                                        const assignee = task.assigneeId ? users?.find(u => u._id === task.assigneeId) : undefined;
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
                                                assignee={assignee ? { name: assignee.name, image: assignee.avatar } : undefined}
                                                color={task.color}
                                                onClick={handleTaskClick}
                                            />
                                        );
                                    })}
                                </div>
                            )}

                            {/* Gantt View */}
                            {viewMode === "gantt" && (
                                <GanttView
                                    items={processedTasks
                                        .filter(t => t.dueDate)
                                        .map(t => ({
                                            id: t._id,
                                            title: t.title,
                                            startDate: t.createdAt || Date.now(),
                                            endDate: t.dueDate || (t.createdAt || Date.now()) + (7 * 86400000),
                                            progress: t.status === "done" ? 100 : t.status === "in_progress" ? 50 : 0,
                                            color: t.priority === "high" ? "bg-amber-500" :
                                                t.priority === "critical" ? "bg-rose-500" : "bg-blue-500",
                                            status: t.status,
                                            priority: t.priority
                                        }))}
                                />
                            )}

                            {/* Calendar View */}
                            {viewMode === "calendar" && (
                                <CalendarView
                                    tasks={processedTasks}
                                    onTaskClick={handleTaskClick}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Task Detail Dialog */}
            <TaskDetailDialog
                taskId={selectedTaskId}
                open={!!selectedTaskId}
                onOpenChange={(open) => !open && setSelectedTaskId(null)}
            />
        </div>
    );
}
