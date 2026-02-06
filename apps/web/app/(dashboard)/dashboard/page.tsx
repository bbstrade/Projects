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
    PieChart as PieChartIcon,
    BarChart3
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
    Legend
} from "recharts";

// Локализирани етикети
const dict = {
    title: "Табло за управление",
    subtitle: "Преглед на проекти и задачи",
    overview: "Общ преглед",
    analytics: "Анализи",
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
    loading: "Зареждане...",
};

const COLORS = {
    draft: "#94a3b8", // slate-400
    active: "#3b82f6", // blue-500
    in_progress: "#f59e0b", // amber-500
    completed: "#22c55e", // green-500
    on_hold: "#f97316", // orange-500
    archived: "#64748b", // slate-500
    todo: "#64748b",
    done: "#22c55e",
};

export default function DashboardPage() {
    const metrics = useQuery(api.analytics.dashboardMetrics, {});
    const projectsByStatus = useQuery(api.analytics.projectsByStatus, {});
    const taskTrend = useQuery(api.analytics.taskCompletionTrend, {});

    if (metrics === undefined || projectsByStatus === undefined || taskTrend === undefined) {
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
    const projectStatusData = projectsByStatus.map(item => ({
        name: item.name,
        value: item.value,
        fill: COLORS[item.name.toLowerCase().replace(" ", "_") as keyof typeof COLORS] || "#8884d8"
    }));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{dict.title}</h1>
                <p className="text-muted-foreground">{dict.subtitle}</p>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
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

                <Card className="hover:shadow-md transition-shadow">
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

                <Card className="hover:shadow-md transition-shadow">
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

                <Card className="hover:shadow-md transition-shadow">
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

            {/* Tabs for Overview/Analytics */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">{dict.overview}</TabsTrigger>
                    <TabsTrigger value="analytics">{dict.analytics}</TabsTrigger>
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
                                            <BarChart data={taskTrend}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis
                                                    dataKey="name"
                                                    stroke="#888888"
                                                    fontSize={12}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis
                                                    stroke="#888888"
                                                    fontSize={12}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(value) => `${value}`}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: 'transparent' }}
                                                    contentStyle={{ borderRadius: '8px' }}
                                                />
                                                <Legend />
                                                <Bar dataKey="completed" name="Завършени" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="pending" name="Чакащи" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                            </BarChart>
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
            </Tabs>
        </div>
    );
}
