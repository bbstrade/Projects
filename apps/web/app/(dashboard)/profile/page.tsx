import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession, signOut } from "@/lib/auth-client";
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
        user: "Потребител"
    },
};

export default function ProfilePage() {
    const { data: session, isPending: isSessionLoading } = useSession();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState("");
    const [theme, setTheme] = useState("system");
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [language, setLanguage] = useState("bg");

    // Get current user from Convex (if available)
    const convexUser = useQuery(api.users.me);
    const updateUser = useMutation(api.users.update);

    // Merge session user and convex user
    const user = convexUser || (session?.user ? {
        _id: undefined, // Cannot update if no convex ID
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.image,
        role: "member",
        createdAt: session.user.createdAt ? new Date(session.user.createdAt).getTime() : Date.now(),
        // Default preferences
        preferences: {
            theme: "system",
            notifications: true,
            language: "bg"
        }
    } : null);

    // Initialize form values when user loads
    useEffect(() => {
        if (user && !name) {
            setName(user.name || "");
            if (user.preferences) {
                setTheme(user.preferences.theme || "system");
                setNotificationsEnabled(user.preferences.notifications ?? true);
                setLanguage(user.preferences.language || "bg");
            }
        }
    }, [user, name]);

    const handleSave = async () => {
        if (!user || !user._id) {
            console.error("No valid user ID to update");
            return;
        }
        setIsSubmitting(true);
        try {
            await updateUser({
                userId: user._id as any,
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

    if (convexUser === undefined && isSessionLoading) {
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

    if (!user) {
        // Optionally redirect here or show empty state
        return (
            <div className="p-8 text-center text-muted-foreground">
                Не е намерен потребител. Моля влезте в системата.
                <Button variant="outline" className="mt-4 block mx-auto" onClick={() => router.push("/login")}>
                    Към вход
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground">{dict.title}</h1>
                <p className="text-lg text-muted-foreground mt-2">{dict.subtitle}</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-4">
                {/* Profile Card */}
                <div className="md:col-span-1 lg:col-span-1 space-y-6">
                    <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                        <CardContent className="pt-8 pb-8">
                            <div className="flex flex-col items-center text-center">
                                <div className="relative mb-6">
                                    <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                                        <AvatarImage src={user.avatar || undefined} className="object-cover" />
                                        <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                                            {user.name?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="absolute bottom-0 right-0 h-10 w-10 rounded-full shadow-md hover:scale-105 transition-transform"
                                    >
                                        <Camera className="h-5 w-5" />
                                    </Button>
                                </div>
                                <h3 className="text-2xl font-bold">{user.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                                <Badge className="mt-4 px-3 py-1 text-sm bg-primary/10 text-primary hover:bg-primary/20 border-0">
                                    <Shield className="mr-1.5 h-3.5 w-3.5" />
                                    {dict.roles[user.role as keyof typeof dict.roles] || user.role}
                                </Badge>

                                <Separator className="my-6" />

                                <div className="w-full space-y-3 text-left text-sm">
                                    <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                        <span className="text-muted-foreground">{dict.memberSince}</span>
                                        <span className="font-medium">{formatDate(user.createdAt)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                        <span className="text-muted-foreground">{dict.lastLogin}</span>
                                        <span className="font-medium">{formatDate(Date.now())}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Settings Cards */}
                <div className="md:col-span-2 lg:col-span-3 space-y-8">
                    {/* Personal Info */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-4 border-b">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <User className="h-5 w-5" />
                                </div>
                                {dict.personalInfo}
                            </CardTitle>
                            <CardDescription>{dict.personalInfoDesc}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2.5">
                                    <Label htmlFor="name" className="text-base">{dict.name}</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Вашето име"
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="email" className="text-base">{dict.email}</Label>
                                    <Input
                                        id="email"
                                        value={user.email}
                                        disabled
                                        className="bg-muted h-11"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preferences */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-4 border-b">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Sun className="h-5 w-5" />
                                </div>
                                {dict.preferences}
                            </CardTitle>
                            <CardDescription>{dict.preferencesDesc}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2.5">
                                    <Label className="text-base">{dict.theme}</Label>
                                    <Select value={theme} onValueChange={setTheme}>
                                        <SelectTrigger className="h-11">
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
                                                <div className="flex items-center gap-2">
                                                    <span className="h-4 w-4 block bg-gradient-to-tr from-gray-500 to-gray-200 rounded-full" />
                                                    {dict.themeSystem}
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-base">{dict.language}</Label>
                                    <Select value={language} onValueChange={setLanguage}>
                                        <SelectTrigger className="h-11">
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

                            <div className="flex items-center justify-between rounded-xl border p-5 hover:bg-muted/30 transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Bell className="h-5 w-5 text-primary" />
                                        <span className="font-semibold">{dict.notifications}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground pl-7">
                                        {dict.notificationsDesc}
                                    </p>
                                </div>
                                <Switch
                                    checked={notificationsEnabled}
                                    onCheckedChange={setNotificationsEnabled}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions Button */}
                    <div className="flex justify-between items-center pt-4">
                        <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-11 px-6" onClick={handleSignOut}>
                            <LogOut className="mr-2 h-5 w-5" />
                            {dict.signOut}
                        </Button>

                        <Button onClick={handleSave} disabled={isSubmitting} size="lg" className="h-11 px-8 shadow-lg hover:shadow-xl transition-all">
                            <Save className="mr-2 h-5 w-5" />
                            {isSubmitting ? dict.saving : dict.save}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
