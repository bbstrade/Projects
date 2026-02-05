"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ColorPicker } from "@/components/ui/color-picker";

const formSchema = z.object({
    name: z.string().min(3, "Името трябва да бъде поне 3 символа").max(100),
    description: z.string().max(5000).optional(),
    priority: z.enum(["low", "medium", "high", "critical"]),
    status: z.enum(["active", "draft", "completed", "review", "in_progress"]).optional(), // Added status
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    color: z.string().optional(),
}).refine(
    (data) => !data.endDate || !data.startDate || data.endDate >= data.startDate,
    { message: "Крайният срок трябва да е след началната дата", path: ["endDate"] }
);

interface EditProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: {
        _id: Id<"projects">;
        name: string;
        description?: string;
        priority?: string;
        status?: string;
        startDate?: number;
        endDate?: number;
        color?: string;
    } | null;
}

export function EditProjectDialog({ open, onOpenChange, project }: EditProjectDialogProps) {
    const updateProject = useMutation(api.projects.update);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            priority: "medium",
            status: "active",
            color: "#3b82f6",
        },
    });

    // Reset form when project changes
    useEffect(() => {
        if (project) {
            form.reset({
                name: project.name,
                description: project.description || "",
                // @ts-ignore
                priority: (project.priority?.toLowerCase() as any) || "medium",
                // @ts-ignore - mapping might be needed if values differ
                status: (project.status as any) || "active",
                startDate: project.startDate ? new Date(project.startDate) : undefined,
                endDate: project.endDate ? new Date(project.endDate) : undefined,
                color: project.color || "#3b82f6",
            });
        }
    }, [project, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!project) return;

        try {
            await updateProject({
                id: project._id,
                name: values.name,
                description: values.description,
                priority: values.priority,
                status: values.status,
                startDate: values.startDate?.getTime(),
                endDate: values.endDate?.getTime(),
                color: values.color,
            });

            toast.success("Проектът беше обновен успешно!");
            onOpenChange(false);
        } catch (error) {
            toast.error("Неуспешно обновяване на проект");
            console.error(error);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Редактирай Проект</DialogTitle>
                    <DialogDescription>
                        Променете детайлите на проекта
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Име на проекта</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Въведете име на проекта" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Описание</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Опишете вашия проект"
                                            className="resize-none"
                                            rows={4}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Приоритет</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Изберете приоритет" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="low">Нисък</SelectItem>
                                                <SelectItem value="medium">Среден</SelectItem>
                                                <SelectItem value="high">Висок</SelectItem>
                                                <SelectItem value="critical">Критичен</SelectItem>
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
                                        <FormLabel>Статус</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Изберете статус" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="active">Активен</SelectItem>
                                                <SelectItem value="draft">Чернова</SelectItem>
                                                <SelectItem value="completed">Завършен</SelectItem>
                                                <SelectItem value="in_progress">В процес</SelectItem>
                                                <SelectItem value="review">Преглед</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Цвят</FormLabel>
                                    <FormControl>
                                        <ColorPicker
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Начална Дата</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Изберете дата</span>
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
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Крайна Дата</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Изберете дата</span>
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
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Отказ
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? "Запазване..." : "Запази промените"}
                            </Button>
                        </DialogFooter>
                    </form >
                </Form >
            </DialogContent >
        </Dialog >
    );
}
