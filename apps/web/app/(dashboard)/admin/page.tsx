"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    LayoutDashboard,
    History,
    Users,
    TrendingUp,
    CheckCircle2,
    Briefcase,
    Activity,
    Search
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { bg } from "date-fns/locale";

const dict = {
    title: "Административен панел",
    subtitle: "Управление на системата и одит",
    tabs: {
        overview: "Преглед",
        logs: "Дневник на активността",
        users: "Потребители"
    },
    stats: {
        totalProjects: "Общо проекти",
        activeProjects: "Активни проекти",
        totalTasks: "Общо задачи",
        completionRate: "Процент на завършване"
    },
    recentLogs: "Последни действия",
    noLogs: "Няма записи в дневника.",
    searchLogs: "Търсене в дневника..."
};

export default function AdminPage() {
    const stats = useQuery(api.admin.getStats);
    const logs = useQuery(api.admin.getLogs, { limit: 100 });
    const users = useQuery(api.users.list, {});
    const [logSearch, setLogSearch] = useState("");

    const filteredLogs = logs?.filter(log =>
        log.userName.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.action.toLowerCase().includes(logSearch.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">{dict.title}</h1>
                <p className="text-muted-foreground">{dict.subtitle}</p>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        {dict.tabs.overview}
                    </TabsTrigger>
                    <TabsTrigger value="logs">
                        <History className="h-4 w-4 mr-2" />
                        {dict.tabs.logs}
                    </TabsTrigger>
                    <TabsTrigger value="users">
                        <Users className="h-4 w-4 mr-2" />
                        {dict.tabs.users}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{dict.stats.totalProjects}</CardTitle>
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.totalProjects || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats?.activeProjects || 0} в процес на работа
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{dict.stats.totalTasks}</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.totalTasks || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats?.completedTasks || 0} завършени задачи
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{dict.stats.completionRate}</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{(stats?.completionRate || 0).toFixed(1)}%</div>
                                <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary"
                                        style={{ width: `${stats?.completionRate || 0}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Потребители</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                                <p className="text-xs text-muted-foreground">Регистрирани в системата</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Активност по време</CardTitle>
                                <CardDescription>Статистика на действията за последния период</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground italic">
                                [Графика на активността ще се появи тук с натрупване на данни]
                            </CardContent>
                        </Card>
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>{dict.recentLogs}</CardTitle>
                                <CardDescription>Последни 5 извършени действия</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {logs?.slice(0, 5).map((log) => (
                                        <div key={log._id} className="flex items-center gap-4">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={log.userAvatar} />
                                                <AvatarFallback>{log.userName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-xs font-medium leading-none">
                                                    {log.userName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {log.action} • {log.entityType}
                                                </p>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                                {format(log.createdAt, "HH:mm")}
                                            </div>
                                        </div>
                                    ))}
                                    {(!logs || logs.length === 0) && (
                                        <div className="text-sm text-center text-muted-foreground py-10">
                                            {dict.noLogs}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="logs" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>{dict.tabs.logs}</CardTitle>
                                    <CardDescription>Пълен одит на действията в системата</CardDescription>
                                </div>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={dict.searchLogs}
                                        className="pl-8"
                                        value={logSearch}
                                        onChange={(e) => setLogSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[600px] pr-4">
                                <div className="space-y-4">
                                    {filteredLogs?.map((log) => (
                                        <div key={log._id} className="flex items-start gap-4 p-3 rounded-lg border bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={log.userAvatar} />
                                                <AvatarFallback>{log.userName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-semibold">{log.userName}</span>
                                                    <Badge variant="outline" className="text-[10px] uppercase">
                                                        {log.entityType}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-600">
                                                    <span className="font-medium text-slate-900">{log.action}:</span> {JSON.stringify(log.details || "-")}
                                                </p>
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                    <Activity className="h-3 w-3" />
                                                    {format(log.createdAt, "PPP HH:mm:ss", { locale: bg })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!filteredLogs || filteredLogs.length === 0) && (
                                        <div className="text-center py-20 text-muted-foreground">
                                            {dict.noLogs}
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Управление на потребители</CardTitle>
                            <CardDescription>Списък на всички регистрирани служители</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {users?.map((user) => (
                                    <Card key={user._id} className="overflow-hidden">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={user.avatar} />
                                                    <AvatarFallback>{(user.name || "?").charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate">{user.name || "Unknown User"}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                                    {user.role}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
