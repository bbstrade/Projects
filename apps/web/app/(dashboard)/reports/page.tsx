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
    Filter
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
    const taskTrend = useQuery(api.analytics.taskCompletionTrend, {}); // Not filtered by date yet as it's trend data

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
            </Tabs>
        </div>
    );
}
