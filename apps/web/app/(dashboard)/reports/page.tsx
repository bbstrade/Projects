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
    LineChart as LineChartIcon,
    PieChart as PieChartIcon,
    BarChart as BarChartIcon
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
    LineChart,
    Line,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";

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

export default function ReportsPage() {
    // Queries from Dashboard
    const metrics = useQuery(api.analytics.dashboardMetrics, {});
    const tasksByStatus = useQuery(api.analytics.tasksByStatus, {});
    const monthlyComparison = useQuery(api.analytics.monthlyComparison, {});
    const velocityMetrics = useQuery(api.analytics.velocityMetrics, { weeks: 8 });
    const overdueAnalysis = useQuery(api.analytics.overdueAnalysis, {});
    const teamPerformance = useQuery(api.analytics.teamPerformance, { limit: 5 });
    const workload = useQuery(api.analytics.tasksByAssignee, {});

    const isLoading = metrics === undefined;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Доклади и Анализи</h1>
                <p className="text-muted-foreground">Детайлни отчети и статистики за вашата работа</p>
            </div>

            <Tabs defaultValue="my-reports" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 max-w-[600px]">
                    <TabsTrigger value="my-reports">Моите Отчети</TabsTrigger>
                    <TabsTrigger value="analytics">Анализи</TabsTrigger>
                    <TabsTrigger value="trends">Тенденции</TabsTrigger>
                    <TabsTrigger value="performance">Екип</TabsTrigger>
                </TabsList>

                <MyReportsTab />

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
                                    <span className="font-bold">{metrics?.draftProjects || 0}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
                                    <span className="text-sm">Активни</span>
                                    <span className="font-bold text-blue-600">{metrics?.activeProjects || 0}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900">
                                    <span className="text-sm">Завършени</span>
                                    <span className="font-bold text-green-600">{metrics?.completedProjects || 0}</span>
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
                                    <span className="font-bold">{metrics?.todoTasks || 0}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
                                    <span className="text-sm">В процес</span>
                                    <span className="font-bold text-amber-600">{metrics?.inProgressTasks || 0}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900">
                                    <span className="text-sm">Завършени</span>
                                    <span className="font-bold text-green-600">{metrics?.completedTasks || 0}</span>
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
                                    <span className="font-bold text-amber-600">{metrics?.pendingApprovals || 0}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900">
                                    <span className="text-sm">Одобрени</span>
                                    <span className="font-bold text-green-600">{metrics?.approvedApprovals || 0}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900">
                                    <span className="text-sm">Отхвърлени</span>
                                    <span className="font-bold text-red-600">{metrics?.rejectedApprovals || 0}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tasks by Status Pie */}
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-indigo-500" />
                                Задачи по статус
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
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

                <TabsContent value="trends" className="space-y-4">
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
                                    Скорост на екипа
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
                                    Просрочени задачи
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
                                    Екипна производителност
                                </CardTitle>
                                <CardDescription>Задачи на член</CardDescription>
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
                                    Натовареност на екипа
                                </CardTitle>
                                <CardDescription>Задачи по член</CardDescription>
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

function MyReportsTab() {
    const reports = useQuery(api.customReports.list, {});
    const removeReport = useMutation(api.customReports.remove);
    const duplicateReport = useMutation(api.customReports.duplicate);
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
                <h3 className="text-lg font-medium">Моите отчети</h3>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Нов отчет
                </Button>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Reports List Sidebar */}
                <div className="col-span-12 md:col-span-3 space-y-3">
                    {reports === undefined ? (
                        <div className="text-muted-foreground text-sm">Зареждане...</div>
                    ) : reports.length === 0 ? (
                        <Card>
                            <CardContent className="p-6 text-center">
                                <p className="text-sm text-muted-foreground mb-4">
                                    Нямате персонализирани отчети
                                </p>
                                <Button variant="outline" size="sm" onClick={handleCreate}>
                                    Създайте първия си отчет
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
                                Нов отчет
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
