"use client";

import { useLanguage } from "@/components/language-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, Download, Layout } from "lucide-react";
import ProfileTab from "@/components/settings/ProfileTab";
import NotificationsTab from "@/components/settings/NotificationsTab";
import DataExportTab from "@/components/settings/DataExportTab";
import { TemplateManager } from "@/components/templates/template-manager";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import { useSearchParams } from "next/navigation";

export default function SettingsPage() {
    const { lang, t } = useLanguage();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get("tab") || "profile";
    const isBg = lang === "bg";

    const user = useQuery(api.users.me);

    const dict = {
        title: t("settings"),
        subtitle: t("profileDesc"),
        loading: t("loading"),
        tabs: {
            profile: t("tabProfile"),
            notifications: t("tabNotifications"),
            export: t("tabExport"),
            templates: t("tabTemplates"),
        }
    };

    // Show loading while user is being fetched
    if (user === undefined) {
        return (
            <div className="container max-w-6xl py-8 flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                    <p className="text-muted-foreground">{dict.loading}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-7xl py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">{dict.title}</h1>
                <p className="text-muted-foreground">{dict.subtitle}</p>
            </div>

            <Tabs key={activeTab} defaultValue={activeTab} orientation="vertical" className="flex flex-col lg:flex-row gap-8">
                <TabsList className="flex flex-col w-full lg:w-64 h-auto bg-transparent space-y-1 p-0 justify-start mb-8 lg:mb-0">
                    <TabsTrigger
                        value="profile"
                        className="w-full justify-start px-4 py-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted transition-colors gap-3 font-medium"
                    >
                        <User className="h-4 w-4" />
                        {dict.tabs.profile}
                    </TabsTrigger>
                    <TabsTrigger
                        value="notifications"
                        className="w-full justify-start px-4 py-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted transition-colors gap-3 font-medium"
                    >
                        <Bell className="h-4 w-4" />
                        {dict.tabs.notifications}
                    </TabsTrigger>
                    <TabsTrigger
                        value="export"
                        className="w-full justify-start px-4 py-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted transition-colors gap-3 font-medium"
                    >
                        <Download className="h-4 w-4" />
                        {dict.tabs.export}
                    </TabsTrigger>
                    <TabsTrigger
                        value="templates"
                        className="w-full justify-start px-4 py-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted transition-colors gap-3 font-medium"
                    >
                        <Layout className="h-4 w-4" />
                        {dict.tabs.templates}
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1">
                    <TabsContent value="profile" className="m-0 space-y-6">
                        <ProfileTab />
                    </TabsContent>

                    <TabsContent value="notifications" className="m-0 space-y-6">
                        <NotificationsTab />
                    </TabsContent>

                    <TabsContent value="export" className="m-0 space-y-6">
                        <DataExportTab />
                    </TabsContent>


                    <TabsContent value="templates" className="m-0 space-y-6 h-full">
                        <TemplateManager />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
