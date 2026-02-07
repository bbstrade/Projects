"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useEffect } from "react";
import { format } from "date-fns";
import { FunctionReturnType } from "convex/server";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Doc, Id } from "@/convex/_generated/dataModel";

const formSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    teamId: z.string().min(1, "Team is required"),
    startDate: z.date(),
});

interface UseProjectTemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template?: Doc<"projectTemplates">;
}

export function UseProjectTemplateDialog({ open, onOpenChange, template }: UseProjectTemplateDialogProps) {
    const instantiateTemplate = useMutation(api.templates.instantiateProjectTemplate);
    const teams = useQuery(api.teams.list, { view: "all" });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            teamId: "",
            startDate: new Date(),
        },
    });

    useEffect(() => {
        if (template) {
            form.setValue("name", template.name);
        }
    }, [template, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!template) return;

        try {
            await instantiateTemplate({
                templateId: template._id,
                name: values.name,
                teamId: values.teamId,
                startDate: values.startDate.getTime(),
            });
            toast.success("Project created from template");
            form.reset();
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to create project");
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Project from Template</DialogTitle>
                    <DialogDescription>
                        Create a new project using "{template?.name}" as a starting point.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Project Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="teamId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Team</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a team" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {teams?.map((team) => (
                                                <SelectItem key={team._id} value={team._id}>
                                                    {team.name}
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
                            name="startDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Start Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit">Create Project</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
