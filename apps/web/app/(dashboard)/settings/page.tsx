"use client";

import { useTheme } from "next-themes";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Moon, Sun, Globe, Bell, Laptop } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { lang, setLang } = useLanguage();
    const [notifications, setNotifications] = useState(true);

    const isBg = lang === "bg";

    const dict = {
        title: isBg ? "Настройки" : "Settings",
        subtitle: isBg ? "Управление на предпочитанията на приложението" : "Manage application preferences",
        appearance: {
            title: isBg ? "Външен вид" : "Appearance",
            desc: isBg ? "Настройте темата и езика на интерфейса" : "Customize visual theme and interface language",
            theme: isBg ? "Тема" : "Theme",
            themeLight: isBg ? "Светла" : "Light",
            themeDark: isBg ? "Тъмна" : "Dark",
            themeSystem: isBg ? "Системна" : "System",
            language: isBg ? "Език" : "Language",
        },
        notifications: {
            title: isBg ? "Известия" : "Notifications",
            desc: isBg ? "Управление на известията" : "Manage your notification preferences",
            enable: isBg ? "Включи известията" : "Enable Notifications",
            enableDesc: isBg ? "Получавайте известия за задачи и проекти" : "Receive notifications about tasks and projects",
        },
        save: isBg ? "Запази промените" : "Save Changes",
        saved: isBg ? "Настройките са запазени" : "Settings saved",
    };

    const handleSave = () => {
        // Here you would typically persist to backend
        toast.success(dict.saved);
    };

    return (
        <div className="container max-w-4xl py-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{dict.title}</h1>
                <p className="text-muted-foreground">{dict.subtitle}</p>
            </div>

            <div className="grid gap-6">
                {/* Appearance Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Laptop className="h-5 w-5" />
                            {dict.appearance.title}
                        </CardTitle>
                        <CardDescription>{dict.appearance.desc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>{dict.appearance.theme}</Label>
                                <Select value={theme} onValueChange={setTheme}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">
                                            <div className="flex items-center gap-2">
                                                <Sun className="h-4 w-4" />
                                                {dict.appearance.themeLight}
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="dark">
                                            <div className="flex items-center gap-2">
                                                <Moon className="h-4 w-4" />
                                                {dict.appearance.themeDark}
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="system">
                                            <div className="flex items-center gap-2">
                                                <Laptop className="h-4 w-4" />
                                                {dict.appearance.themeSystem}
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{dict.appearance.language}</Label>
                                <Select value={lang} onValueChange={(v) => setLang(v as "bg" | "en")}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bg">
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-4 w-4" />
                                                Български
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="en">
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-4 w-4" />
                                                English
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            {dict.notifications.title}
                        </CardTitle>
                        <CardDescription>{dict.notifications.desc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between space-x-2">
                            <div className="flex flex-col space-y-1">
                                <Label className="text-base">{dict.notifications.enable}</Label>
                                <span className="text-sm text-muted-foreground">
                                    {dict.notifications.enableDesc}
                                </span>
                            </div>
                            <Switch
                                checked={notifications}
                                onCheckedChange={setNotifications}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleSave}>
                        {dict.save}
                    </Button>
                </div>
            </div>
        </div>
    );
}
