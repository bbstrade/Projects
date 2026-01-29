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
    BarChart3,
    PieChart,
    TrendingUp,
    Activity,
    FolderKanban,
    ListTodo,
    FileCheck,
} from "lucide-react";

const dict = {
    title: "Отчети и анализи",
    subtitle: "Подробна статистика и анализ на проекти",
    overview: "Общ преглед",
    projects: "Проекти",
    tasks: "Задачи",
    approvals: "Одобрения",
    projectStats: "Статистика на проекти",
    taskStats: "Статистика на задачи",
    approvalStats: "Статистика на одобрения",
    totalProjects: "Общо проекти",
    activeProjects: "Активни проекти",
    completedProjects: "Завършени проекти",
    totalTasks: "Общо задачи",
    completedTasks: "Завършени задачи",
    inProgressTasks: "В процес",
    overdueTasks: "Просрочени",
    pendingApprovals: "Чакащи",
    approvedApprovals: "Одобрени",
    rejectedApprovals: "Отхвърлени",
    completionRate: "Процент на завършване",
    productivityTrend: "Тенденция на продуктивност",
    weeklyData: "Седмични данни",
    loading: "Зареждане...",
};

export default function ReportsPage() {
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

    const projectCompletionRate =
        metrics.totalProjects > 0
            ? Math.round((metrics.completedProjects / metrics.totalProjects) * 100)
            : 0;

    const taskCompletionRate =
        metrics.totalTasks > 0
            ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100)
            : 0;

    const approvalSuccessRate =
        metrics.pendingApprovals + metrics.approvedApprovals + metrics.rejectedApprovals > 0
            ? Math.round(
                (metrics.approvedApprovals /
                    (metrics.pendingApprovals +
                        metrics.approvedApprovals +
                        metrics.rejectedApprovals)) *
                100
            )
            : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{dict.title}</h1>
                <p className="text-muted-foreground">{dict.subtitle}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">
                            {dict.projectStats}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{metrics.totalProjects}</div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="text-sm opacity-90">
                                {dict.completionRate}: {projectCompletionRate}%
                            </div>
                        </div>
                        <div className="mt-3 h-2 bg-white/20 rounded-full">
                            <div
                                className="h-2 bg-white rounded-full"
                                style={{ width: `${projectCompletionRate}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">
                            {dict.taskStats}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{metrics.totalTasks}</div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="text-sm opacity-90">
                                {dict.completionRate}: {taskCompletionRate}%
                            </div>
                        </div>
                        <div className="mt-3 h-2 bg-white/20 rounded-full">
                            <div
                                className="h-2 bg-white rounded-full"
                                style={{ width: `${taskCompletionRate}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">
                            {dict.approvalStats}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {metrics.pendingApprovals +
                                metrics.approvedApprovals +
                                metrics.rejectedApprovals}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="text-sm opacity-90">
                                Успешни: {approvalSuccessRate}%
                            </div>
                        </div>
                        <div className="mt-3 h-2 bg-white/20 rounded-full">
                            <div
                                className="h-2 bg-white rounded-full"
                                style={{ width: `${approvalSuccessRate}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Tabs */}
            <Tabs defaultValue="projects" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="projects" className="gap-2">
                        <FolderKanban className="h-4 w-4" />
                        {dict.projects}
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="gap-2">
                        <ListTodo className="h-4 w-4" />
                        {dict.tasks}
                    </TabsTrigger>
                    <TabsTrigger value="approvals" className="gap-2">
                        <FileCheck className="h-4 w-4" />
                        {dict.approvals}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="projects" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PieChart className="h-5 w-5" />
                                    Разпределение по статус
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {projectsByStatus?.map((item) => (
                                        <div key={item.name} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="capitalize">{item.name}</span>
                                                <span className="font-medium">{item.value}</span>
                                            </div>
                                            <div className="h-2 bg-secondary rounded-full">
                                                <div
                                                    className="h-2 bg-blue-500 rounded-full"
                                                    style={{
                                                        width: `${metrics.totalProjects > 0
                                                                ? (item.value / metrics.totalProjects) * 100
                                                                : 0
                                                            }%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Числови показатели
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
                                        <div className="text-2xl font-bold">{metrics.draftProjects}</div>
                                        <div className="text-sm text-muted-foreground">Чернови</div>
                                    </div>
                                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {metrics.activeProjects}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Активни</div>
                                    </div>
                                    <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {metrics.completedProjects}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Завършени</div>
                                    </div>
                                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
                                        <div className="text-2xl font-bold">{metrics.totalProjects}</div>
                                        <div className="text-sm text-muted-foreground">Общо</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="tasks" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    {dict.productivityTrend}
                                </CardTitle>
                                <CardDescription>{dict.weeklyData}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {taskTrend?.map((week) => (
                                        <div key={week.name} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>{week.name}</span>
                                                <span className="text-green-600 font-medium">
                                                    +{week.completed} завършени
                                                </span>
                                            </div>
                                            <div className="h-2 bg-secondary rounded-full">
                                                <div
                                                    className="h-2 bg-green-500 rounded-full"
                                                    style={{
                                                        width: `${Math.min(week.completed * 10, 100)}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    Текущо състояние
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
                                        <div className="text-2xl font-bold">{metrics.todoTasks}</div>
                                        <div className="text-sm text-muted-foreground">За изпълнение</div>
                                    </div>
                                    <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-amber-600">
                                            {metrics.inProgressTasks}
                                        </div>
                                        <div className="text-sm text-muted-foreground">В процес</div>
                                    </div>
                                    <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {metrics.completedTasks}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Завършени</div>
                                    </div>
                                    <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-red-600">
                                            {metrics.overdueTasks}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Просрочени</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="approvals" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileCheck className="h-5 w-5" />
                                Статус на одобрения
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-6 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-center">
                                    <div className="text-3xl font-bold text-amber-600">
                                        {metrics.pendingApprovals}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {dict.pendingApprovals}
                                    </div>
                                </div>
                                <div className="p-6 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
                                    <div className="text-3xl font-bold text-green-600">
                                        {metrics.approvedApprovals}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {dict.approvedApprovals}
                                    </div>
                                </div>
                                <div className="p-6 bg-red-100 dark:bg-red-900/30 rounded-lg text-center">
                                    <div className="text-3xl font-bold text-red-600">
                                        {metrics.rejectedApprovals}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {dict.rejectedApprovals}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
