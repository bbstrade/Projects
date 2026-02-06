"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportBuilder } from "@/components/reports/report-builder";
import { CustomReportView } from "@/components/reports/custom-report-view";
import {
    FolderKanban,
    ListTodo,
    AlertTriangle,
    FileCheck,
    TrendingUp,
    Users,
    Activity,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Target,
    Zap,
    Plus,
    Edit,
    Trash2,
    Copy,
    LayoutDashboard,
    Share2,
    LineChart as LineChartIcon
} from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    AreaChart,
    Area,
    LineChart,
    Line,
    ComposedChart
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";

// Локализирани етикети
const dict = {
    title: "Табло за управление",
    subtitle: "Преглед на проекти и задачи",
    overview: "Общ преглед",
    analytics: "Анализи",
    performance: "Производителност",
    totalProjects: "Общо проекти",
    activeProjects: "активни",
    totalTasks: "Общо задачи",
    completedTasks: "завършени",
    overdueTasks: "Просрочени задачи",
    needsAttention: "Изисква внимание",
    pendingApprovals: "Чакащи одобрения",
    awaitingReview: "Очакват преглед",
    projectsByStatus: "Проекти по статус",
    statusDistribution: "Разпределение по статус",
    taskProgress: "Прогрес на задачите",
    weeklyCompletion: "Седмично завършване",
    tasksByPriority: "Задачи по приоритет",
    priorityDistribution: "Разпределение по приоритет",
    teamPerformance: "Екипна производителност",
    tasksPerMember: "Задачи на човек",
    recentActivity: "Последна активност",
    latestActions: "Последни действия",
    teamWorkload: "Натовареност на екипа",
    workloadByMember: "Задачи по член",
    trends: "Тенденции",
    tasksByStatus: "Задачи по статус",
    statusBreakdown: "Разпределение по статус",
    monthlyComparison: "Месечно сравнение",
    currentVsPrevious: "Текущ vs. предходен месец",
    velocity: "Скорост",
    tasksPerWeek: "Задачи на седмица",
    overdueBreakdown: "Просрочени задачи",
    byProjectAndAssignee: "По проект и отговорник",
    loading: "Зареждане...",
    myReports: "Моите отчети",
    createReport: "Нов отчет",
    noReports: "Нямате персонализирани отчети",
    createFirst: "Създайте първия си отчет",
};

const COLORS = {
    draft: "#94a3b8",
    active: "#3b82f6",
    in_progress: "#f59e0b",
    completed: "#22c55e",
    on_hold: "#f97316",
    archived: "#64748b",
    todo: "#64748b",
    done: "#22c55e",
    low: "#94a3b8",
    medium: "#f59e0b",
    high: "#ef4444",
    critical: "#dc2626",
};

const PRIORITY_LABELS: Record<string, string> = {
    low: "Нисък",
    medium: "Среден",
    high: "Висок",
    critical: "Критичен",
};

const ACTION_LABELS: Record<string, string> = {
    created: "създаде",
    updated: "актуализира",
    deleted: "изтри",
    completed: "завърши",
    assigned: "назначи",
};

export default function DashboardPage() {
    const metrics = useQuery(api.analytics.dashboardMetrics, {});
    const projectsByStatus = useQuery(api.analytics.projectsByStatus, {});
    const taskTrend = useQuery(api.analytics.taskCompletionTrend, {});
    const tasksByPriority = useQuery(api.analytics.tasksByPriority, {});
    const teamPerformance = useQuery(api.analytics.teamPerformance, { limit: 5 });
    const recentActivity = useQuery(api.analytics.recentActivity, { limit: 8 });
    const workload = useQuery(api.analytics.tasksByAssignee, {});
    // New analytics
    const tasksByStatus = useQuery(api.analytics.tasksByStatus, {});
    const monthlyComparison = useQuery(api.analytics.monthlyComparison, {});
    const velocityMetrics = useQuery(api.analytics.velocityMetrics, { weeks: 8 });
    const overdueAnalysis = useQuery(api.analytics.overdueAnalysis, {});

    const isLoading =
        metrics === undefined ||
        projectsByStatus === undefined ||
        taskTrend === undefined ||
        tasksByPriority === undefined;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">{dict.loading}</p>
                </div>
            </div>
        );
    }

    // Format data for Recharts
    const projectStatusData = projectsByStatus.map((item) => ({
        name: item.name,
        value: item.value,
        fill:
            COLORS[item.name.toLowerCase().replace(" ", "_") as keyof typeof COLORS] ||
            "#8884d8",
    }));

    const priorityData = (tasksByPriority || []).map((item) => ({
        name: PRIORITY_LABELS[item.name] || item.name,
        value: item.value,
        fill: item.fill,
    }));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{dict.title}</h1>
                <p className="text-muted-foreground">{dict.subtitle}</p>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {dict.totalProjects}
                        </CardTitle>
                        <FolderKanban className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalProjects}</div>
                        <p className="text-xs text-muted-foreground">
                            {metrics.activeProjects} {dict.activeProjects}
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {dict.totalTasks}
                        </CardTitle>
                        <ListTodo className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalTasks}</div>
                        <p className="text-xs text-muted-foreground">
                            {metrics.completedTasks} {dict.completedTasks}
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {dict.overdueTasks}
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {metrics.overdueTasks}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dict.needsAttention}
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-background">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {dict.pendingApprovals}
                        </CardTitle>
                        <FileCheck className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.pendingApprovals}</div>
                        <p className="text-xs text-muted-foreground">
                            {dict.awaitingReview}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for Overview/Analytics/Performance/My Reports */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5 max-w-[750px]">
                    <TabsTrigger value="overview">{dict.overview}</TabsTrigger>
                    <TabsTrigger value="analytics">{dict.analytics}</TabsTrigger>
                    <TabsTrigger value="trends">{dict.trends}</TabsTrigger>
                    <TabsTrigger value="performance">{dict.performance}</TabsTrigger>
                    <TabsTrigger value="my-reports" className="flex items-center gap-1">
                        <LayoutDashboard className="h-4 w-4" />
                        {dict.myReports}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        {/* Projects by Status Chart */}
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>{dict.projectsByStatus}</CardTitle>
                                <CardDescription>{dict.statusDistribution}</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[300px] w-full">
                                    {projectStatusData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={projectStatusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {projectStatusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground">
                                            Няма данни за проекти
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Task Completion Trend Chart */}
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>{dict.taskProgress}</CardTitle>
                                <CardDescription>{dict.weeklyCompletion}</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[300px] w-full">
                                    {taskTrend.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={taskTrend}>
                                                <defs>
                                                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                                <Legend />
                                                <Area type="monotone" dataKey="completed" name="Завършени" stroke="#22c55e" fillOpacity={1} fill="url(#colorCompleted)" />
                                                <Area type="monotone" dataKey="pending" name="Чакащи" stroke="#94a3b8" fillOpacity={1} fill="url(#colorPending)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground">
                                            Няма данни за задачи
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Second Row: Priority + Recent Activity */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Tasks by Priority */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    {dict.tasksByPriority}
                                </CardTitle>
                                <CardDescription>{dict.priorityDistribution}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[280px]">
                                    {priorityData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={priorityData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={90}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                    label={({ name, percent }: { name?: string | number; percent?: number }) =>
                                                        `${name} ${((percent || 0) * 100).toFixed(0)}%`
                                                    }
                                                >
                                                    {priorityData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground">
                                            Няма данни
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-green-500" />
                                    {dict.recentActivity}
                                </CardTitle>
                                <CardDescription>{dict.latestActions}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-[280px] overflow-y-auto">
                                    {(recentActivity || []).length > 0 ? (
                                        (recentActivity || []).map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                            >
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Clock className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm truncate">
                                                        <span className="font-medium">{item.userName}</span>{" "}
                                                        {ACTION_LABELS[item.action] || item.action}{" "}
                                                        <span className="text-muted-foreground">{item.entityType}</span>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(item.createdAt, { addSuffix: true, locale: bg })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground py-8">
                                            Няма скорошна активност
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Quick Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FolderKanban className="h-5 w-5 text-blue-500" />
                                    Статистика на проекти
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border">
                                    <span className="text-sm">Чернови</span>
                                    <span className="font-bold">{metrics.draftProjects}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
                                    <span className="text-sm">Активни</span>
                                    <span className="font-bold text-blue-600">
                                        {metrics.activeProjects}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900">
                                    <span className="text-sm">Завършени</span>
                                    <span className="font-bold text-green-600">
                                        {metrics.completedProjects}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <ListTodo className="h-5 w-5 text-purple-500" />
                                    Статистика на задачи
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border">
                                    <span className="text-sm">За изпълнение</span>
                                    <span className="font-bold">{metrics.todoTasks}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
                                    <span className="text-sm">В процес</span>
                                    <span className="font-bold text-amber-600">
                                        {metrics.inProgressTasks}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900">
                                    <span className="text-sm">Завършени</span>
                                    <span className="font-bold text-green-600">
                                        {metrics.completedTasks}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileCheck className="h-5 w-5 text-amber-500" />
                                    Одобрения
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
                                    <span className="text-sm">Чакащи</span>
                                    <span className="font-bold text-amber-600">
                                        {metrics.pendingApprovals}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900">
                                    <span className="text-sm">Одобрени</span>
                                    <span className="font-bold text-green-600">
                                        {metrics.approvedApprovals}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900">
                                    <span className="text-sm">Отхвърлени</span>
                                    <span className="font-bold text-red-600">
                                        {metrics.rejectedApprovals}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tasks by Status Pie */}
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-indigo-500" />
                                {dict.tasksByStatus}
                            </CardTitle>
                            <CardDescription>{dict.statusBreakdown}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[280px]">
                                {(tasksByStatus || []).length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={tasksByStatus}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={3}
                                                dataKey="value"
                                                label={({ name, percent }: { name?: string; percent?: number }) =>
                                                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                                                }
                                            >
                                                {(tasksByStatus || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        Няма данни
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* NEW: Trends Tab */}
                <TabsContent value="trends" className="space-y-4">
                    {/* Monthly Comparison Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Създадени задачи</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {monthlyComparison?.currentMonth.tasksCreated || 0}
                                </div>
                                <div className="flex items-center gap-1 text-xs mt-1">
                                    {(monthlyComparison?.changes.tasksCreated || 0) >= 0 ? (
                                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                                    ) : (
                                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                                    )}
                                    <span className={(monthlyComparison?.changes.tasksCreated || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                                        {Math.abs(monthlyComparison?.changes.tasksCreated || 0)} спрямо миналия месец
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Завършени задачи</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {monthlyComparison?.currentMonth.tasksCompleted || 0}
                                </div>
                                <div className="flex items-center gap-1 text-xs mt-1">
                                    {(monthlyComparison?.changes.tasksCompleted || 0) >= 0 ? (
                                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                                    ) : (
                                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                                    )}
                                    <span className={(monthlyComparison?.changes.tasksCompleted || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                                        {Math.abs(monthlyComparison?.changes.tasksCompleted || 0)} спрямо миналия месец
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Нови проекти</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-600">
                                    {monthlyComparison?.currentMonth.projectsStarted || 0}
                                </div>
                                <div className="flex items-center gap-1 text-xs mt-1">
                                    {(monthlyComparison?.changes.projectsStarted || 0) >= 0 ? (
                                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                                    ) : (
                                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                                    )}
                                    <span className={(monthlyComparison?.changes.projectsStarted || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                                        {Math.abs(monthlyComparison?.changes.projectsStarted || 0)} спрямо миналия месец
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Velocity Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-yellow-500" />
                                    {dict.velocity}
                                </CardTitle>
                                <CardDescription>
                                    Средно {velocityMetrics?.avgVelocity || 0} задачи/седмица
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[280px]">
                                    {(velocityMetrics?.trend || []).length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={velocityMetrics?.trend}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="week" fontSize={12} />
                                                <YAxis fontSize={12} />
                                                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                                <Line
                                                    type="monotone"
                                                    dataKey="completed"
                                                    name="Завършени"
                                                    stroke="#22c55e"
                                                    strokeWidth={2}
                                                    dot={{ fill: '#22c55e' }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground">
                                            Няма данни за скорост
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Overdue Analysis */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                    {dict.overdueBreakdown}
                                </CardTitle>
                                <CardDescription>
                                    Общо {overdueAnalysis?.total || 0} просрочени задачи
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">По проект</h4>
                                        <div className="space-y-2">
                                            {(overdueAnalysis?.byProject || []).slice(0, 5).map((item, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 rounded bg-red-50 dark:bg-red-950/20">
                                                    <span className="text-sm truncate max-w-[150px]">{item.name}</span>
                                                    <span className="font-bold text-red-600">{item.count}</span>
                                                </div>
                                            ))}
                                            {(overdueAnalysis?.byProject || []).length === 0 && (
                                                <p className="text-sm text-muted-foreground">Няма просрочени</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">По отговорник</h4>
                                        <div className="space-y-2">
                                            {(overdueAnalysis?.byAssignee || []).slice(0, 5).map((item, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 rounded bg-amber-50 dark:bg-amber-950/20">
                                                    <span className="text-sm truncate max-w-[150px]">{item.name}</span>
                                                    <span className="font-bold text-amber-600">{item.count}</span>
                                                </div>
                                            ))}
                                            {(overdueAnalysis?.byAssignee || []).length === 0 && (
                                                <p className="text-sm text-muted-foreground">Няма данни</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Team Performance Bar Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-500" />
                                    {dict.teamPerformance}
                                </CardTitle>
                                <CardDescription>{dict.tasksPerMember}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    {(teamPerformance || []).length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={teamPerformance} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" />
                                                <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                                                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                                <Legend />
                                                <Bar dataKey="completed" name="Завършени" fill="#22c55e" radius={[0, 4, 4, 0]} />
                                                <Bar dataKey="inProgress" name="В процес" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground">
                                            Няма данни за производителност
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Team Workload Radar */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-purple-500" />
                                    {dict.teamWorkload}
                                </CardTitle>
                                <CardDescription>{dict.workloadByMember}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    {(workload || []).length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart data={workload}>
                                                <PolarGrid />
                                                <PolarAngleAxis dataKey="name" fontSize={11} />
                                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                                                <Radar name="Общо" dataKey="total" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                                <Radar name="Завършени" dataKey="done" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                                                <Legend />
                                                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground">
                                            Няма данни за натовареност
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* My Reports Tab */}
                <MyReportsTab />
            </Tabs>
        </div>
    );
}

function MyReportsTab() {
    const reports = useQuery(api.customReports.list, {});
    const removeReport = useMutation(api.customReports.remove);
    const duplicateReport = useMutation(api.customReports.duplicate);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState<Id<"customReports"> | undefined>(undefined);
    const [viewReportId, setViewReportId] = useState<Id<"customReports"> | null>(null);

    const handleEdit = (id: Id<"customReports">) => {
        setSelectedReportId(id);
        setIsBuilderOpen(true);
    };

    const handleCreate = () => {
        setSelectedReportId(undefined);
        setIsBuilderOpen(true);
    };

    const handleDelete = async (id: Id<"customReports">) => {
        if (confirm("Сигурни ли сте, че искате да изтриете този отчет?")) {
            await removeReport({ id });
            if (viewReportId === id) setViewReportId(null);
        }
    };

    const handleDuplicate = async (id: Id<"customReports">) => {
        await duplicateReport({ id });
    };

    return (
        <TabsContent value="my-reports" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">{dict.myReports}</h3>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    {dict.createReport}
                </Button>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Reports List Sidebar */}
                <div className="col-span-12 md:col-span-3 space-y-3">
                    {reports === undefined ? (
                        <div className="text-muted-foreground text-sm">{dict.loading}</div>
                    ) : reports.length === 0 ? (
                        <Card>
                            <CardContent className="p-6 text-center">
                                <p className="text-sm text-muted-foreground mb-4">
                                    {dict.noReports}
                                </p>
                                <Button variant="outline" size="sm" onClick={handleCreate}>
                                    {dict.createFirst}
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        reports.map((report) => (
                            <div
                                key={report._id}
                                className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/50 group ${viewReportId === report._id ? "bg-muted border-primary" : "bg-card"
                                    }`}
                                onClick={() => setViewReportId(report._id)}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="font-medium truncate pr-2">{report.name}</div>
                                    {report.isShared && (
                                        <Share2 className="h-3 w-3 text-blue-500 shrink-0 mt-1" />
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                    {report.description || "Няма описание"}
                                </div>
                                <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDuplicate(report._id);
                                        }}
                                        title="Дублиране"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(report._id);
                                        }}
                                        title="Редактиране"
                                    >
                                        <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-red-500 hover:text-red-600"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(report._id);
                                        }}
                                        title="Изтриване"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Report View Area */}
                <div className="col-span-12 md:col-span-9">
                    {viewReportId ? (
                        <CustomReportView reportId={viewReportId} />
                    ) : (
                        <div className="h-[400px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
                            <LayoutDashboard className="h-12 w-12 mb-4 opacity-20" />
                            <p>Изберете отчет за преглед или създайте нов</p>
                            <Button variant="outline" className="mt-4" onClick={handleCreate}>
                                <Plus className="mr-2 h-4 w-4" />
                                {dict.createReport}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <ReportBuilder
                open={isBuilderOpen}
                onOpenChange={setIsBuilderOpen}
                reportId={selectedReportId}
                onSave={() => {
                    // Update list is automatic due to useQuery subscription
                }}
            />
        </TabsContent>
    );
}
