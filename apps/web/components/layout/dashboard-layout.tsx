"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    FileCheck,
    FileText,
    Settings,
    Menu,
    Users,
    User,
    Shield,
    Globe,
    Sun,
    Moon,
    Search
} from "lucide-react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/components/language-provider";
import React from "react";
import { TeamSwitcher } from "@/components/team-switcher";

const sidebarItems = [
    { icon: LayoutDashboard, label: "Табло", href: "/dashboard" },
    { icon: FolderKanban, label: "Проекти", href: "/projects" },
    { icon: CheckSquare, label: "Задачи", href: "/tasks" },
    { icon: FileCheck, label: "Одобрения", href: "/approvals" },
    { icon: Users, label: "Екипи", href: "/teams" },
    { icon: FileText, label: "Доклади", href: "/reports" },
    { icon: Settings, label: "Настройки", href: "/settings" },
];

const adminItems = [
    { icon: Shield, label: "Админ", href: "/admin" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [userId, setUserId] = useState<Id<"users"> | null>(null);
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { lang, setLang } = useLanguage();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const logoSrc = mounted && resolvedTheme === "dark" ? "/logo-dark.png" : "/logo.png";

    const currentUser = useQuery(api.users.me);
    const projects = useQuery(api.projects.list, {});
    const tasks = useQuery(api.tasks.listAll, {});

    // Initialize user ID on mount
    useEffect(() => {
        if (currentUser) {
            setUserId(currentUser._id);
        }
    }, [currentUser]);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder={lang === "bg" ? "Търсене във всички менюта..." : "Type a command or search..."} />
                <CommandList>
                    <CommandEmpty>{lang === "bg" ? "Няма намерени резултати." : "No results found."}</CommandEmpty>
                    <CommandGroup heading={lang === "bg" ? "Страници" : "Pages"}>
                        {sidebarItems.map((item) => (
                            <CommandItem
                                key={item.href}
                                onSelect={() => runCommand(() => router.push(item.href))}
                            >
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading={lang === "bg" ? "Проекти" : "Projects"}>
                        {projects?.slice(0, 5).map((project) => (
                            <CommandItem
                                key={project._id}
                                onSelect={() => runCommand(() => router.push(`/projects?id=${project._id}`))} // Assuming query param or modal handling, keeping it simple for now
                            >
                                <FolderKanban className="mr-2 h-4 w-4" />
                                {project.name}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading={lang === "bg" ? "Задачи" : "Tasks"}>
                        {tasks?.slice(0, 5).map((task) => (
                            <CommandItem
                                key={task._id}
                                onSelect={() => runCommand(() => router.push(`/tasks?id=${task._id}`))}
                            >
                                <CheckSquare className="mr-2 h-4 w-4" />
                                {task.title}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>

            {/* Mobile Header */}
            <div className="flex items-center justify-between border-b bg-white p-4 dark:bg-slate-950 md:hidden">
                <div className="flex items-center gap-2 font-bold text-lg">
                    <Image src={logoSrc} alt="Logo" width={56} height={56} />
                    <span>Управление на проекти</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setOpen(true)}
                        className="h-8 w-8 text-muted-foreground"
                    >
                        <Search className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLang(lang === "bg" ? "en" : "bg")}
                        className="h-8 w-8"
                    >
                        <Globe className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="h-8 w-8"
                    >
                        {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                    {userId && <NotificationsDropdown userId={userId} />}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64">
                            <div className="mb-8 text-xl font-bold">Menu</div>
                            <nav className="flex flex-col gap-2">
                                {sidebarItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-800",
                                            pathname.startsWith(item.href)
                                                ? "bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400"
                                                : "text-slate-600 dark:text-slate-400"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.label}
                                    </Link>
                                ))}
                                {currentUser?.role === "admin" && adminItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-800",
                                            pathname.startsWith(item.href)
                                                ? "bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400"
                                                : "text-slate-600 dark:text-slate-400"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="flex h-screen overflow-hidden">
                {/* Desktop Sidebar */}
                <aside className="hidden w-64 flex-col border-r bg-white dark:bg-slate-950 md:flex">
                    <div className="flex h-16 items-center justify-between border-b px-6">
                        <div className="flex items-center gap-2 w-full">
                            <TeamSwitcher />
                        </div>
                    </div>



                    {/* Notifications & Settings in header area */}
                    <div className="flex items-center justify-end px-4 py-2 border-b gap-1">
                        <div className="flex-1 mr-2 relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            <div
                                onClick={() => setOpen(true)}
                                className="h-8 w-full bg-slate-100 dark:bg-slate-900 border-none rounded-md flex items-center pl-9 text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                            >
                                {lang === "bg" ? "Търсене..." : "Search..."}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLang(lang === "bg" ? "en" : "bg")}
                            className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title={lang === "bg" ? "Change to English" : "Смени на Български"}
                        >
                            <Globe className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            {resolvedTheme === "dark" ? (
                                <Sun className="h-4 w-4 text-slate-500" />
                            ) : (
                                <Moon className="h-4 w-4 text-slate-500" />
                            )}
                        </Button>
                        {userId && <NotificationsDropdown userId={userId} />}
                    </div>

                    <nav className="flex-1 space-y-1 p-4">
                        {sidebarItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-slate-100 dark:hover:bg-slate-800",
                                    pathname.startsWith(item.href)
                                        ? "bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400"
                                        : "text-slate-600 dark:text-slate-400"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        ))}
                        {currentUser?.role === "admin" && adminItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-slate-100 dark:hover:bg-slate-800",
                                    pathname.startsWith(item.href)
                                        ? "bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400"
                                        : "text-slate-600 dark:text-slate-400"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* User Profile Link */}
                    <div className="border-t p-4">
                        <Link
                            href="/profile"
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-800",
                                pathname === "/profile"
                                    ? "bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400"
                                    : "text-slate-600 dark:text-slate-400"
                            )}
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={currentUser?.avatar} />
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                                    {currentUser?.name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                    {currentUser?.name || "Потребител"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {currentUser?.email || "Профил"}
                                </span>
                            </div>
                        </Link>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={cn("flex-1 overflow-y-auto", pathname === "/projects" ? "p-0" : "p-8")}>
                    {children}
                </main>
            </div>
        </div>
    );
}
