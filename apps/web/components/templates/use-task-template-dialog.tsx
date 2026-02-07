"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Doc, Id } from "@/convex/_generated/dataModel";

const formSchema = z.object({
    projectId: z.string().min(1, "Project is required"),
    status: z.string().optional(),
});

interface UseTaskTemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template?: Doc<"taskTemplates">;
}

export function UseTaskTemplateDialog({ open, onOpenChange, template }: UseTaskTemplateDialogProps) {
    const instantiateTemplate = useMutation(api.templates.instantiateTaskTemplate);
    const projects = useQuery(api.projects.list);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            projectId: "",
            status: "todo",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!template) return;

        try {
            await instantiateTemplate({
                templateId: template._id,
                projectId: values.projectId as Id<"projects">,
                status: values.status,
            });
            toast.success("Task created from template");
            form.reset();
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to create task");
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Task from Template</DialogTitle>
                    <DialogDescription>
                        Create a new task using "{template?.title}" as a starting point.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="projectId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a project" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {projects?.map((project) => (
                                                <SelectItem key={project._id} value={project._id}>
                                                    {project.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Initial Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="todo">To Do</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="done">Done</SelectItem>
                                            <SelectItem value="canceled">Canceled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit">Create Task</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
