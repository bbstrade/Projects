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
    Users,
    Shield,
    ChevronRight,
    Clock,
    Plus,
} from "lucide-react";
import { TeamSwitcher } from "@/components/team-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useMemo } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useTheme } from "next-themes";

export const sidebarItems = [
    { icon: LayoutDashboard, label: "Табло", href: "/dashboard" },
    { icon: FolderKanban, label: "Проекти", href: "/projects" },
    { icon: CheckSquare, label: "Задачи", href: "/tasks" },
    { icon: FileCheck, label: "Одобрения", href: "/approvals" },
    { icon: Users, label: "Екипи", href: "/teams" },
    { icon: FileText, label: "Доклади", href: "/reports" },
    { icon: Settings, label: "Настройки", href: "/settings" },
];

export const adminItems = [
    { icon: Shield, label: "Админ", href: "/admin" },
];

interface AppSidebarProps {
    className?: string;
    onMobileNavigate?: () => void;
}

export function AppSidebar({ className, onMobileNavigate }: AppSidebarProps) {
    const pathname = usePathname();
    const { resolvedTheme } = useTheme();
    const logoSrc = resolvedTheme === "dark" ? "/logo-dark.png" : "/logo.png";
    const [tasksOpen, setTasksOpen] = useState(true);
    const [projectsOpen, setProjectsOpen] = useState(true);

    // Queries
    const user = useQuery(api.users.me);
    const currentTeamId = user?.currentTeamId;

    // Pass skipping argument if we don't have teamId yet, though listByTeam expects string. 
    // We can handle undefined by passing "" or waiting. listByTeam failure? 
    // Best to conditional rendering or pass a skip token if Convex supported it, here just empty string if null.
    // Ideally we wait for user.
    const teamIdParam = currentTeamId || "";

    const tasks = useQuery(api.tasks.listByTeam, currentTeamId ? { teamId: currentTeamId } : "skip");
    const projects = useQuery(api.projects.listByTeam, currentTeamId ? { teamId: currentTeamId } : "skip");

    // Statuses
    const customTaskStatuses = useQuery(api.statuses.list, currentTeamId ? { type: "task", teamId: currentTeamId } : "skip");
    const customProjectStatuses = useQuery(api.statuses.list, currentTeamId ? { type: "project", teamId: currentTeamId } : "skip");

    // Memoized Data
    const { myTasks, taskStats, allTaskStatuses } = useMemo(() => {
        if (!tasks || !user) return { myTasks: [], taskStats: { todo: 0, inProgress: 0, overdue: 0, done: 0 }, allTaskStatuses: [] };

        const myTasksFiltered = tasks.filter(t => t.assignee_email === user.email);

        const now = new Date();
        const stats = {
            todo: myTasksFiltered.filter(t => t.status === 'todo').length,
            inProgress: myTasksFiltered.filter(t => t.status === 'in_progress').length,
            overdue: myTasksFiltered.filter(t =>
                t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now
            ).length,
            done: myTasksFiltered.filter(t => t.status === 'done').length,
        };

        const defaultStatuses = [
            { value: 'todo', color: '#6b7280' },
            { value: 'in_progress', color: '#3b82f6' },
            { value: 'in_review', color: '#f97316' },
            { value: 'done', color: '#22c560' }
        ];

        const customMapped = (customTaskStatuses || []).map(s => ({
            value: s.slug,
            color: s.color
        }));

        const allStatuses = [...defaultStatuses, ...customMapped];

        return { myTasks: myTasksFiltered, taskStats: stats, allTaskStatuses: allStatuses };
    }, [tasks, user, customTaskStatuses]);

    const { myProjects, allProjectStatuses } = useMemo(() => {
        if (!projects || !user) return { myProjects: [], allProjectStatuses: [] };

        const myProjectsFiltered = projects.filter((p) => {
            // 1. Creator
            if (p.created_by === user.email) return true;
            // 2. Member
            if (Array.isArray(p.team_members) && p.team_members.length > 0) {
                return p.team_members.some(member => {
                    const trimmed = (member || "").trim().toLowerCase();
                    if (!trimmed) return false;
                    const uEmail = (user.email || "").toLowerCase();
                    const uName = (user.name || "").toLowerCase();
                    return trimmed === uEmail || trimmed === uName;
                });
            }
            return false;
        });

        const defaultStatuses = [
            { value: 'active', color: '#22c55e' },
            { value: 'on_hold', color: '#f59e0b' },
            { value: 'completed', color: '#3b82f6' },
            { value: 'archived', color: '#6b7280' }
        ];

        const customMapped = (customProjectStatuses || []).map(s => ({
            value: s.slug,
            color: s.color
        }));

        return { myProjects: myProjectsFiltered, allProjectStatuses: [...defaultStatuses, ...customMapped] };

    }, [projects, user, customProjectStatuses]);

    const getTaskColor = (status: string) => {
        const s = allTaskStatuses.find(item => item.value === status);
        return s ? s.color : '#6b7280';
    };

    const getProjectColor = (status: string) => {
        const s = allProjectStatuses.find(item => item.value === status);
        return s ? s.color : '#6b7280';
    };

    return (
        <aside className={cn("flex w-64 flex-col border-r bg-white dark:bg-slate-950", className)}>
            <div className="flex h-16 items-center gap-3 border-b px-4 shrink-0">
                <Image src={logoSrc} alt="Logo" width={32} height={32} />
                <span className="font-bold text-lg text-slate-900 dark:text-white">Управление</span>
            </div>

            <div className="px-3 py-2 border-b shrink-0">
                <TeamSwitcher />
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                {/* Main Nav */}
                <nav className="space-y-1">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onMobileNavigate}
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
                    {user?.role === "admin" && adminItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onMobileNavigate}
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

                {/* My Tasks */}
                <div className="space-y-1">
                    <div
                        className="flex items-center justify-between px-3 py-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md group"
                        onClick={() => setTasksOpen(!tasksOpen)}
                    >
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                            <CheckSquare className="h-4 w-4" />
                            <span>Моите Задачи</span>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-1.5 py-0.5 rounded-full">
                                {myTasks.length}
                            </span>
                        </div>
                        <ChevronRight className={cn("h-4 w-4 text-slate-400 transition-transform", tasksOpen && "rotate-90")} />
                    </div>

                    {tasksOpen && (
                        <div className="pl-2 space-y-1 mt-1">
                            {myTasks.length === 0 ? (
                                <div className="text-xs text-slate-500 text-center py-2">Нямате задачи</div>
                            ) : (
                                <>
                                    {myTasks.slice(0, 8).map(task => (
                                        <Link
                                            key={task._id}
                                            href={`/tasks?id=${task._id}`}
                                            onClick={onMobileNavigate}
                                            className="group flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-l-2"
                                            style={{ borderLeftColor: getTaskColor(task.status) }}
                                        >
                                            <div className="truncate flex-1 pr-2 text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                                                {task.title}
                                            </div>
                                            {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done' && (
                                                <Clock className="h-3 w-3 text-red-500 shrink-0" />
                                            )}
                                        </Link>
                                    ))}
                                    {myTasks.length > 8 && (
                                        <Link
                                            href="/tasks"
                                            onClick={onMobileNavigate}
                                            className="block px-3 py-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 pl-4"
                                        >
                                            + Виж още {myTasks.length - 8}
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* My Projects */}
                <div className="space-y-1">
                    <div
                        className="flex items-center justify-between px-3 py-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md group"
                        onClick={() => setProjectsOpen(!projectsOpen)}
                    >
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                            <FolderKanban className="h-4 w-4" />
                            <span>Моите Проекти</span>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-1.5 py-0.5 rounded-full">
                                {myProjects.length}
                            </span>
                        </div>
                        <ChevronRight className={cn("h-4 w-4 text-slate-400 transition-transform", projectsOpen && "rotate-90")} />
                    </div>

                    {projectsOpen && (
                        <div className="pl-2 space-y-1 mt-1">
                            {myProjects.length === 0 ? (
                                <div className="text-xs text-slate-500 text-center py-2">Нямате проекти</div>
                            ) : (
                                <>
                                    {myProjects.slice(0, 8).map(project => {
                                        // Count "User's tasks" in this project
                                        const myTasksInProject = (tasks || []).filter(t =>
                                            t.projectId === project._id &&
                                            t.assignee_email === user?.email
                                        ).length;

                                        return (
                                            <Link
                                                key={project._id}
                                                href={`/projects?id=${project._id}`} // Assuming project details page accepts ID
                                                onClick={onMobileNavigate}
                                                className="group flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-l-2"
                                                style={{ borderLeftColor: getProjectColor(project.status) }}
                                            >
                                                <div className="truncate flex-1 pr-2 text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                                                    {project.name}
                                                </div>
                                                {myTasksInProject > 0 && (
                                                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] px-1.5 rounded-full shrink-0">
                                                        {myTasksInProject}
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                    {myProjects.length > 8 && (
                                        <Link
                                            href="/projects"
                                            onClick={onMobileNavigate}
                                            className="block px-3 py-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 pl-4"
                                        >
                                            + Виж още {myProjects.length - 8}
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky User Profile */}
            <div className="border-t p-4 shrink-0 mt-auto">
                <Link
                    href="/profile"
                    onClick={onMobileNavigate}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-800",
                        pathname === "/profile"
                            ? "bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400"
                            : "text-slate-600 dark:text-slate-400"
                    )}
                >
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                            {user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">
                            {user?.name || "Потребител"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {user?.email || "Профил"}
                        </span>
                    </div>
                </Link>
            </div>
        </aside>
    );
}
