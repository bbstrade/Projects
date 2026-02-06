"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, GripVertical, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PriorityManagement() {
    const [selectedType, setSelectedType] = useState<"task" | "project">("task");
    const priorities = useQuery(api.admin.getCustomPriorities, { type: selectedType });
    const managePriority = useMutation(api.admin.manageCustomPriority);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPriority, setEditingPriority] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        label: "",
        slug: "",
        color: "#808080",
        type: "task",
        order: 0,
        isDefault: false,
    });

    const handleOpenDialog = (priority?: any) => {
        if (priority) {
            setEditingPriority(priority);
            setFormData({
                label: priority.label,
                slug: priority.slug,
                color: priority.color,
                type: priority.type,
                order: priority.order,
                isDefault: priority.isDefault,
            });
        } else {
            setEditingPriority(null);
            setFormData({
                label: "",
                slug: "",
                color: "#808080",
                type: selectedType,
                order: priorities ? priorities.length + 1 : 0,
                isDefault: false,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            if (editingPriority) {
                await managePriority({
                    action: "update",
                    id: editingPriority._id,
                    data: formData,
                });
                toast.success("Приоритетът е обновен успешно");
            } else {
                await managePriority({
                    action: "create",
                    data: { ...formData, type: selectedType },
                });
                toast.success("Приоритетът е създаден успешно");
            }
            setIsDialogOpen(false);
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.data?.message || error.message || "Възникна грешка";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: any) => {
        if (!confirm("Сигурни ли сте, че искате да изтриете този приоритет?")) return;
        try {
            await managePriority({ action: "delete", id });
            toast.success("Приоритетът е изтрит");
        } catch (error) {
            toast.error("Грешка при изтриване");
        }
    };

    if (priorities === undefined) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Приоритети</CardTitle>
                    <CardDescription>Управлявайте нивата на приоритизация за задачи и проекти.</CardDescription>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Добави приоритет
                </Button>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4 mb-4">
                    <Button
                        variant={selectedType === "task" ? "default" : "outline"}
                        onClick={() => setSelectedType("task")}
                    >
                        Задачи
                    </Button>
                    <Button
                        variant={selectedType === "project" ? "default" : "outline"}
                        onClick={() => setSelectedType("project")}
                    >
                        Проекти
                    </Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Име</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Цвят</TableHead>
                            <TableHead>Default</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {priorities.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Няма дефинирани приоритети за {selectedType === 'task' ? 'задачи' : 'проекти'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            priorities.sort((a, b) => a.order - b.order).map((priority: any) => (
                                <TableRow key={priority._id}>
                                    <TableCell>
                                        <div className="cursor-move text-muted-foreground">
                                            <GripVertical className="h-4 w-4" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" style={{ color: priority.color }} />
                                            {priority.label}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{priority.slug}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded-full border border-border"
                                                style={{ backgroundColor: priority.color }}
                                            />
                                            <span className="text-xs text-muted-foreground">{priority.color}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {priority.isDefault && <Badge variant="secondary">Default</Badge>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(priority)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(priority._id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingPriority ? "Редактиране на приоритет" : "Нов приоритет"} ({selectedType === 'task' ? 'Задача' : 'Проект'})</DialogTitle>
                        <DialogDescription>
                            Дефинирайте цветове и етикети за приоритет.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="label" className="text-right">
                                Име
                            </Label>
                            <Input
                                id="label"
                                value={formData.label}
                                onChange={(e) => setFormData({ ...formData, label: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                className="col-span-3"
                                placeholder="Example: High"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="slug" className="text-right">
                                Slug
                            </Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                className="col-span-3"
                                placeholder="high"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="color" className="text-right">
                                Цвят
                            </Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <Input
                                    id="color"
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="w-12 h-10 p-1 px-2"
                                />
                                <Input
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="order" className="text-right">
                                Подредба
                            </Label>
                            <Input
                                id="order"
                                type="number"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="default" className="text-right">
                                По подразбиране
                            </Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <Switch
                                    id="default"
                                    checked={formData.isDefault}
                                    onCheckedChange={(c) => setFormData({ ...formData, isDefault: c })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Отказ</Button>
                        <Button onClick={handleSubmit} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingPriority ? "Запази" : "Създай"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
