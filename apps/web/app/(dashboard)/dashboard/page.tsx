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
import {
    FolderKanban,
    ListTodo,
    AlertTriangle,
    FileCheck,
    Activity,
    Clock,
    PieChart as PieChartIcon,
    CalendarDays,
    CheckCircle2
} from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";
import Link from "next/link";

// Локализирани етикети
const dict = {
    title: "Табло за управление",
    subtitle: "Преглед на проекти и задачи",
    overview: "Общ преглед",
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
    recentActivity: "Последна активност",
    latestActions: "Последни действия",
    loading: "Зареждане...",
    tasksByStatus: "Задачи по статус",
    myTopTasks: "Моите Топ 5 Задачи",
    upcomingDeadlines: "Предстоящи Крайни Срокове",
    noTasks: "Няма намерени задачи",
    viewAll: "Виж всички",
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
    const recentActivity = useQuery(api.analytics.recentActivity, { limit: 8 });

    // New Queries
    const tasksByStatus = useQuery(api.analytics.tasksByStatus, {});
    const myTopTasks = useQuery(api.analytics.myTopTasks, { limit: 5 });
    const myUpcomingTasks = useQuery(api.analytics.myUpcomingTasks, { limit: 5 });

    const isLoading =
        metrics === undefined ||
        projectsByStatus === undefined ||
        taskTrend === undefined ||
        tasksByPriority === undefined ||
        tasksByStatus === undefined ||
        myTopTasks === undefined ||
        myUpcomingTasks === undefined;

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

    const taskStatusData = tasksByStatus.map((item) => ({
        name: item.name,
        value: item.value,
        fill: item.fill,
    }));

    const priorityData = (tasksByPriority || []).map((item) => ({
        name: PRIORITY_LABELS[item.name] || item.name,
        value: item.value,
        fill: item.fill,
    }));

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
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

            {/* Row 1: My Top Tasks + Upcoming Deadlines (User centric) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* My Top 5 Tasks */}
                <Card className="col-span-4 border-l-4 border-l-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ListTodo className="h-5 w-5 text-indigo-500" />
                                {dict.myTopTasks}
                            </CardTitle>
                            <CardDescription>Най-важните ви задачи според приоритет</CardDescription>
                        </div>
                        <Link href="/tasks" className="text-sm text-blue-600 hover:underline">
                            {dict.viewAll}
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {myTopTasks.length > 0 ? (
                                myTopTasks.map((task) => (
                                    <Link key={task._id} href={`/tasks?id=${task._id}`} className="block">
                                        <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div
                                                    className="w-1.5 h-10 rounded-full shrink-0"
                                                    style={{ backgroundColor: task.priorityColor }}
                                                />
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">{task.title}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                        <span>{task.projectName}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <span style={{ color: task.priorityColor }}>{task.priority}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-xs text-right shrink-0">
                                                {task.dueDate ? (
                                                    <div className="flex items-center gap-1 text-slate-500">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{new Date(task.dueDate).toLocaleDateString("bg-BG")}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
                                    {dict.noTasks}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Deadlines (New) */}
                <Card className="col-span-3 border-l-4 border-l-amber-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-amber-500" />
                            {dict.upcomingDeadlines}
                        </CardTitle>
                        <CardDescription>Задачи изтичащи скоро</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {myUpcomingTasks.length > 0 ? (
                                myUpcomingTasks.map((task) => (
                                    <Link key={task._id} href={`/tasks?id=${task._id}`} className="block group">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 min-w-0 border-b pb-2 group-last:border-0 group-hover:border-slate-300 dark:group-hover:border-slate-700 transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-sm font-medium truncate pr-2 group-hover:text-blue-600 transition-colors">{task.title}</p>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${task.daysLeft < 0 ? 'bg-red-100 text-red-700' :
                                                            task.daysLeft === 0 ? 'bg-amber-100 text-amber-700' :
                                                                task.daysLeft <= 2 ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-green-100 text-green-700'
                                                        }`}>
                                                        {task.daysLeft < 0 ? `${Math.abs(task.daysLeft)} дни закъснение` :
                                                            task.daysLeft === 0 ? 'Днес' :
                                                                `${task.daysLeft} дни`}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">{task.projectName}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CalendarDays className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                    Няма предстоящи крайни срокове
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Charts (Tasks by Status, Projects by Status) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Tasks by Status (Restored) */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5 text-blue-500" />
                            {dict.tasksByStatus}
                        </CardTitle>
                        <CardDescription>Разпределение на всички задачи</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[250px] w-full">
                            {taskStatusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={taskStatusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {taskStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                    Няма данни за задачи
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Projects by Status */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FolderKanban className="h-5 w-5 text-indigo-500" />
                            {dict.projectsByStatus}
                        </CardTitle>
                        <CardDescription>{dict.statusDistribution}</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[250px] w-full">
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
            </div>

            {/* Row 3: Task Completion Area Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-500" />
                        {dict.taskProgress}
                    </CardTitle>
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

            {/* Row 4: Priority + Recent Activity */}
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
        </div>
    );
}
