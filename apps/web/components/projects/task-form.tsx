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
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { Plus, Tag, X, Paperclip, Upload, FileIcon, Trash2, Loader2 } from "lucide-react";

const taskSchema = z.object({
    title: z.string().min(1, "Заглавието е задължително"),
    description: z.optional(z.string()),
    status: z.string(),
    priority: z.string(),
    assigneeId: z.optional(z.string()),
    estimatedHours: z.optional(z.coerce.number()),
    dueDate: z.optional(z.string()),
});

interface TaskFormProps {
    projectId: Id<"projects">;
    task?: any;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

interface UploadedFile {
    name: string;
    size: number;
    type: string;
    storageId?: string;
    url?: string;
}

export function TaskForm({ projectId, task, trigger, open: controlledOpen, onOpenChange }: TaskFormProps) {
    const [open, setOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : open;
    const onOpenChangeHandler = isControlled ? onOpenChange : setOpen;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const createTask = useMutation(api.tasks.create);
    const updateTask = useMutation(api.tasks.update);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const users = useQuery(api.users.list);

    // Local state for labels and attachments
    const [labels, setLabels] = useState<string[]>([]);
    const [newLabel, setNewLabel] = useState("");
    const [attachments, setAttachments] = useState<UploadedFile[]>([]);

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
            setLabels(task.labels || []);
            // TODO: Load existing attachments
        }
    }, [task, form, isOpen]);

    const handleAddLabel = () => {
        const trimmed = newLabel.trim();
        if (trimmed && !labels.includes(trimmed)) {
            setLabels([...labels, trimmed]);
            setNewLabel("");
        }
    };

    const handleRemoveLabel = (label: string) => {
        setLabels(labels.filter(l => l !== label));
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const newAttachments: UploadedFile[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (file.size > 10 * 1024 * 1024) {
                    toast.error(`Файлът "${file.name}" е по-голям от 10MB`);
                    continue;
                }

                // Get upload URL
                const uploadUrl = await generateUploadUrl();

                // Upload file
                const result = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": file.type },
                    body: file,
                });

                if (!result.ok) {
                    toast.error(`Грешка при качване на ${file.name}`);
                    continue;
                }

                const { storageId } = await result.json();

                newAttachments.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    storageId,
                });
            }

            setAttachments([...attachments, ...newAttachments]);
            if (newAttachments.length > 0) {
                toast.success(`Качен${newAttachments.length > 1 ? 'и' : ''} ${newAttachments.length} файл${newAttachments.length > 1 ? 'а' : ''}`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Грешка при качване на файлове");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemoveAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    async function onSubmit(values: TaskFormValues) {
        try {
            const dueDate = values.dueDate ? new Date(values.dueDate).getTime() : undefined;
            const assigneeId = values.assigneeId === "unassigned" ? undefined : values.assigneeId as Id<"users">;

            // Prepare attachment storage IDs
            const attachmentIds = attachments
                .filter(a => a.storageId)
                .map(a => a.storageId as string);

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
                    labels,
                    attachments: attachmentIds,
                });
                toast.success("Задачата е обновена");
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
                    labels,
                    attachments: attachmentIds,
                });
                toast.success("Задачата е създадена");
            }
            form.reset();
            setLabels([]);
            setAttachments([]);
            onOpenChangeHandler?.(false);
        } catch (error) {
            toast.error("Грешка при запазване на задачата");
            console.error(error);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChangeHandler}>
            {trigger ? (
                <DialogTrigger asChild>{trigger}</DialogTrigger>
            ) : (
                !isControlled && <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Нова задача</Button></DialogTrigger>
            )}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
            />

            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{task ? "Редактиране на задача" : "Създаване на нова задача"}</DialogTitle>
                    <DialogDescription>
                        {task ? "Обновяване на детайлите за задачата." : "Добавете нова задача към проекта."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Заглавие *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Заглавие на задачата" {...field} />
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
                                        <FormLabel>Статус</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Статус" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="todo">За правене</SelectItem>
                                                <SelectItem value="in_progress">В процес</SelectItem>
                                                <SelectItem value="in_review">Преглед</SelectItem>
                                                <SelectItem value="done">Готово</SelectItem>
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
                                        <FormLabel>Приоритет</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Приоритет" />
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
                        </div>

                        <FormField
                            control={form.control}
                            name="assigneeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Отговорник</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Избери отговорник" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Няма</SelectItem>
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
                                        <FormLabel>Очаквани часове</FormLabel>
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
                                        <FormLabel>Краен срок</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Labels Section */}
                        <div className="space-y-2">
                            <FormLabel>Етикети ({labels.length})</FormLabel>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Добави етикет..."
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddLabel();
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" size="icon" onClick={handleAddLabel}>
                                    <Tag className="h-4 w-4" />
                                </Button>
                            </div>
                            {labels.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {labels.map((label) => (
                                        <Badge key={label} variant="secondary" className="flex items-center gap-1">
                                            <Tag className="h-3 w-3" />
                                            {label}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveLabel(label)}
                                                className="ml-1 hover:text-destructive"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Attachments Section */}
                        <div className="space-y-2">
                            <FormLabel>Прикачени файлове ({attachments.length})</FormLabel>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start gap-2"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="h-4 w-4" />
                                )}
                                {isUploading ? "Качване..." : "Качи файлове (макс. 10MB)"}
                            </Button>

                            {attachments.length > 0 && (
                                <div className="space-y-2 mt-2">
                                    {attachments.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-2 border rounded-md bg-muted/30"
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                                <span className="text-sm truncate">{file.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({formatFileSize(file.size)})
                                                </span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => handleRemoveAttachment(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Описание</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Детайли за задачата..." rows={4} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChangeHandler?.(false)}>
                                Отказ
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting || isUploading}>
                                {form.formState.isSubmitting ? "Запазване..." : task ? "Обнови" : "Създай"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
