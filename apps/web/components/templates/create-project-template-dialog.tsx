"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Plus, X, ListTodo, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const taskSchema = z.object({
    title: z.string().min(1, "Task title is required"),
    priority: z.string(),
    estimatedHours: z.number().optional(),
    subtasks: z.array(z.string()).optional(),
});

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    priority: z.string(),
    estimatedDuration: z.string(), // Input as string (days), convert to number
    isPublic: z.boolean().optional(),
});

interface CreateProjectTemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Partial<z.infer<typeof formSchema>> & { tasks?: z.infer<typeof taskSchema>[] };
}

export function CreateProjectTemplateDialog({ open, onOpenChange, initialData }: CreateProjectTemplateDialogProps) {
    const createProjectTemplate = useMutation(api.templates.createProjectTemplate);

    // Task management state
    const [tasks, setTasks] = useState<z.infer<typeof taskSchema>[]>([]);

    // Temporary state for new task being added
    const [newTaskOpen, setNewTaskOpen] = useState(false);
    const [newTask, setNewTask] = useState<Partial<z.infer<typeof taskSchema>>>({
        priority: "medium",
        subtasks: []
    });
    const [newSubtask, setNewSubtask] = useState("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            priority: "medium",
            estimatedDuration: "",
            isPublic: false,
        },
    });

    useEffect(() => {
        if (open && initialData) {
            form.reset({
                name: initialData.name || "",
                description: initialData.description || "",
                priority: initialData.priority || "medium",
                estimatedDuration: initialData.estimatedDuration || "",
                isPublic: initialData.isPublic || false,
            });
            if (initialData.tasks) {
                setTasks(initialData.tasks);
            }
        } else if (open && !initialData) {
            form.reset({
                name: "",
                description: "",
                priority: "medium",
                estimatedDuration: "",
                isPublic: false,
            });
            setTasks([]);
        }
    }, [open, initialData, form]);

    const handleAddTask = () => {
        if (!newTask.title) {
            toast.error("Task title is required");
            return;
        }

        setTasks([...tasks, {
            title: newTask.title,
            priority: newTask.priority || "medium",
            estimatedHours: newTask.estimatedHours,
            subtasks: newTask.subtasks || [],
        }]);

        // Reset new task form
        setNewTask({
            priority: "medium",
            subtasks: []
        });
        setNewTaskOpen(false);
    };

    const removeTask = (index: number) => {
        setTasks(tasks.filter((_, i) => i !== index));
    };

    const addSubtaskToNewTask = () => {
        if (newSubtask.trim()) {
            setNewTask({
                ...newTask,
                subtasks: [...(newTask.subtasks || []), newSubtask.trim()]
            });
            setNewSubtask("");
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            await createProjectTemplate({
                name: values.name,
                description: values.description,
                priority: values.priority,
                estimatedDuration: parseInt(values.estimatedDuration) || 0,
                tasks: tasks,
                isPublic: !!values.isPublic,
            });
            toast.success("Project template created");
            form.reset();
            setTasks([]);
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to create template");
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Project Template</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Project Details */}
                        <div className="space-y-4 border-b pb-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Template Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Project template name" {...field} />
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
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Template description" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex gap-4">
                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel>Default Priority</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select priority" />
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

                                <FormField
                                    control={form.control}
                                    name="estimatedDuration"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel>Est. Duration (Days)</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="1" placeholder="30" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Tasks Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <FormLabel className="text-base">Template Tasks ({tasks.length})</FormLabel>
                                <Button type="button" variant="outline" size="sm" onClick={() => setNewTaskOpen(!newTaskOpen)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Task
                                </Button>
                            </div>

                            {/* Add Task Mini-Form */}
                            {newTaskOpen && (
                                <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <Input
                                                placeholder="Task Title"
                                                value={newTask.title || ""}
                                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                            />
                                        </div>
                                        <Select
                                            value={newTask.priority}
                                            onValueChange={(val) => setNewTask({ ...newTask, priority: val })}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="critical">Critical</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="number"
                                            placeholder="Est. Hours"
                                            value={newTask.estimatedHours || ""}
                                            onChange={(e) => setNewTask({ ...newTask, estimatedHours: parseFloat(e.target.value) })}
                                        />
                                    </div>

                                    {/* Subtasks for new task */}
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Add subtask"
                                                value={newSubtask}
                                                onChange={(e) => setNewSubtask(e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                            <Button type="button" size="sm" variant="ghost" onClick={addSubtaskToNewTask}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {newTask.subtasks?.map((sub, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">
                                                    {sub}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setNewTaskOpen(false)}>Cancel</Button>
                                        <Button type="button" size="sm" onClick={handleAddTask}>Add to Template</Button>
                                    </div>
                                </div>
                            )}

                            {/* Tasks List */}
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {tasks.map((task, index) => (
                                    <Card key={index} className="bg-muted/10">
                                        <CardContent className="p-3 flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 font-medium">
                                                    <ListTodo className="h-4 w-4 text-muted-foreground" />
                                                    {task.title}
                                                    <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'} className="text-[10px] h-5">
                                                        {task.priority}
                                                    </Badge>
                                                </div>
                                                {task.subtasks && task.subtasks.length > 0 && (
                                                    <p className="text-xs text-muted-foreground ml-6">
                                                        {task.subtasks.length} subtasks • {task.estimatedHours || 0}h
                                                    </p>
                                                )}
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeTask(index)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="isPublic"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Make Public</FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                            Visible to all users.
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit">Create Template</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
