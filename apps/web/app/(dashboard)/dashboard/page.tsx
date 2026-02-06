"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    FolderKanban,
    ListTodo,
    AlertTriangle,
    FileCheck,
    TrendingUp,
    Users,
    Activity,
    Clock
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
    Area
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
    loading: "Зареждане...",
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

            {/* Tabs for Overview/Analytics/Performance */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">{dict.overview}</TabsTrigger>
                    <TabsTrigger value="analytics">{dict.analytics}</TabsTrigger>
                    <TabsTrigger value="performance">{dict.performance}</TabsTrigger>
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
            </Tabs>
        </div>
    );
}
