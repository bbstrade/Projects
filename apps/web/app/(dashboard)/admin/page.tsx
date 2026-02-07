"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    LayoutDashboard,
    History,
    Users,
    TrendingUp,
    CheckCircle2,
    Briefcase,
    List,
    AlertCircle
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersManagement from "@/components/admin/UsersManagement";
import StatusManagement from "@/components/admin/StatusManagement";
import PriorityManagement from "@/components/admin/PriorityManagement";
import AuditLogViewer from "@/components/admin/AuditLogViewer";
import { useLanguage } from "@/components/language-provider";

export default function AdminPage() {
    const { t } = useLanguage();
    const stats = useQuery(api.admin.getSystemStats);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">{t("adminTitle")}</h1>
                <p className="text-muted-foreground">{t("adminSubtitle")}</p>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5 h-auto">
                    <TabsTrigger value="overview" className="gap-2 py-2">
                        <LayoutDashboard className="h-4 w-4" />
                        <span className="hidden md:inline">{t("adminTabsOverview")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="users" className="gap-2 py-2">
                        <Users className="h-4 w-4" />
                        <span className="hidden md:inline">{t("adminTabsUsers")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="statuses" className="gap-2 py-2">
                        <List className="h-4 w-4" />
                        <span className="hidden md:inline">{t("adminTabsStatuses")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="priorities" className="gap-2 py-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="hidden md:inline">{t("adminTabsPriorities")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="gap-2 py-2">
                        <History className="h-4 w-4" />
                        <span className="hidden md:inline">{t("adminTabsLogs")}</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t("adminStatsTotalProjects")}</CardTitle>
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.totalProjects || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats?.activeProjects || 0} {t("adminStatsActiveText") || "in progress"}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t("adminStatsTotalTasks")}</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.totalTasks || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats?.completedTasks || 0} {t("adminStatsCompletedText") || "completed tasks"}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t("adminStatsCompletionRate")}</CardTitle>
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
                                <CardTitle className="text-sm font-medium">{t("adminStatsTotalUsers")}</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                                <p className="text-xs text-muted-foreground">{t("adminStatsRegisteredText") || "Registered in system"}</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                    <UsersManagement />
                </TabsContent>

                <TabsContent value="statuses" className="space-y-4">
                    <StatusManagement />
                </TabsContent>

                <TabsContent value="priorities" className="space-y-4">
                    <PriorityManagement />
                </TabsContent>

                <TabsContent value="logs" className="space-y-4 h-[700px]">
                    <AuditLogViewer />
                </TabsContent>
            </Tabs>
        </div>
    );
}

