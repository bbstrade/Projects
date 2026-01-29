"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, FileCheck, Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
    title: z.string().min(3, "Заглавието трябва да бъде поне 3 символа").max(200),
    description: z.string().max(2000).optional(),
    type: z.enum(["document", "decision", "budget", "other"]),
    workflowType: z.enum(["sequential", "parallel"]),
    approverIds: z.array(z.string()).min(1, "Изберете поне един одобряващ"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateApprovalDialogProps {
    trigger?: React.ReactNode;
    projectId?: Id<"projects">;
    taskId?: Id<"tasks">;
}

export function CreateApprovalDialog({ trigger, projectId, taskId }: CreateApprovalDialogProps) {
    const [open, setOpen] = useState(false);
    const createApproval = useMutation(api.approvals.create);
    const users = useQuery(api.users.list, {});

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            type: "document",
            workflowType: "sequential",
            approverIds: [],
        },
    });

    async function onSubmit(values: FormValues) {
        try {
            // For now, use first user as requester (in real app, use authenticated user)
            const firstUser = users?.[0];
            if (!firstUser) {
                toast.error("Няма регистрирани потребители");
                return;
            }

            await createApproval({
                title: values.title,
                description: values.description,
                type: values.type,
                workflowType: values.workflowType,
                approverIds: values.approverIds as Id<"users">[],
                requesterId: firstUser._id,
                projectId,
                taskId,
            });

            toast.success("Заявката за одобрение беше създадена!");
            setOpen(false);
            form.reset();
        } catch (error) {
            toast.error("Неуспешно създаване на заявка");
            console.error(error);
        }
    }

    const typeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
        document: { label: "Документ", icon: <FileCheck className="h-4 w-4" /> },
        decision: { label: "Решение", icon: <CheckCircle2 className="h-4 w-4" /> },
        budget: { label: "Бюджет", icon: <FileCheck className="h-4 w-4" /> },
        other: { label: "Друго", icon: <FileCheck className="h-4 w-4" /> },
    };

    const workflowLabels = {
        sequential: "Последователно (един по един)",
        parallel: "Паралелно (всички едновременно)",
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Ново Одобрение
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Създай Заявка за Одобрение</DialogTitle>
                    <DialogDescription>
                        Попълнете детайлите и изберете одобряващите лица
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Заглавие</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Въведете заглавие на заявката" {...field} />
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
                                            placeholder="Опишете какво трябва да бъде одобрено"
                                            className="resize-none"
                                            rows={3}
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
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Тип</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Изберете тип" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="document">📄 Документ</SelectItem>
                                                <SelectItem value="decision">✅ Решение</SelectItem>
                                                <SelectItem value="budget">💰 Бюджет</SelectItem>
                                                <SelectItem value="other">📋 Друго</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="workflowType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Работен процес</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Изберете процес" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="sequential">Последователно</SelectItem>
                                                <SelectItem value="parallel">Паралелно</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-xs">
                                            {field.value === "sequential"
                                                ? "Един по един"
                                                : "Всички едновременно"}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="approverIds"
                            render={() => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Одобряващи
                                    </FormLabel>
                                    <FormDescription>
                                        Изберете кои потребители трябва да одобрят заявката
                                    </FormDescription>
                                    <ScrollArea className="h-[150px] rounded-md border p-3">
                                        {users === undefined ? (
                                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                                Зареждане...
                                            </div>
                                        ) : users.length === 0 ? (
                                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                                Няма регистрирани потребители
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {users.map((user) => (
                                                    <FormField
                                                        key={user._id}
                                                        control={form.control}
                                                        name="approverIds"
                                                        render={({ field }) => (
                                                            <FormItem
                                                                key={user._id}
                                                                className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 hover:bg-accent transition-colors"
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(user._id)}
                                                                        onCheckedChange={(checked) => {
                                                                            return checked
                                                                                ? field.onChange([...field.value, user._id])
                                                                                : field.onChange(
                                                                                    field.value?.filter(
                                                                                        (value) => value !== user._id
                                                                                    )
                                                                                );
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <div className="flex-1 leading-none">
                                                                    <span className="font-medium">{user.name}</span>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {user.email}
                                                                    </p>
                                                                </div>
                                                            </FormItem>
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Отказ
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? "Създаване..." : "Създай Заявка"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
