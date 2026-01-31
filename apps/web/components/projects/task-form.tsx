"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";

const taskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.optional(z.string()),
    status: z.string(),
    priority: z.string(),
    assigneeId: z.optional(z.string()),
    estimatedHours: z.optional(z.coerce.number()),
    dueDate: z.optional(z.string()), // Handle as string from input type="date"
});

interface TaskFormProps {
    projectId: Id<"projects">;
    task?: any; // If provided, edit mode
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function TaskForm({ projectId, task, trigger, open: controlledOpen, onOpenChange }: TaskFormProps) {
    const [open, setOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : open;
    const onOpenChangeHandler = isControlled ? onOpenChange : setOpen;

    const createTask = useMutation(api.tasks.create);
    const updateTask = useMutation(api.tasks.update);
    const users = useQuery(api.users.list);

    type TaskFormValues = z.infer<typeof taskSchema>;

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema) as any,
        defaultValues: {
            title: task?.title || "",
            description: task?.description || "",
            status: task?.status || "todo",
            priority: task?.priority || "medium",
            assigneeId: task?.assigneeId || "unassigned",
            estimatedHours: (task?.estimatedHours ? Number(task.estimatedHours) : undefined) as number | undefined,
            dueDate: (task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : undefined) as string | undefined,
        },
    });

    // Reset form when task changes or dialog opens
    useEffect(() => {
        if (task) {
            form.reset({
                title: task.title,
                description: task.description || "",
                status: task.status,
                priority: task.priority,
                assigneeId: task.assigneeId || "unassigned",
                estimatedHours: task.estimatedHours,
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : undefined,
            });
        }
    }, [task, form, isOpen]);

    async function onSubmit(values: TaskFormValues) {
        try {
            const dueDate = values.dueDate ? new Date(values.dueDate).getTime() : undefined;
            const assigneeId = values.assigneeId === "unassigned" ? undefined : values.assigneeId as Id<"users">;

            if (task) {
                await updateTask({
                    id: task._id,
                    title: values.title,
                    description: values.description,
                    status: values.status,
                    priority: values.priority,
                    assigneeId,
                    estimatedHours: values.estimatedHours,
                    dueDate,
                });
                toast.success("Task updated");
            } else {
                await createTask({
                    projectId,
                    title: values.title,
                    description: values.description,
                    status: values.status,
                    priority: values.priority,
                    assigneeId,
                    estimatedHours: values.estimatedHours,
                    dueDate,
                });
                toast.success("Task created");
            }
            form.reset();
            onOpenChangeHandler?.(false);
        } catch (error) {
            toast.error("Failed to save task");
            console.error(error);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChangeHandler}>
            {trigger ? (
                <DialogTrigger asChild>{trigger}</DialogTrigger>
            ) : (
                !isControlled && <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Task</Button></DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
                    <DialogDescription>
                        {task ? "Update task details." : "Add a new task to your project."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Task title" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="todo">To Do</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="in_review">In Review</SelectItem>
                                                <SelectItem value="done">Done</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Priority</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Priority" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="critical">Critical</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="assigneeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Assignee</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select assignee" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {users?.map((user) => (
                                                <SelectItem key={user._id} value={user._id}>
                                                    {user.name || user.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="estimatedHours"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estimated Hours</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Due Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Task details..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit">{task ? "Update" : "Create"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
