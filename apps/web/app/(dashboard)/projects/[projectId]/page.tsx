"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectHeader } from "@/components/projects/project-header";
import { ProjectTasks } from "@/components/projects/project-tasks";
import { ProjectTeam } from "@/components/projects/project-team";
import { ProjectGuests } from "@/components/projects/project-guests";
import { ProjectComments } from "@/components/projects/project-comments";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export default function ProjectDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as Id<"projects">;

    const project = useQuery(api.projects.get, { id: projectId });
    const stats = useQuery(api.projects.getStats, { projectId });
    const deleteProject = useMutation(api.projects.remove);

    const { t } = useLanguage();

    const [isEditing, setIsEditing] = useState(false);

    if (project === undefined) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (project === null) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <h2 className="text-xl font-semibold">{t("projectNotFound")}</h2>
                <button onClick={() => router.push("/projects")} className="text-blue-500 hover:underline">
                    {t("toAllProjects")}
                </button>
            </div>
        );
    }

    const handleDelete = async () => {
        if (confirm(t("deleteConfirm"))) {
            try {
                await deleteProject({ id: projectId });
                toast.success(t("projectDeleted"));
                router.push("/projects");
            } catch (error) {
                toast.error(t("deleteError"));
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 min-h-screen">
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-[1600px] mx-auto">
                    <button
                        onClick={() => router.push("/projects")}
                        className="mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {t("backToProjects")}
                    </button>

                    <ProjectHeader
                        project={project}
                        stats={stats}
                        onEdit={() => setIsEditing(true)}
                        onDelete={handleDelete}
                    />

                    <Tabs defaultValue="tasks" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="tasks">{t("tabTasks")}</TabsTrigger>
                            <TabsTrigger value="team">{t("tabTeam")}</TabsTrigger>
                            <TabsTrigger value="guests">{t("tabGuests")}</TabsTrigger>
                            <TabsTrigger value="comments">{t("tabComments")}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="tasks" className="space-y-4">
                            <ProjectTasks projectId={projectId} />
                        </TabsContent>

                        <TabsContent value="team" className="space-y-4">
                            <ProjectTeam projectId={projectId} />
                        </TabsContent>

                        <TabsContent value="guests" className="space-y-4">
                            <ProjectGuests projectId={projectId} />
                        </TabsContent>

                        <TabsContent value="comments" className="space-y-4">
                            <ProjectComments projectId={projectId} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <EditProjectDialog
                open={isEditing}
                onOpenChange={setIsEditing}
                project={project}
            />
        </div>
    );
}
