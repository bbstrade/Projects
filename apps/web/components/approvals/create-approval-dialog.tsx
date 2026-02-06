"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
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
import { Plus, FileCheck, Users, CheckCircle2, GripVertical, X, Upload, Loader2, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
    title: z.string().min(3, "Заглавието трябва да бъде поне 3 символа").max(200),
    description: z.string().max(2000).optional(),
    type: z.enum(["document", "decision", "budget", "other"]),
    workflowType: z.enum(["sequential", "parallel"]),
    approverIds: z.array(z.string()).min(1, "Изберете поне един одобряващ"),
    budget: z.coerce.number().optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateApprovalDialogProps {
    trigger?: React.ReactNode;
    projectId?: Id<"projects">;
    taskId?: Id<"tasks">;
}

export function CreateApprovalDialog({ trigger, projectId, taskId }: CreateApprovalDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const createApproval = useMutation(api.approvals.create);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const users = useQuery(api.users.list, {});

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            type: "document",
            workflowType: "sequential",
            approverIds: [],
            priority: "medium",
            budget: undefined,
        },
    });

    async function onSubmit(values: FormValues) {
        try {
            setIsUploading(true);
            let attachments = undefined;

            if (selectedFile) {
                // 1. Get upload URL
                const postUrl = await generateUploadUrl();

                // 2. Upload file
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": selectedFile.type },
                    body: selectedFile,
                });

                if (!result.ok) throw new Error("Upload failed");

                const { storageId } = await result.json();

                attachments = [{
                    name: selectedFile.name,
                    type: selectedFile.type,
                    url: "", // Calculated on backend via getStorageUrl if needed, or we just rely on storageId
                    storageId: storageId as Id<"_storage">,
                    uploadedAt: Date.now(),
                }];
            }

            await createApproval({
                title: values.title,
                description: values.description,
                type: values.type,
                workflowType: values.workflowType,
                approverIds: values.approverIds as Id<"users">[],
                budget: values.budget,
                priority: values.priority,
                projectId,
                taskId,
                attachments,
            });

            toast.success("Заявката за одобрение беше създадена!");
            setOpen(false);
            form.reset();
            setSelectedFile(null);
        } catch (error) {
            toast.error("Неуспешно създаване на заявка");
            console.error(error);
        } finally {
            setIsUploading(false);
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="budget"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Бюджет (лв.)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) => field.onChange(e)}
                                            />
                                        </FormControl>
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Изберете приоритет" />
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

                        {/* File Upload Section */}
                        <div className="space-y-2">
                            <FormLabel>Прикачени файлове</FormLabel>
                            <div className="border-2 border-dashed rounded-lg p-4 hover:bg-muted/50 transition-colors text-center cursor-pointer relative">
                                <Input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setSelectedFile(file);
                                    }}
                                />
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    {selectedFile ? (
                                        <>
                                            <File className="h-8 w-8 text-primary" />
                                            <span className="text-sm font-medium text-foreground">{selectedFile.name}</span>
                                            <span className="text-xs">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-8 w-8" />
                                            <span className="text-sm">Натиснете или провлачете файл тук</span>
                                        </>
                                    )}
                                </div>
                                {selectedFile && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent opening file dialog
                                            e.preventDefault(); // Prevent opening file dialog
                                            // Reset the file input value
                                            // This is tricky with uncontrolled input, but we can just clear state
                                            setSelectedFile(null);
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="approverIds"
                            render={({ field }) => {
                                // Helper to toggle user
                                const toggleUser = (userId: string) => {
                                    const current = field.value || [];
                                    if (current.includes(userId)) {
                                        field.onChange(current.filter((id) => id !== userId));
                                    } else {
                                        field.onChange([...current, userId]);
                                    }
                                };

                                // For Sequential: DND List of SELECTED users
                                const selectedUsers = users?.filter(u => field.value?.includes(u._id)) || [];
                                // Sort selected users based on the order in field.value
                                const sortedSelectedUsers = selectedUsers.sort((a, b) => {
                                    return field.value.indexOf(a._id) - field.value.indexOf(b._id);
                                });

                                const onDragEnd = (result: DropResult) => {
                                    if (!result.destination) return;

                                    const items = Array.from(field.value);
                                    const [reorderedItem] = items.splice(result.source.index, 1);
                                    items.splice(result.destination.index, 0, reorderedItem);

                                    field.onChange(items);
                                };

                                return (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Одобряващи
                                        </FormLabel>
                                        <FormDescription>
                                            {form.watch("workflowType") === "sequential"
                                                ? "Подредете одобрителите в желания ред (Drag & Drop)."
                                                : "Изберете кои потребители трябва да одобрят заявката."}
                                        </FormDescription>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Selection List */}
                                            <div className="border rounded-md p-3">
                                                <h5 className="text-sm font-medium mb-2">Избор на служители</h5>
                                                <ScrollArea className="h-[200px]">
                                                    <div className="space-y-2">
                                                        {users?.map((user) => (
                                                            <div
                                                                key={user._id}
                                                                className="flex items-center space-x-2 p-2 rounded hover:bg-accent cursor-pointer"
                                                                onClick={() => toggleUser(user._id)}
                                                            >
                                                                <Checkbox
                                                                    checked={field.value?.includes(user._id)}
                                                                    onCheckedChange={() => toggleUser(user._id)}
                                                                />
                                                                <div className="text-sm">
                                                                    <div className="font-medium">{user.name}</div>
                                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </div>

                                            {/* Selected/Ordered List */}
                                            <div className="border rounded-md p-3 bg-muted/20">
                                                <h5 className="text-sm font-medium mb-2">Избрани ({field.value?.length || 0})</h5>
                                                {form.watch("workflowType") === "sequential" ? (
                                                    <DragDropContext onDragEnd={onDragEnd}>
                                                        <Droppable droppableId="approvers">
                                                            {(provided) => (
                                                                <div
                                                                    {...provided.droppableProps}
                                                                    ref={provided.innerRef}
                                                                    className="space-y-2 min-h-[100px]"
                                                                >
                                                                    {sortedSelectedUsers.map((user, index) => (
                                                                        <Draggable key={user._id} draggableId={user._id} index={index}>
                                                                            {(provided) => (
                                                                                <div
                                                                                    ref={provided.innerRef}
                                                                                    {...provided.draggableProps}
                                                                                    {...provided.dragHandleProps}
                                                                                    className="flex items-center gap-2 p-2 bg-background border rounded shadow-sm"
                                                                                >
                                                                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                                                    <div className="flex-1 text-sm font-medium">{user.name}</div>
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="h-6 w-6"
                                                                                        onClick={() => toggleUser(user._id)}
                                                                                    >
                                                                                        <X className="h-3 w-3" />
                                                                                    </Button>
                                                                                </div>
                                                                            )}
                                                                        </Draggable>
                                                                    ))}
                                                                    {provided.placeholder}
                                                                </div>
                                                            )}
                                                        </Droppable>
                                                    </DragDropContext>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {sortedSelectedUsers.map((user) => (
                                                            <div key={user._id} className="flex items-center gap-2 p-2 bg-background border rounded">
                                                                <div className="flex-1 text-sm font-medium">{user.name}</div>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6"
                                                                    onClick={() => toggleUser(user._id)}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                        {sortedSelectedUsers.length === 0 && (
                                                            <p className="text-sm text-muted-foreground text-center py-4">Няма избрани</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
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
