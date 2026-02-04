"use client";

import { useTheme } from "next-themes";
import { useLanguage } from "@/components/language-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, Shield, Download } from "lucide-react";
import ProfileTab from "@/components/settings/ProfileTab";
import NotificationsTab from "@/components/settings/NotificationsTab";
import AdministrationTab from "@/components/settings/AdministrationTab";
import DataExportTab from "@/components/settings/DataExportTab";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function SettingsPage() {
    const { lang } = useLanguage();
    const isBg = lang === "bg";

    const user = useQuery(api.users.me);

    const dict = {
        title: isBg ? "Настройки" : "Settings",
        subtitle: isBg ? "Управление на вашия профил и настройки на системата" : "Manage your profile and system preferences",
        tabs: {
            profile: isBg ? "Профил" : "Profile",
            notifications: isBg ? "Нотификации" : "Notifications",
            admin: isBg ? "Администрация" : "Administration",
            export: isBg ? "Експорт на данни" : "Data Export",
        }
    };

    // Determine if user has admin access
    const isAdmin = user?.role === 'admin' || user?.role === 'owner'; // Simple check, real logic might need team check

    return (
        <div className="container max-w-6xl py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{dict.title}</h1>
                <p className="text-muted-foreground">{dict.subtitle}</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[800px]">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        {dict.tabs.profile}
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        {dict.tabs.notifications}
                    </TabsTrigger>
                    {isAdmin && (
                        <TabsTrigger value="admin" className="gap-2">
                            <Shield className="h-4 w-4" />
                            {dict.tabs.admin}
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="export" className="gap-2">
                        <Download className="h-4 w-4" />
                        {dict.tabs.export}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <ProfileTab />
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6">
                    <NotificationsTab />
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="admin" className="space-y-6">
                        <AdministrationTab />
                    </TabsContent>
                )}

                <TabsContent value="export" className="space-y-6">
                    <DataExportTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
