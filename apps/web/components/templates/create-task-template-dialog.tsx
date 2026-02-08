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
import { Plus, X } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    priority: z.string(),
    estimatedHours: z.string().optional(), // Input as string, convert to number
    category: z.string().optional(),
    isPublic: z.boolean().optional(),
});

interface CreateTaskTemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Partial<z.infer<typeof formSchema>> & { subtasks?: string[] };
}

export function CreateTaskTemplateDialog({ open, onOpenChange, initialData }: CreateTaskTemplateDialogProps) {
    const { t } = useLanguage();
    const createTaskTemplate = useMutation(api.templates.createTaskTemplate);
    const [subtasks, setSubtasks] = useState<string[]>([]);
    const [newSubtask, setNewSubtask] = useState("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            priority: "medium",
            estimatedHours: "",
            category: "",
            isPublic: false,
        },
    });

    useEffect(() => {
        if (open && initialData) {
            form.reset({
                title: initialData.title || "",
                description: initialData.description || "",
                priority: initialData.priority || "medium",
                estimatedHours: initialData.estimatedHours || "",
                category: initialData.category || "",
                isPublic: initialData.isPublic || false,
            });
            if (initialData.subtasks) {
                setSubtasks(initialData.subtasks);
            }
        } else if (open && !initialData) {
            form.reset({
                title: "",
                description: "",
                priority: "medium",
                estimatedHours: "",
                category: "",
                isPublic: false,
            });
            setSubtasks([]);
        }
    }, [open, initialData, form]);

    const handleAddSubtask = () => {
        if (newSubtask.trim()) {
            setSubtasks([...subtasks, newSubtask.trim()]);
            setNewSubtask("");
        }
    };

    const handleRemoveSubtask = (index: number) => {
        setSubtasks(subtasks.filter((_, i) => i !== index));
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const hours = values.estimatedHours ? parseFloat(values.estimatedHours) : undefined;
            await createTaskTemplate({
                title: values.title,
                description: values.description,
                priority: values.priority,
                estimatedHours: isNaN(hours!) ? undefined : hours,
                subtasks: subtasks,
                category: values.category || undefined,
                isPublic: !!values.isPublic,
            });
            toast.success(t("templateCreated"));
            form.reset();
            setSubtasks([]);
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to create template");
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{t("createTaskTemplate")}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("taskTitle")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("taskTitle")} {...field} />
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
                                    <FormLabel>{t("templateDescription")}</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder={t("templateDescription")} {...field} />
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
                                        <FormLabel>{t("templatePriority")}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t("templatePriority")} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="low">{t("low")}</SelectItem>
                                                <SelectItem value="medium">{t("medium")}</SelectItem>
                                                <SelectItem value="high">{t("high")}</SelectItem>
                                                <SelectItem value="critical">{t("critical")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="estimatedHours"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>{t("estHours")}</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.5" placeholder="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("category")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("category")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Subtasks Section */}
                        <div className="space-y-2">
                            <FormLabel>{t("subtasks") || "Subtasks"}</FormLabel>
                            <div className="flex gap-2">
                                <Input
                                    value={newSubtask}
                                    onChange={(e) => setNewSubtask(e.target.value)}
                                    placeholder={t("templateAddSubtask")}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSubtask();
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" size="icon" onClick={handleAddSubtask}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {subtasks.map((sub, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 rounded-md border bg-muted/50 text-sm">
                                        <span>{sub}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleRemoveSubtask(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
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
                                        <FormLabel>
                                            {t("templatePublic")}
                                        </FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                            {t("templatePublicDesc")}
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit">{t("templateCreate")}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
