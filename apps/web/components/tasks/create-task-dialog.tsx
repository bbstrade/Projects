"use client";

import { useState, useRef, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Tag, X, Paperclip, Upload, FileIcon, Trash2, Loader2, User } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ColorPicker } from "@/components/ui/color-picker";

const formSchema = z.object({
    title: z.string().min(3, "Заглавието трябва да бъде поне 3 символа").max(200),
    description: z.string().max(10000).optional(),
    priority: z.enum(["low", "medium", "high", "critical"]),
    status: z.enum(["todo", "in_progress", "in_review", "done", "blocked"]),
    dueDate: z.date().optional(),
    estimatedHours: z.string().optional(),
    assigneeId: z.string().optional(),
    color: z.string().optional(),
});

interface UploadedFile {
    name: string;
    size: number;
    type: string;
    storageId?: string;
    url?: string;
}

interface CreateTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: Id<"projects">;
    task?: any; // For editing existing task
}

export function CreateTaskDialog({ open, onOpenChange, projectId, task }: CreateTaskDialogProps) {
    const createTask = useMutation(api.tasks.create);
    const updateTask = useMutation(api.tasks.update);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    // Fetch project to get teamId for team members
    const project = useQuery(api.projects.get, { id: projectId });
    const teamMembers = useQuery(
        api.teams.getMembers,
        project?.teamId ? { teamId: project.teamId } : "skip"
    );

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [labels, setLabels] = useState<string[]>([]);
    const [newLabel, setNewLabel] = useState("");
    const [attachments, setAttachments] = useState<UploadedFile[]>([]);

    const isEditing = !!task;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            priority: "medium",
            status: "todo",
            assigneeId: "unassigned",
        },
    });

    // Reset form when dialog opens or task changes
    useEffect(() => {
        if (open) {
            if (task) {
                form.reset({
                    title: task.title || "",
                    description: task.description || "",
                    priority: task.priority || "medium",
                    status: task.status || "todo",
                    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
                    estimatedHours: task.estimatedHours?.toString() || "",
                    assigneeId: task.assigneeId || "unassigned",
                    color: task.color || "",
                });
                setLabels(task.labels || []);
                setAttachments([]);
            } else {
                form.reset({
                    title: "",
                    description: "",
                    priority: "medium",
                    status: "todo",
                    assigneeId: "unassigned",
                });
                setLabels([]);
                setAttachments([]);
            }
        }
    }, [open, task, form]);

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

                const uploadUrl = await generateUploadUrl();
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

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const assigneeId = values.assigneeId === "unassigned" ? undefined : values.assigneeId as Id<"users">;
            const attachmentIds = attachments
                .filter(a => a.storageId)
                .map(a => a.storageId as string);

            if (isEditing) {
                await updateTask({
                    id: task._id,
                    title: values.title,
                    description: values.description,
                    priority: values.priority,
                    status: values.status,
                    assigneeId,
                    dueDate: values.dueDate?.getTime(),
                    estimatedHours: values.estimatedHours ? parseFloat(values.estimatedHours) : undefined,
                    labels,
                    attachments: attachmentIds.length > 0 ? attachmentIds : undefined,
                    color: values.color,
                });
                toast.success("Задачата беше обновена успешно!");
            } else {
                await createTask({
                    title: values.title,
                    description: values.description,
                    projectId: projectId,
                    priority: values.priority,
                    status: values.status,
                    assigneeId,
                    dueDate: values.dueDate?.getTime(),
                    estimatedHours: values.estimatedHours ? parseFloat(values.estimatedHours) : undefined,
                    tags: labels.length > 0 ? labels : undefined,
                    labels,
                    attachments: attachmentIds.length > 0 ? attachmentIds : undefined,
                    color: values.color,
                });
                toast.success("Задачата беше създадена успешно!");
            }
            onOpenChange(false);
            form.reset();
            setLabels([]);
            setAttachments([]);
        } catch (error) {
            toast.error(isEditing ? "Неуспешно обновяване на задача" : "Неуспешно създаване на задача");
            console.error(error);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
            />

            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Редактирай Задача" : "Създай Нова Задача"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Обновете детайлите на задачата" : "Попълнете детайлите за да създадете нова задача"}
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
                                        <Input placeholder="Въведете заглавие на задачата" {...field} />
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
                                            placeholder="Опишете задачата"
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
                                                <SelectItem value="todo">За изпълнение</SelectItem>
                                                <SelectItem value="in_progress">В процес</SelectItem>
                                                <SelectItem value="in_review">В преглед</SelectItem>
                                                <SelectItem value="done">Завършена</SelectItem>
                                                <SelectItem value="blocked">Блокирана</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Assignee Selector */}
                        <FormField
                            control={form.control}
                            name="assigneeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Отговорник</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Изберете отговорник">
                                                    {field.value && field.value !== "unassigned" ? (
                                                        (() => {
                                                            const member = teamMembers?.find(m => m.user?._id === field.value);
                                                            if (member?.user) {
                                                                return (
                                                                    <div className="flex items-center gap-2">
                                                                        <Avatar className="h-5 w-5">
                                                                            <AvatarImage src={member.user.avatar} />
                                                                            <AvatarFallback className="text-[10px]">
                                                                                {member.user.name?.charAt(0) || "?"}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <span>{member.user.name || member.user.email}</span>
                                                                    </div>
                                                                );
                                                            }
                                                            return <span>Няма</span>;
                                                        })()
                                                    ) : (
                                                        <span>Няма</span>
                                                    )}
                                                </SelectValue>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="unassigned">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span>Няма отговорник</span>
                                                </div>
                                            </SelectItem>
                                            {teamMembers?.map((member) => (
                                                member.user && (
                                                    <SelectItem key={member.user._id} value={member.user._id}>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-5 w-5">
                                                                <AvatarImage src={member.user.avatar} />
                                                                <AvatarFallback className="text-[10px]">
                                                                    {member.user.name?.charAt(0) || "?"}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span>{member.user.name || member.user.email}</span>
                                                        </div>
                                                    </SelectItem>
                                                )
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
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Краен Срок</FormLabel>
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
                                name="estimatedHours"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Очаквани Часове</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                {...field}
                                            />
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

                        {/* Color Picker */}
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

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Отказ
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting || isUploading}>
                                {form.formState.isSubmitting ? "Запазване..." : isEditing ? "Обнови Задача" : "Създай Задача"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
