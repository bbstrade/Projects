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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";
import { Loader2, Plus, Pencil, Trash2, GripVertical, Lock, History } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StatusManagement({ teamId }: { teamId?: string }) {
    const { t } = useLanguage();
    const [selectedType, setSelectedType] = useState<"task" | "project">("task");
    const statuses = useQuery(api.admin.getCustomStatuses, { type: selectedType, teamId: teamId || undefined });
    const manageStatus = useMutation(api.admin.manageCustomStatus);
    const initializeDefaults = useMutation(api.admin.initializeDefaults);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingStatus, setEditingStatus] = useState<any>(null);
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

    const handleOpenDialog = (status?: any) => {
        if (status) {
            setEditingStatus(status);
            setFormData({
                label: status.label,
                slug: status.slug,
                color: status.color,
                type: status.type,
                order: status.order,
                isDefault: status.isDefault,
            });
        } else {
            setEditingStatus(null);
            setFormData({
                label: "",
                slug: "",
                color: "#808080",
                type: selectedType,
                order: statuses ? statuses.length + 1 : 0,
                isDefault: false,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            if (editingStatus) {
                // Check if editing global status while in team view
                if (teamId && !editingStatus.teamId) {
                    toast.error(t("cannotEditGlobalStatus"));
                    setIsLoading(false);
                    return;
                }

                await manageStatus({
                    action: "update",
                    id: editingStatus._id,
                    data: { ...formData, teamId: editingStatus.teamId },
                });
                toast.success(t("statusUpdatedMsg"));
            } else {
                await manageStatus({
                    action: "create",
                    data: { ...formData, type: selectedType, teamId: teamId || undefined },
                });
                toast.success(t("statusCreated"));
            }
            setIsDialogOpen(false);
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.data?.message || error.message || "Error";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (status: any) => {
        if (teamId && !status.teamId) {
            toast.error(t("cannotDeleteGlobalStatus"));
            return;
        }
        if (!confirm(t("deleteStatusConfirm"))) return;
        try {
            await manageStatus({ action: "delete", id: status._id });
            toast.success(t("statusDeleted"));
        } catch (error) {
            toast.error(t("deleteError"));
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{t("statuses")}</CardTitle>
                    <CardDescription>{t("statusesDesc")}</CardDescription>
                </div>
                <div className="flex gap-2">
                    {!teamId && (
                        <Button
                            variant="outline"
                            onClick={async () => {
                                setIsLoading(true);
                                try {
                                    await initializeDefaults();
                                    toast.success(t("defaultsInitialized"));
                                } catch (error) {
                                    toast.error(t("errorInitializing"));
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <History className="mr-2 h-4 w-4" />}
                            {t("initializeDefaults")}
                        </Button>
                    )}
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("addStatus")}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4 mb-4">
                    <Button
                        variant={selectedType === "task" ? "default" : "outline"}
                        onClick={() => setSelectedType("task")}
                    >
                        {t("tabTasks")}
                    </Button>
                    <Button
                        variant={selectedType === "project" ? "default" : "outline"}
                        onClick={() => setSelectedType("project")}
                    >
                        {t("tabProjects")}
                    </Button>
                </div>

                {statuses === undefined ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>{t("startStatusName")}</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>{t("color")}</TableHead>
                                <TableHead>{t("default")}</TableHead>
                                <TableHead className="text-right">{t("actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {statuses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        {t("noStatuses")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                statuses.sort((a, b) => a.order - b.order).map((status: any) => (
                                    <TableRow key={status._id}>
                                        <TableCell>
                                            <div className="cursor-move text-muted-foreground">
                                                <GripVertical className="h-4 w-4" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {status.label}
                                                {status.teamId ? (
                                                    <Badge variant="outline" className="text-[10px]">{t("team")}</Badge>
                                                ) : teamId ? (
                                                    <Badge variant="secondary" className="text-[10px]">{t("global")}</Badge>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{status.slug}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-4 h-4 rounded-full border border-border"
                                                    style={{ backgroundColor: status.color }}
                                                />
                                                <span className="text-xs text-muted-foreground">{status.color}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {status.isDefault && <Badge variant="secondary">{t("default")}</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDialog(status)}
                                                    disabled={teamId && !status.teamId ? true : false}
                                                >
                                                    {teamId && !status.teamId ? <Lock className="h-4 w-4 opacity-50" /> : <Pencil className="h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600"
                                                    onClick={() => handleDelete(status)}
                                                    disabled={teamId && !status.teamId ? true : false}
                                                >
                                                    {teamId && !status.teamId ? <Lock className="h-4 w-4 opacity-50" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingStatus ? t("editStatus") : t("newStatus")} ({selectedType === 'task' ? t("tabTasks") : t("tabProjects")})</DialogTitle>
                        <DialogDescription>
                            {t("defineStatusParams")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="label" className="text-right">
                                {t("startStatusName")}
                            </Label>
                            <Input
                                id="label"
                                value={formData.label}
                                onChange={(e) => setFormData({ ...formData, label: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                className="col-span-3"
                                placeholder="Example: In Progress"
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
                                placeholder="in_progress"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="color" className="text-right">
                                {t("color")}
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
                                {t("order")}
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
                                {t("default")}
                            </Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <Switch
                                    id="default"
                                    checked={formData.isDefault}
                                    onCheckedChange={(c) => setFormData({ ...formData, isDefault: c })}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {t("defaultStatusHelp")}
                                </span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t("cancel")}</Button>
                        <Button onClick={handleSubmit} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingStatus ? t("save") : t("templateCreate")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
