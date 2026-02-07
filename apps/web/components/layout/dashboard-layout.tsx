"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
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
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/components/language-provider";
import React from "react";
import { AppSidebar, sidebarItems } from "@/components/layout/app-sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [userId, setUserId] = useState<Id<"users"> | null>(null);
    const [mounted, setMounted] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { lang, setLang, t } = useLanguage();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setSearchOpen((open) => !open);
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
        setSearchOpen(false);
        command();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
                <CommandInput placeholder={t("searchPlaceholder")} />
                <CommandList>
                    <CommandEmpty>{t("noResultsFound")}</CommandEmpty>
                    <CommandGroup heading={t("pages")}>
                        {sidebarItems.map((item) => (
                            <CommandItem
                                key={item.href}
                                onSelect={() => runCommand(() => router.push(item.href))}
                            >
                                <item.icon className="mr-2 h-4 w-4" />
                                {t(`tab${item.labelKey.charAt(0).toUpperCase() + item.labelKey.slice(1)}`)}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading={t("projectsTitle")}>
                        {projects?.slice(0, 5).map((project) => (
                            <CommandItem
                                key={project._id}
                                onSelect={() => runCommand(() => router.push(`/projects?id=${project._id}`))}
                            >
                                <FolderKanban className="mr-2 h-4 w-4" />
                                {project.name}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading={t("tasksTitle")}>
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
                    <span>{mounted ? t("appTitle") : "Project Management"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSearchOpen(true)}
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
                    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-72 border-r-0">
                            <AppSidebar
                                className="w-full border-none h-full"
                                onMobileNavigate={() => setSheetOpen(false)}
                            />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="flex h-screen overflow-hidden">
                {/* Desktop Sidebar */}
                <AppSidebar
                    className="hidden md:flex"
                    onOpenSearch={() => setSearchOpen(true)}
                />

                {/* Main Content */}
                <main className={cn("flex-1 overflow-y-auto", pathname === "/projects" ? "p-0" : "p-8")}>
                    {children}
                </main>
            </div>
        </div>
    );
}
