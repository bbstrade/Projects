"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Layout, ListTodo, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CreateProjectTemplateDialog } from "./create-project-template-dialog";
import { CreateTaskTemplateDialog } from "./create-task-template-dialog";
import { UseProjectTemplateDialog } from "./use-project-template-dialog";
import { UseTaskTemplateDialog } from "./use-task-template-dialog";
import { Doc } from "@/convex/_generated/dataModel";

export function TemplateManager() {
    const projectTemplates = useQuery(api.templates.listProjectTemplates);
    const taskTemplates = useQuery(api.templates.listTaskTemplates);

    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [selectedProjectTemplate, setSelectedProjectTemplate] = useState<Doc<"projectTemplates"> | undefined>(undefined);
    const [selectedTaskTemplate, setSelectedTaskTemplate] = useState<Doc<"taskTemplates"> | undefined>(undefined);

    return (
        <Card className="h-full border-none shadow-none">
            <CardHeader className="px-0 pt-0">
                <CardTitle>Templates</CardTitle>
                <CardDescription>
                    Manage templates for quick project and task creation.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue="projects" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="projects" className="gap-2">
                            <Layout className="h-4 w-4" />
                            Project Templates
                        </TabsTrigger>
                        <TabsTrigger value="tasks" className="gap-2">
                            <ListTodo className="h-4 w-4" />
                            Task Templates
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="projects" className="space-y-4">
                        <div className="flex justify-end">
                            <Button onClick={() => setIsCreateProjectOpen(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                New Project Template
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projectTemplates === undefined ? (
                                <div className="col-span-full py-8 text-center text-muted-foreground">Loading...</div>
                            ) : projectTemplates.length === 0 ? (
                                <div className="col-span-full py-12 text-center border rounded-lg border-dashed">
                                    <p className="text-muted-foreground">No project templates found</p>
                                    <Button variant="link" onClick={() => setIsCreateProjectOpen(true)}>Create the first one</Button>
                                </div>
                            ) : (
                                projectTemplates.map((template) => (
                                    <Card key={template._id} className="overflow-hidden hover:border-primary/50 transition-colors">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                                <Badge variant={template.priority === "high" ? "destructive" : "secondary"}>
                                                    {template.priority}
                                                </Badge>
                                            </div>
                                            <CardDescription className="line-clamp-2 min-h-[40px]">
                                                {template.description || "No description"}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Layout className="h-3 w-3" />
                                                    <span>{template.tasks.length} Tasks</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{template.estimatedDuration} Days Duration</span>
                                                </div>
                                            </div>
                                            <Button
                                                className="w-full"
                                                variant="outline"
                                                onClick={() => setSelectedProjectTemplate(template)}
                                            >
                                                Use Template
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="tasks" className="space-y-4">
                        <div className="flex justify-end">
                            <Button onClick={() => setIsCreateTaskOpen(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                New Task Template
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {taskTemplates === undefined ? (
                                <div className="col-span-full py-8 text-center text-muted-foreground">Loading...</div>
                            ) : taskTemplates.length === 0 ? (
                                <div className="col-span-full py-12 text-center border rounded-lg border-dashed">
                                    <p className="text-muted-foreground">No task templates found</p>
                                    <Button variant="link" onClick={() => setIsCreateTaskOpen(true)}>Create the first one</Button>
                                </div>
                            ) : (
                                taskTemplates.map((template) => (
                                    <Card key={template._id} className="overflow-hidden hover:border-primary/50 transition-colors">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg">{template.title}</CardTitle>
                                                <Badge variant={template.priority === "high" ? "destructive" : "secondary"}>
                                                    {template.priority}
                                                </Badge>
                                            </div>
                                            <CardDescription className="line-clamp-2">
                                                {template.description || "No description"}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
                                                {template.estimatedHours && (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{template.estimatedHours} Hours</span>
                                                    </div>
                                                )}
                                                {template.category && (
                                                    <Badge variant="outline" className="w-fit">{template.category}</Badge>
                                                )}
                                            </div>
                                            <Button
                                                className="w-full"
                                                variant="outline"
                                                onClick={() => setSelectedTaskTemplate(template)}
                                            >
                                                Use Template
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>

            <CreateProjectTemplateDialog
                open={isCreateProjectOpen}
                onOpenChange={setIsCreateProjectOpen}
            />

            <CreateTaskTemplateDialog
                open={isCreateTaskOpen}
                onOpenChange={setIsCreateTaskOpen}
            />

            <UseProjectTemplateDialog
                open={!!selectedProjectTemplate}
                onOpenChange={(open) => !open && setSelectedProjectTemplate(undefined)}
                template={selectedProjectTemplate}
            />

            <UseTaskTemplateDialog
                open={!!selectedTaskTemplate}
                onOpenChange={(open) => !open && setSelectedTaskTemplate(undefined)}
                template={selectedTaskTemplate}
            />
        </Card>
    );
}
