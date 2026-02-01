"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import {
    User,
    Mail,
    Shield,
    Bell,
    Moon,
    Sun,
    Globe,
    Save,
    Camera,
    LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";

const dict = {
    title: "Профил",
    subtitle: "Управление на потребителския профил и настройки",
    personalInfo: "Лична информация",
    personalInfoDesc: "Обновете вашите лични данни",
    name: "Име",
    email: "Имейл",
    role: "Роля",
    preferences: "Предпочитания",
    preferencesDesc: "Персонализирайте вашето изживяване",
    theme: "Тема",
    themeLight: "Светла",
    themeDark: "Тъмна",
    themeSystem: "Системна",
    language: "Език",
    notifications: "Известия",
    notificationsDesc: "Получавайте известия за важни събития",
    security: "Сигурност",
    securityDesc: "Управление на достъпа и сесиите",
    lastLogin: "Последно влизане",
    memberSince: "Член от",
    save: "Запази промените",
    saving: "Запазване...",
    signOut: "Изход",
    roles: {
        admin: "Администратор",
        member: "Член",
        owner: "Собственик",
    },
};

export default function ProfilePage() {
    const { signOut } = useAuthActions();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState("");
    const [theme, setTheme] = useState("system");
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [language, setLanguage] = useState("bg");

    // Get current user
    const currentUser = useQuery(api.users.me);
    const updateUser = useMutation(api.users.update);

    // Initialize form values when user loads
    if (currentUser && !name) {
        setName(currentUser.name || "");
    }

    const handleSave = async () => {
        if (!currentUser) return;
        setIsSubmitting(true);
        try {
            await updateUser({
                userId: currentUser._id,
                name: name,
                preferences: {
                    theme,
                    notifications: notificationsEnabled,
                    language,
                },
            });
        } catch (error) {
            console.error("Failed to update profile:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
    };

    const formatDate = (timestamp?: number) => {
        if (!timestamp) return "—";
        return new Date(timestamp).toLocaleDateString("bg-BG", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    if (!currentUser) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-slate-200 rounded" />
                    <div className="h-4 w-96 bg-slate-100 rounded" />
                    <div className="h-64 bg-slate-100 rounded-lg mt-6" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{dict.title}</h1>
                <p className="text-muted-foreground">{dict.subtitle}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                <Card className="md:col-span-1">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={currentUser.avatar} />
                                    <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                                        {currentUser.name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                                >
                                    <Camera className="h-4 w-4" />
                                </Button>
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">{currentUser.name}</h3>
                            <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                            <Badge className="mt-2" variant="secondary">
                                <Shield className="mr-1 h-3 w-3" />
                                {dict.roles[currentUser.role as keyof typeof dict.roles] || currentUser.role}
                            </Badge>

                            <Separator className="my-4" />

                            <div className="w-full space-y-2 text-left text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{dict.memberSince}</span>
                                    <span>{formatDate(currentUser.createdAt)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{dict.lastLogin}</span>
                                    <span>{formatDate(Date.now())}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Settings Cards */}
                <div className="md:col-span-2 space-y-6">
                    {/* Personal Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                {dict.personalInfo}
                            </CardTitle>
                            <CardDescription>{dict.personalInfoDesc}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{dict.name}</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Вашето име"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">{dict.email}</Label>
                                    <Input
                                        id="email"
                                        value={currentUser.email}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preferences */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sun className="h-5 w-5" />
                                {dict.preferences}
                            </CardTitle>
                            <CardDescription>{dict.preferencesDesc}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>{dict.theme}</Label>
                                    <Select value={theme} onValueChange={setTheme}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="light">
                                                <div className="flex items-center gap-2">
                                                    <Sun className="h-4 w-4" />
                                                    {dict.themeLight}
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="dark">
                                                <div className="flex items-center gap-2">
                                                    <Moon className="h-4 w-4" />
                                                    {dict.themeDark}
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="system">
                                                {dict.themeSystem}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{dict.language}</Label>
                                    <Select value={language} onValueChange={setLanguage}>
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

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <Bell className="h-4 w-4" />
                                        <span className="font-medium">{dict.notifications}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {dict.notificationsDesc}
                                    </p>
                                </div>
                                <Switch
                                    checked={notificationsEnabled}
                                    onCheckedChange={setNotificationsEnabled}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions Button */}
                    <div className="flex justify-between">
                        <Button variant="destructive" onClick={handleSignOut}>
                            <LogOut className="mr-2 h-4 w-4" />
                            {dict.signOut}
                        </Button>

                        <Button onClick={handleSave} disabled={isSubmitting}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSubmitting ? dict.saving : dict.save}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
