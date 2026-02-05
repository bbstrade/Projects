"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
    Landmark,
    Smartphone,
    Server,
    Megaphone,
    Globe,
    Shield,
    MoreHorizontal,
    Calendar,
    Users,
    LucideIcon,
    Edit,
    Trash2
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export interface ProjectCardProps {
    id: string;
    title: string;
    department: string;
    status: "Active" | "In Progress" | "Draft" | "Review" | "Completed";
    priority: "High" | "Medium" | "Low" | "Critical";
    date: string;
    teamCount: number;
    progress: number;
    type?: "finance" | "mobile" | "server" | "marketing" | "tool" | "security";
    description?: string;
    lang?: "bg" | "en";
    color?: string; // Added color prop
    onEdit?: (id: string) => void;
}

const DICTIONARY = {
    bg: {
        prioritySuffix: "Приоритет",
        statuses: {
            "Active": "Активен",
            "In Progress": "В процес",
            "Draft": "Чернова",
            "Review": "Преглед",
            "Completed": "Завършен"
        },
        priorities: {
            "High": "Висок",
            "Medium": "Среден",
            "Low": "Нисък",
            "Critical": "Критичен"
        },
        tooltips: {
            dueDate: "Краен срок",
            team: "Екип"
        },
        actions: {
            edit: "Редактиране",
            delete: "Изтриване",
            deleteConfirm: "Проектът е изтрит успешно"
        }
    },
    en: {
        prioritySuffix: "Priority",
        statuses: {
            "Active": "Active",
            "In Progress": "In Progress",
            "Draft": "Draft",
            "Review": "Review",
            "Completed": "Completed"
        },
        priorities: {
            "High": "High",
            "Medium": "Medium",
            "Low": "Low",
            "Critical": "Critical"
        },
        tooltips: {
            dueDate: "Due Date",
            team: "Team Members"
        },
        actions: {
            edit: "Edit",
            delete: "Delete",
            deleteConfirm: "Project deleted successfully"
        }
    }
};

export function ProjectCard({
    id,
    title,
    department,
    status,
    priority,
    date,
    teamCount,
    progress,
    type = "finance",
    description,
    lang = "bg",
    color: customColor, // Get color prop
    onEdit
}: ProjectCardProps) {
    const router = useRouter();
    const dict = DICTIONARY[lang];
    const removeProject = useMutation(api.projects.remove);

    const handleDelete = async () => {
        try {
            await removeProject({ id: id as Id<"projects"> });
            toast.success(dict.actions.deleteConfirm);
        } catch (error) {
            toast.error("Error deleting project");
        }
    };

    const handleCardClick = () => {
        router.push(`/projects/${id}`);
    };

    // Icon and color mapping based on type
    const typeConfig: Record<string, { icon: LucideIcon, color: string }> = {
        finance: { icon: Landmark, color: "blue" },
        mobile: { icon: Smartphone, color: "indigo" },
        server: { icon: Server, color: "slate" },
        marketing: { icon: Megaphone, color: "pink" },
        tool: { icon: Globe, color: "purple" },
        security: { icon: Shield, color: "red" },
    };

    const { icon: Icon, color } = typeConfig[type] || typeConfig.finance;

    // If customColor is provided, use it for accent. Otherwise use the type-based color logic existing, or fallback.
    // The requirement says "visualize colors... borrowing design from photo".
    // Photo shows a left border colored and the icon background colored.

    // We will override the icon background logic if customColor exists?
    // Let's create a style object for dynamic colors.

    const cardStyle = customColor ? {
        borderLeftColor: customColor,
        borderLeftWidth: '4px',
    } : {};

    const iconStyle = customColor ? {
        color: customColor,
        backgroundColor: `${customColor}1A`, // 10% opacity approx
        borderColor: `${customColor}33`, // 20% opacity approx
    } : undefined;

    // Status Badge Logic
    const getStatusStyles = (status: string) => {
        switch (status) {
            case "Active": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
            case "In Progress": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
            case "Draft": return "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200 dark:border-slate-700";
            case "Review": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
            case "Completed": return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
            default: return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200";
        }
    };

    // Priority Badge Logic
    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case "High": return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
            case "Critical": return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 ring-1 ring-red-500/20";
            case "Medium": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
            case "Low": return "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200 dark:border-slate-700";
            default: return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200";
        }
    };

    // Progress Bar Color Logic
    const getProgressColor = (progress: number) => {
        if (progress >= 75) return "bg-emerald-500";
        if (progress >= 40) return "bg-blue-500";
        if (progress > 0) return "bg-purple-500"; // Example mix
        return "bg-slate-600";
    };

    const iconColorClasses: Record<string, string> = {
        blue: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
        indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
        slate: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400",
        pink: "bg-pink-500/10 border-pink-500/20 text-pink-600 dark:text-pink-400",
        purple: "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400",
        red: "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
    };

    return (
        <article
            onClick={handleCardClick}
            className="flex flex-col bg-white dark:bg-card border border-border rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-600 transition-all hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/20 group cursor-pointer"
            style={cardStyle}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div
                        className={cn("size-10 rounded-lg flex items-center justify-center border", !customColor && iconColorClasses[color])}
                        style={iconStyle}
                    >
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight group-hover:text-primary transition-colors cursor-pointer line-clamp-1" title={title}>
                            {title}
                        </h3>
                        <p className="text-muted-foreground text-xs mt-0.5">{department}</p>
                    </div>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-slate-900 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit?.(id)} className="cursor-pointer">
                                <Edit className="w-4 h-4 mr-2" />
                                {dict.actions.edit}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/10">
                                <Trash2 className="w-4 h-4 mr-2" />
                                {dict.actions.delete}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <p className="text-muted-foreground text-sm mb-5 line-clamp-2 h-10">
                {description || (lang === 'bg'
                    ? "Този проект няма добавено описание."
                    : "No description provided for this project.")}
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
                <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", getStatusStyles(status))}>
                    {dict.statuses[status] || status}
                </span>
                <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", getPriorityStyles(priority))}>
                    {dict.priorities[priority] || priority} {dict.prioritySuffix.toLowerCase()}
                </span>
            </div>

            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5" title={dict.tooltips.dueDate}>
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium">{date}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title={dict.tooltips.team}>
                        <Users className="w-4 h-4" />
                        <span className="text-xs font-medium">{teamCount}</span>
                    </div>
                </div>

                {/* Simple Progress Indicator */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{progress}%</span>
                    <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={cn("h-full rounded-full transition-all duration-500", getProgressColor(progress))}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </article>
    );
}
