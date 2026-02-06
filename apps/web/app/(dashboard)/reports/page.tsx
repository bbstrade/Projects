"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    BarChart3,
    PieChart as PieChartIcon,
    TrendingUp,
    Activity,
    FolderKanban,
    ListTodo,
    FileCheck,
    Download,
    Filter,
    Calendar,
    HardDrive,
    Heart,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    Target,
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
    AreaChart,
    Area,
    LineChart,
    Line
} from "recharts";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { exportMetrics } from "@/components/reports/export-utils";

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
    export: "Експорт",
    filter: "Филтриране",
};

const COLORS = {
    draft: "#94a3b8",
    active: "#3b82f6",
    in_progress: "#f59e0b",
    completed: "#22c55e",
    on_hold: "#f97316",
    archived: "#64748b",
    pending: "#f59e0b",
    approved: "#22c55e",
    rejected: "#ef4444"
};

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    const queryArgs = {
        startDate: dateRange?.from?.getTime(),
        endDate: dateRange?.to?.getTime(),
    };

    const metrics = useQuery(api.analytics.dashboardMetrics, queryArgs);
    const projectsByStatus = useQuery(api.analytics.projectsByStatus, queryArgs);
    const taskTrend = useQuery(api.analytics.taskCompletionTrend, {});
    const projectTimeline = useQuery(api.analytics.projectTimeline, {});
    const fileStats = useQuery(api.analytics.fileStatistics, {});
    // New analytics queries
    const tasksOverTime = useQuery(api.analytics.tasksOverTime, { period: "weekly", days: 28 });
    const projectsOverTime = useQuery(api.analytics.projectsOverTime, { months: 6 });
    const approvalTrend = useQuery(api.analytics.approvalTrend, {});
    const projectHealth = useQuery(api.analytics.projectHealth, {});
    const tasksByStatus = useQuery(api.analytics.tasksByStatus, {});
    const velocityMetrics = useQuery(api.analytics.velocityMetrics, { weeks: 8 });
    const overdueAnalysis = useQuery(api.analytics.overdueAnalysis, {});

    const isLoading = metrics === undefined || projectsByStatus === undefined || taskTrend === undefined;

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

    const approvalData = [
        { name: "Чакащи", value: metrics.pendingApprovals, fill: COLORS.pending },
        { name: "Одобрени", value: metrics.approvedApprovals, fill: COLORS.approved },
        { name: "Отхвърлени", value: metrics.rejectedApprovals, fill: COLORS.rejected },
    ].filter(d => d.value > 0);

    const handleExport = (type: "csv" | "excel" | "pdf") => {
        exportMetrics(metrics, type);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{dict.title}</h1>
                    <p className="text-muted-foreground">{dict.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                    <DateRangePicker
                        date={dateRange}
                        onDateChange={setDateRange}
                        placeholder="Изберете период"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                {dict.export}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExport("excel")}>
                                Excel (.xlsx)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport("csv")}>
                                CSV (.csv)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport("pdf")}>
                                PDF (.pdf)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-90 flex items-center justify-between">
                            {dict.projectStats}
                            <FolderKanban className="h-4 w-4 opacity-75" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{metrics.totalProjects}</div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="text-sm opacity-90">
                                {dict.completionRate}: {projectCompletionRate}%
                            </div>
                        </div>
                        <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-all duration-1000"
                                style={{ width: `${projectCompletionRate}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-90 flex items-center justify-between">
                            {dict.taskStats}
                            <ListTodo className="h-4 w-4 opacity-75" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{metrics.totalTasks}</div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="text-sm opacity-90">
                                {dict.completionRate}: {taskCompletionRate}%
                            </div>
                        </div>
                        <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-all duration-1000"
                                style={{ width: `${taskCompletionRate}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-90 flex items-center justify-between">
                            {dict.approvalStats}
                            <FileCheck className="h-4 w-4 opacity-75" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">
                            {metrics.pendingApprovals +
                                metrics.approvedApprovals +
                                metrics.rejectedApprovals}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="text-sm opacity-90">
                                Успешни: {approvalSuccessRate}%
                            </div>
                        </div>
                        <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-all duration-1000"
                                style={{ width: `${approvalSuccessRate}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Tabs */}
            <Tabs defaultValue="projects" className="space-y-4">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="projects" className="gap-2">
                        <FolderKanban className="h-4 w-4" />
                        <span className="hidden sm:inline">{dict.projects}</span>
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="gap-2">
                        <ListTodo className="h-4 w-4" />
                        <span className="hidden sm:inline">{dict.tasks}</span>
                    </TabsTrigger>
                    <TabsTrigger value="approvals" className="gap-2">
                        <FileCheck className="h-4 w-4" />
                        <span className="hidden sm:inline">{dict.approvals}</span>
                    </TabsTrigger>
                    <TabsTrigger value="trends" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="hidden sm:inline">Тенденции</span>
                    </TabsTrigger>
                    <TabsTrigger value="health" className="gap-2">
                        <Heart className="h-4 w-4" />
                        <span className="hidden sm:inline">Здраве</span>
                    </TabsTrigger>
                    <TabsTrigger value="files" className="gap-2">
                        <HardDrive className="h-4 w-4" />
                        <span className="hidden sm:inline">Файлове</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="projects" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Разпределение на проекти
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={projectsByStatus} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={100}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ fill: 'transparent' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                            {projectsByStatus.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[entry.name.toLowerCase().replace(" ", "_") as keyof typeof COLORS] || "#8884d8"}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PieChartIcon className="h-5 w-5" />
                                    Дял на статусите
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={projectsByStatus}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {projectsByStatus.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[entry.name.toLowerCase().replace(" ", "_") as keyof typeof COLORS] || "#8884d8"}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                        <Legend verticalAlign="middle" align="right" layout="vertical" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="tasks" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                {dict.productivityTrend}
                            </CardTitle>
                            <CardDescription>{dict.weeklyData}</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={taskTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="completed"
                                        name="Завършени"
                                        stroke="#22c55e"
                                        fillOpacity={1}
                                        fill="url(#colorCompleted)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="pending"
                                        name="Чакащи"
                                        stroke="#94a3b8"
                                        fillOpacity={1}
                                        fill="url(#colorPending)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="approvals" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileCheck className="h-5 w-5" />
                                    Статус на одобрения
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                {approvalData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={approvalData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={120}
                                                dataKey="value"
                                                label={({ name, percent }: { name?: string | number; percent?: number }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                            >
                                                {approvalData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        Няма данни за одобрения
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Детайли</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Чакащи преглед</span>
                                        <span className="text-amber-600 font-bold">{metrics.pendingApprovals}</span>
                                    </div>
                                    <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 w-full animate-pulse" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Одобрени</span>
                                        <span className="text-green-600 font-bold">{metrics.approvedApprovals}</span>
                                    </div>
                                    <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-full" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Отхвърлени</span>
                                        <span className="text-red-600 font-bold">{metrics.rejectedApprovals}</span>
                                    </div>
                                    <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 w-full" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* NEW: Trends Tab */}
                <TabsContent value="trends" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Tasks Over Time */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-500" />
                                    Задачи по време
                                </CardTitle>
                                <CardDescription>Създадени vs завършени (последните 4 седмици)</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                {(tasksOverTime || []).length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={tasksOverTime}>
                                            <defs>
                                                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorCompletedTrend" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                            <YAxis />
                                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                            <Legend />
                                            <Area type="monotone" dataKey="created" name="Създадени" stroke="#3b82f6" fill="url(#colorCreated)" />
                                            <Area type="monotone" dataKey="completed" name="Завършени" stroke="#22c55e" fill="url(#colorCompletedTrend)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        Няма данни за задачи
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Projects Over Time */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FolderKanban className="h-5 w-5 text-purple-500" />
                                    Проекти по месеци
                                </CardTitle>
                                <CardDescription>Стартирани и завършени проекти (последните 6 месеца)</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                {(projectsOverTime || []).length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={projectsOverTime}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                            <YAxis />
                                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                            <Legend />
                                            <Bar dataKey="started" name="Стартирани" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="completed" name="Завършени" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        Няма данни за проекти
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Velocity Metrics */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-yellow-500" />
                                    Скорост на завършване
                                </CardTitle>
                                <CardDescription>
                                    Средно {velocityMetrics?.avgVelocity || 0} задачи/седмица
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                {(velocityMetrics?.trend || []).length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={velocityMetrics?.trend}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                                            <YAxis />
                                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                            <Line
                                                type="monotone"
                                                dataKey="completed"
                                                name="Завършени"
                                                stroke="#f59e0b"
                                                strokeWidth={3}
                                                dot={{ fill: '#f59e0b', strokeWidth: 2 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        Няма данни за скорост
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Approval Trend */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-amber-500" />
                                    Тенденция на одобрения
                                </CardTitle>
                                <CardDescription>
                                    Средно време за одобрение: {approvalTrend?.avgApprovalDays || 0} дни
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                {(approvalTrend?.monthlyTrend || []).length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={approvalTrend?.monthlyTrend}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                            <YAxis />
                                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                            <Legend />
                                            <Bar dataKey="approved" name="Одобрени" fill="#22c55e" stackId="a" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="rejected" name="Отхвърлени" fill="#ef4444" stackId="a" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="pending" name="Чакащи" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        Няма данни за одобрения
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* NEW: Health Tab */}
                <TabsContent value="health" className="space-y-4">
                    {/* Health Score Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600">
                                        {(projectHealth || []).filter(p => p.healthScore >= 80).length}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">Здрави проекти</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950/20">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-yellow-600">
                                        {(projectHealth || []).filter(p => p.healthScore >= 50 && p.healthScore < 80).length}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">Внимание</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950/20">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-red-600">
                                        {(projectHealth || []).filter(p => p.healthScore < 50).length}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">Критични</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-600">
                                        {overdueAnalysis?.total || 0}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">Просрочени задачи</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Project Health Scores */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Heart className="h-5 w-5 text-red-500" />
                                    Здраве на проекти
                                </CardTitle>
                                <CardDescription>Сортирани по оценка (най-ниска първо)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                    {(projectHealth || []).slice(0, 10).map((project, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{project.name}</p>
                                                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                                                    <span>Задачи: {project.totalTasks}</span>
                                                    <span className="text-red-500">Просрочени: {project.overdueTasks}</span>
                                                    <span className="text-amber-500">Блокирани: {project.blockedTasks}</span>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${project.healthScore >= 80 ? 'bg-green-100 text-green-700' :
                                                project.healthScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {project.healthScore}%
                                            </div>
                                        </div>
                                    ))}
                                    {(projectHealth || []).length === 0 && (
                                        <p className="text-center text-muted-foreground py-8">Няма проекти за показване</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Overdue Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-orange-500" />
                                    Анализ на просрочени задачи
                                </CardTitle>
                                <CardDescription>Разбивка по проект и отговорник</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                            <FolderKanban className="h-4 w-4" />
                                            По проект
                                        </h4>
                                        <div className="space-y-2">
                                            {(overdueAnalysis?.byProject || []).slice(0, 5).map((item, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <div className="flex-1 bg-red-100 dark:bg-red-950/30 rounded-full h-6 overflow-hidden">
                                                        <div
                                                            className="h-full bg-red-500 rounded-full flex items-center justify-end pr-2"
                                                            style={{ width: `${Math.min(100, (item.count / (overdueAnalysis?.total || 1)) * 100)}%` }}
                                                        >
                                                            <span className="text-xs text-white font-medium">{item.count}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm min-w-[100px] truncate">{item.name}</span>
                                                </div>
                                            ))}
                                            {(overdueAnalysis?.byProject || []).length === 0 && (
                                                <p className="text-sm text-muted-foreground">Няма просрочени задачи</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                            <Activity className="h-4 w-4" />
                                            По отговорник
                                        </h4>
                                        <div className="space-y-2">
                                            {(overdueAnalysis?.byAssignee || []).slice(0, 5).map((item, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <div className="flex-1 bg-amber-100 dark:bg-amber-950/30 rounded-full h-6 overflow-hidden">
                                                        <div
                                                            className="h-full bg-amber-500 rounded-full flex items-center justify-end pr-2"
                                                            style={{ width: `${Math.min(100, (item.count / (overdueAnalysis?.total || 1)) * 100)}%` }}
                                                        >
                                                            <span className="text-xs text-white font-medium">{item.count}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm min-w-[100px] truncate">{item.name}</span>
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

                        {/* Tasks by Status Distribution */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ListTodo className="h-5 w-5 text-indigo-500" />
                                    Разпределение на задачи по статус
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
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
                                        Няма данни за задачи
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="files" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Project Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Времева линия на проекти
                                </CardTitle>
                                <CardDescription>Продължителност на активни проекти</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                {(projectTimeline || []).length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={projectTimeline} layout="vertical" margin={{ left: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                width={120}
                                                tick={{ fontSize: 11 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px' }}
                                                formatter={(value?: number) => {
                                                    if (value === undefined) return '';
                                                    const days = Math.ceil(value / (1000 * 60 * 60 * 24));
                                                    return `${days} дни`;
                                                }}
                                            />
                                            <Bar
                                                dataKey={(entry: { startDate: number; endDate: number }) => entry.endDate - entry.startDate}
                                                name="Продължителност"
                                                fill="#3b82f6"
                                                radius={[0, 4, 4, 0]}
                                                barSize={24}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        Няма данни за проекти
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* File Statistics */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <HardDrive className="h-5 w-5" />
                                    Статистика на файлове
                                </CardTitle>
                                <CardDescription>Качени файлове по месеци</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                {(fileStats || []).length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={fileStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorFiles" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                            <YAxis />
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px' }}
                                                formatter={(value?: number, name?: string) => {
                                                    if (value === undefined) return '';
                                                    if (name === 'files') return [`${value} файла`, 'Брой'];
                                                    if (name === 'sizeMB') return [`${value} MB`, 'Размер'];
                                                    return [String(value), name || ''];
                                                }}
                                            />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="files"
                                                name="Брой файлове"
                                                stroke="#8b5cf6"
                                                fillOpacity={1}
                                                fill="url(#colorFiles)"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="sizeMB"
                                                name="Размер (MB)"
                                                stroke="#f59e0b"
                                                strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        Няма данни за файлове
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
