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
    Activity,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Users,
    FolderKanban,
    ListTodo,
    FileCheck,
} from "lucide-react";

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

export default function DashboardPage() {
    const metrics = useQuery(api.analytics.dashboardMetrics, {});
    const projectsByStatus = useQuery(api.analytics.projectsByStatus, {});
    const taskTrend = useQuery(api.analytics.taskCompletionTrend, {});

    if (metrics === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">{dict.loading}</p>
                </div>
            </div>
        );
    }

    // Status colors for visual indicators
    const statusColors: Record<string, string> = {
        draft: "bg-slate-500",
        active: "bg-blue-500",
        "in progress": "bg-amber-500",
        completed: "bg-green-500",
        "on hold": "bg-orange-500",
        archived: "bg-gray-400",
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{dict.title}</h1>
                <p className="text-muted-foreground">{dict.subtitle}</p>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {dict.totalProjects}
                        </CardTitle>
                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalProjects}</div>
                        <p className="text-xs text-muted-foreground">
                            {metrics.activeProjects} {dict.activeProjects}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {dict.totalTasks}
                        </CardTitle>
                        <ListTodo className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalTasks}</div>
                        <p className="text-xs text-muted-foreground">
                            {metrics.completedTasks} {dict.completedTasks}
                        </p>
                    </CardContent>
                </Card>

                <Card>
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

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {dict.pendingApprovals}
                        </CardTitle>
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
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
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Projects by Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{dict.projectsByStatus}</CardTitle>
                                <CardDescription>{dict.statusDistribution}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {projectsByStatus?.map((item) => (
                                        <div key={item.name} className="flex items-center gap-4">
                                            <div
                                                className={`h-3 w-3 rounded-full ${statusColors[item.name] || "bg-slate-400"
                                                    }`}
                                            />
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium capitalize">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {item.value}
                                                    </span>
                                                </div>
                                                <div className="mt-1 h-2 w-full rounded-full bg-secondary">
                                                    <div
                                                        className={`h-2 rounded-full ${statusColors[item.name] || "bg-slate-400"
                                                            }`}
                                                        style={{
                                                            width: `${metrics.totalProjects > 0
                                                                    ? (item.value / metrics.totalProjects) * 100
                                                                    : 0
                                                                }%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!projectsByStatus || projectsByStatus.length === 0) && (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            Няма данни за проекти
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Task Completion Trend */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{dict.taskProgress}</CardTitle>
                                <CardDescription>{dict.weeklyCompletion}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {taskTrend?.map((week) => (
                                        <div key={week.name} className="flex items-center gap-4">
                                            <span className="w-16 text-sm font-medium">
                                                {week.name}
                                            </span>
                                            <div className="flex-1 flex gap-2">
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-green-600">Завършени</span>
                                                        <span>{week.completed}</span>
                                                    </div>
                                                    <div className="h-2 w-full rounded-full bg-secondary">
                                                        <div
                                                            className="h-2 rounded-full bg-green-500"
                                                            style={{
                                                                width: `${Math.min(
                                                                    (week.completed /
                                                                        Math.max(
                                                                            week.completed + week.pending,
                                                                            1
                                                                        )) *
                                                                    100,
                                                                    100
                                                                )}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-slate-500">Чакащи</span>
                                                        <span>{week.pending}</span>
                                                    </div>
                                                    <div className="h-2 w-full rounded-full bg-secondary">
                                                        <div
                                                            className="h-2 rounded-full bg-slate-400"
                                                            style={{
                                                                width: `${Math.min(
                                                                    (week.pending /
                                                                        Math.max(
                                                                            week.completed + week.pending,
                                                                            1
                                                                        )) *
                                                                    100,
                                                                    100
                                                                )}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!taskTrend || taskTrend.length === 0) && (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            Няма данни за задачи
                                        </p>
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
                                <CardTitle className="text-lg">Статистика на проекти</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm">Чернови</span>
                                    <span className="font-medium">{metrics.draftProjects}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Активни</span>
                                    <span className="font-medium text-blue-600">
                                        {metrics.activeProjects}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Завършени</span>
                                    <span className="font-medium text-green-600">
                                        {metrics.completedProjects}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Статистика на задачи</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm">За изпълнение</span>
                                    <span className="font-medium">{metrics.todoTasks}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">В процес</span>
                                    <span className="font-medium text-amber-600">
                                        {metrics.inProgressTasks}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Завършени</span>
                                    <span className="font-medium text-green-600">
                                        {metrics.completedTasks}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Одобрения</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm">Чакащи</span>
                                    <span className="font-medium text-amber-600">
                                        {metrics.pendingApprovals}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Одобрени</span>
                                    <span className="font-medium text-green-600">
                                        {metrics.approvedApprovals}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Отхвърлени</span>
                                    <span className="font-medium text-red-600">
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
