"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProjectCard } from "@/components/projects/project-card";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { format } from "date-fns";
import {
    Search, LayoutGrid, List, Filter, Globe, Sun, Moon,
    CheckCircle2, Clock, BarChart3, GanttChart as GanttChartIcon,
    ArrowUpDown, AlertCircle, Users, Trash2, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { FilterPopover } from "@/components/ui/filter-popover";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
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
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { Id } from "@/convex/_generated/dataModel";

export default function ProjectsPage() {
    const projects = useQuery(api.projects.list);
    const users = useQuery(api.users.list);
    const metrics = useQuery(api.analytics.dashboardMetrics, {});
    const [searchQuery, setSearchQuery] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [managerFilter, setManagerFilter] = useState("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState<"grid" | "list" | "gantt">("grid");
    const [showFilters, setShowFilters] = useState(false);

    // Edit Dialog State
    const [editingProject, setEditingProject] = useState<{
        _id: Id<"projects">;
        name: string;
        description?: string;
        priority?: string;
        status?: string;
        startDate?: number;
        endDate?: number;
    } | null>(null);

    // Localization & Theme (Now global)
    const { lang } = useLanguage();
    const { theme, setTheme } = useTheme();

    // Helper for deterministic mock data
    const productIdentifier = (id: string) => {
        return id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    };

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

    const processedProjects = useMemo(() => {
        if (!projects) return [];

        let filtered = projects.filter((project) => {
            const matchesSearch = searchQuery === "all" || searchQuery === "" || project.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "all" || project.status === statusFilter;
            const projectPriority = (project.priority as string)?.toLowerCase() || "medium";
            const matchesPriority = priorityFilter === "all" || projectPriority === priorityFilter;
            const matchesOwner = managerFilter === "all" || project.ownerId === managerFilter;

            let matchesTimeframe = true;
            if (dateRange?.from) {
                const projectEnd = project.endDate || project._creationTime;
                if (dateRange.to) {
                    matchesTimeframe = projectEnd >= dateRange.from.getTime() && projectEnd <= dateRange.to.getTime();
                } else {
                    matchesTimeframe = projectEnd >= dateRange.from.getTime();
                }
            }

            return matchesSearch && matchesStatus && matchesPriority && matchesOwner && matchesTimeframe;
        });

        // Sorting
        return [...filtered].sort((a, b) => {
            switch (sortBy) {
                case "oldest":
                    return a._creationTime - b._creationTime;
                case "name":
                    return a.name.localeCompare(b.name);
                case "deadline":
                    return (a.endDate || Infinity) - (b.endDate || Infinity);
                case "priority":
                    const priorityMap: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
                    return (priorityMap[a.priority?.toLowerCase() || "medium"] ?? 4) - (priorityMap[b.priority?.toLowerCase() || "medium"] ?? 4);
                case "newest":
                default:
                    return b._creationTime - a._creationTime;
            }
        });
    }, [projects, searchQuery, statusFilter, priorityFilter, managerFilter, dateRange, sortBy]);

    const labels = {
        bg: {
            title: "Проекти",
            subtitle: "Управлявайте и следете своите активни инициативи.",
            search: "Търсене на проекти...",
            status: "Статус",
            priority: "Приоритет",
            manager: "Мениджър",
            all: "Всички",
            active: "Активни",
            draft: "Чернови",
            completed: "Завършени",
            in_progress: "В процес",
            review: "Преглед",
            high: "Висок",
            medium: "Среден",
            low: "Нисък",
            noProjects: "Няма намерени проекти",
            start: "Започнете като създадете своя първи проект.",
            switchLang: "EN",
            switchTheme: "Тема",
            sortBy: "Сортиране",
            newest: "Най-нови",
            oldest: "Най-стари",
            name: "Име (А-Я)",
            deadline: "Краен срок",
            timeframe: "Период",
            stats: {
                total: "Общо проекти",
                active: "Активни",
                completed: "Завършени",
                percentage: "Завършеност"
            }
        },
        en: {
            title: "Projects",
            subtitle: "Manage and track your active initiatives.",
            search: "Search projects...",
            status: "Status",
            priority: "Priority",
            manager: "Manager",
            all: "All",
            active: "Active",
            draft: "Drafts",
            completed: "Completed",
            in_progress: "In Progress",
            review: "Review",
            high: "High",
            medium: "Medium",
            low: "Low",
            noProjects: "No projects found",
            start: "Get started by creating your first project.",
            switchLang: "БГ",
            switchTheme: "Theme",
            sortBy: "Sort By",
            newest: "Newest",
            oldest: "Oldest",
            name: "Name (A-Z)",
            deadline: "Deadline",
            timeframe: "Timeframe",
            stats: {
                total: "Total Projects",
                active: "Active",
                completed: "Completed",
                percentage: "Completion"
            }
        }
    };

    const t = labels[lang];

    const completionPercentage = metrics
        ? Math.round((metrics.completedProjects / (metrics.totalProjects || 1)) * 100)
        : 0;

    const projectStats = [
        { label: t.stats.total, value: metrics?.totalProjects || 0, icon: BarChart3, color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" },
        { label: t.stats.active, value: metrics?.activeProjects || 0, icon: Clock, color: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" },
        { label: t.stats.completed, value: metrics?.completedProjects || 0, icon: CheckCircle2, color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" },
        { label: t.stats.percentage, value: `${completionPercentage}%`, icon: BarChart3, color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" },
    ];

    const handleEdit = (id: string) => {
        const projectToEdit = projects?.find(p => p._id === id);
        if (projectToEdit) {
            setEditingProject(projectToEdit);
        }
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
                            <CreateProjectDialog teamId="default-team" />
                        </div>
                    </div>

                    {/* Stats Area */}
                    <StatsCards stats={projectStats} />

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
                                    {lang === 'bg' ? 'Филтри' : 'Filters'}
                                </Button>

                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-[180px] h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all hover:bg-white shadow-sm">
                                        <SelectValue placeholder={t.sortBy} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">{t.newest}</SelectItem>
                                        <SelectItem value="oldest">{t.oldest}</SelectItem>
                                        <SelectItem value="name">{t.name}</SelectItem>
                                        <SelectItem value="deadline">{t.deadline}</SelectItem>
                                        <SelectItem value="priority">{t.priority}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-6">
                                {/* View Modes */}
                                <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-1 rounded-xl border border-border shadow-sm">
                                    {[
                                        { mode: "grid", Icon: LayoutGrid, label: lang === 'bg' ? "Борд" : "Board" },
                                        { mode: "list", Icon: List, label: lang === 'bg' ? "Списък" : "List" },
                                        { mode: "gantt", Icon: GanttChartIcon, label: "Gantt" },
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
                                            { label: t.active, value: "active" },
                                            { label: t.in_progress, value: "in_progress" },
                                            { label: t.review, value: "review" },
                                            { label: t.draft, value: "draft" },
                                            { label: t.completed, value: "completed" },
                                        ]}
                                    />

                                    <FilterPopover
                                        title={t.priority}
                                        value={priorityFilter}
                                        onChange={setPriorityFilter}
                                        options={[
                                            { label: t.all, value: "all" },
                                            { label: t.high, value: "high" },
                                            { label: t.medium, value: "medium" },
                                            { label: t.low, value: "low" },
                                        ]}
                                    />

                                    <FilterPopover
                                        title={t.manager}
                                        value={managerFilter}
                                        onChange={setManagerFilter}
                                        options={[
                                            { label: lang === 'bg' ? "Всички мениджъри" : "All Managers", value: "all" },
                                            ...(users?.map(user => ({
                                                label: user.name || "Unknown",
                                                value: user._id
                                            })) || [])
                                        ]}
                                    />
                                    <div className="flex items-center">
                                        <DateRangePicker
                                            date={dateRange}
                                            onDateChange={setDateRange}
                                            placeholder={lang === 'bg' ? "Период" : "Date Range"}
                                            className="h-9 border-dashed"
                                        />
                                    </div>

                                    <FilterPopover
                                        title={lang === 'bg' ? "Проект" : "Project"}
                                        value={searchQuery}
                                        onChange={setSearchQuery}
                                        options={[
                                            { label: lang === 'bg' ? "Всички проекти" : "All Projects", value: "all" },
                                            ...(projects?.map(project => ({
                                                label: project.name,
                                                value: project.name // Maintaining current logic where searchQuery matches name
                                            })) || [])
                                        ]}
                                    />
                                </div>

                                <div className="flex justify-end items-center mt-6 pt-6 border-t border-border/50">
                                    {(statusFilter !== "all" || priorityFilter !== "all" || managerFilter !== "all" || dateRange !== undefined || searchQuery !== "") && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setStatusFilter("all");
                                                setPriorityFilter("all");
                                                setManagerFilter("all");
                                                setDateRange(undefined);
                                                setSearchQuery("");
                                            }}
                                            className="h-10 px-4 text-xs font-bold text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-all gap-2"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            {lang === 'bg' ? "Изчисти филтри" : "Clear Filters"}
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
                    {processedProjects === undefined ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="bg-white dark:bg-card border border-border rounded-xl p-5 h-[280px] animate-pulse">
                                    <div className="flex justify-between mb-4">
                                        <div className="size-10 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                                        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                    </div>
                                    <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                                    <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded mb-6"></div>
                                    <div className="mt-auto h-10 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : processedProjects.length === 0 ? (
                        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center bg-white dark:bg-slate-950">
                            <div className="bg-slate-100 dark:bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                <Filter className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t.noProjects}</h2>
                            <p className="mt-2 text-muted-foreground max-w-sm mx-auto">{t.start}</p>
                            <div className="mt-6 flex items-center gap-3">
                                <Button variant="outline" onClick={() => {
                                    setSearchQuery("");
                                    setStatusFilter("all");
                                    setPriorityFilter("all");
                                }}>
                                    Изчисти филтрите
                                </Button>
                                <CreateProjectDialog teamId="default-team" />
                            </div>
                        </div>
                    ) : (
                        <>
                            {(viewMode === "grid" || viewMode === "list") && (
                                <div className={viewMode === "grid"
                                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                    : "flex flex-col gap-3"
                                }>
                                    {processedProjects.map((project) => (
                                        <ProjectCard
                                            key={project._id}
                                            id={project._id}
                                            title={project.name}
                                            department={lang === 'bg' ? "Общи" : "General"}
                                            status={project.status === "active" ? "Active" :
                                                project.status === "completed" ? "Completed" : "Draft"}
                                            priority={(capitalize((project.priority as string) || "Medium")) as any}
                                            date={project.endDate
                                                ? format(new Date(project.endDate), "MMM dd, yyyy")
                                                : (lang === 'bg' ? "Очаква се" : "TBD")}
                                            teamCount={5}
                                            progress={(productIdentifier(project._id) % 100) || 50}
                                            type="finance"
                                            description={project.description}
                                            lang={lang}
                                            onEdit={handleEdit}
                                        />
                                    ))}
                                </div>
                            )}

                            {viewMode === "gantt" && (
                                <GanttView
                                    items={processedProjects.map(p => ({
                                        id: p._id,
                                        title: p.name,
                                        startDate: p.startDate || p._creationTime,
                                        endDate: p.endDate || (p.startDate || p._creationTime) + (30 * 86400000),
                                        progress: (productIdentifier(p._id) % 100) || 50,
                                        color: p.priority === "high" ? "bg-amber-500" :
                                            p.priority === "critical" ? "bg-rose-500" : "bg-blue-500"
                                    }))}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            <EditProjectDialog
                open={!!editingProject}
                onOpenChange={(open) => !open && setEditingProject(null)}
                project={editingProject}
            />
        </div>
    );
}
