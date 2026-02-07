"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MoreHorizontal, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { Doc } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateProjectTemplateDialog } from "@/components/templates/create-project-template-dialog";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Copy } from "lucide-react";

interface ProjectHeaderProps {
    project: Doc<"projects">;
    stats: {
        totalTasks: number;
        inProgress: number;
        done: number;
        overdue: number;
    } | undefined;
    onEdit: () => void;
    onDelete: () => void;
}

export function ProjectHeader({ project, stats, onEdit, onDelete }: ProjectHeaderProps) {
    const progress = stats?.totalTasks ? Math.round((stats.done / stats.totalTasks) * 100) : 0;
    const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);

    // Fetch full project data only when dialog is open
    const projectWithTasks = useQuery(api.projects.getWithTasks, isCreateTemplateOpen ? { id: project._id } : "skip");

    const translateStatus = (status: string) => {
        const map: Record<string, string> = {
            active: "Активен",
            draft: "Чернова",
            completed: "Завършен",
            archived: "Архивиран",
            on_hold: "Задържан"
        };
        return map[status] || status;
    };

    const translatePriority = (priority: string) => {
        const map: Record<string, string> = {
            low: "Нисък",
            medium: "Среден",
            high: "Висок",
            critical: "Критичен"
        };
        return map[priority] || priority;
    };

    return (
        <div className="space-y-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {project.name}
                        </h1>
                        <Badge variant={project.status === "active" ? "default" : "secondary"}>
                            {translateStatus(project.status)}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                            {translatePriority(project.priority)} Приоритет
                        </Badge>
                    </div>
                    {project.description && (
                        <p className="text-muted-foreground max-w-2xl">{project.description}</p>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsCreateTemplateOpen(true)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Запази като шаблон
                    </Button>
                    <Button variant="outline" size="sm" onClick={onEdit}>
                        Редактирай
                    </Button>
                    <Button variant="destructive" size="sm" onClick={onDelete}>
                        Изтрий
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 flex flex-col gap-2">
                    <span className="text-muted-foreground text-xs font-medium uppercase">Период</span>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span>
                            {project.startDate ? format(project.startDate, "d MMM", { locale: bg }) : "Начало"} -{" "}
                            {project.endDate ? format(project.endDate, "d MMM yyyy", { locale: bg }) : "Край"}
                        </span>
                    </div>
                </Card>

                <Card className="p-4 flex flex-col gap-2">
                    <span className="text-muted-foreground text-xs font-medium uppercase">Екип</span>
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-bold">{project.team_members?.length || 0} Членове</span>
                    </div>
                </Card>

                <Card className="p-4 flex flex-col gap-2 col-span-1 md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-muted-foreground text-xs font-medium uppercase">Напредък</span>
                        <span className="text-xs font-bold">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300 ease-in-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" /> {stats?.done || 0} Готови
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-500" /> {stats?.inProgress || 0} В процес
                        </div>
                        <div className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-red-500" /> {stats?.overdue || 0} Закъснели
                        </div>
                    </div>
                </Card>
            </div>
            <CreateProjectTemplateDialog
                open={isCreateTemplateOpen}
                onOpenChange={setIsCreateTemplateOpen}
                initialData={projectWithTasks ? {
                    name: projectWithTasks.name,
                    description: projectWithTasks.description,
                    priority: projectWithTasks.priority,
                    estimatedDuration: projectWithTasks.endDate && projectWithTasks.startDate
                        ? Math.round((projectWithTasks.endDate - projectWithTasks.startDate) / 86400000).toString()
                        : "30",
                    tasks: projectWithTasks.tasks.map(t => ({
                        title: t.title,
                        priority: t.priority,
                        estimatedHours: t.estimatedHours,
                        subtasks: t.subtasks
                    })),
                } : undefined}
            />
        </div>
    );
}
