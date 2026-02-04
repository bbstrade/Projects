"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NotificationsTab() {
    const preferences = useQuery(api.settings.getNotificationPreferences);
    const updatePreferences = useMutation(api.settings.updateNotificationPreferences);

    // Local state for optimistic updates / form handling
    // We initialize with defaults if data is loading or missing (handled in useEffect usually, or just derive from data)
    // Actually, simpler to just use the data directly if we want instant save, or local state for "Save" button pattern.
    // The requirement says "Workflow: ... 5. Alert success", implying a Save button.

    const [formData, setFormData] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (preferences) {
            setFormData(preferences);
        } else if (preferences === null) {
            // Defaults if not found (though backend query returns null if not found, we might want to show defaults)
            setFormData({
                task_assigned: true,
                deadline_reminder: true,
                deadline_reminder_days: 1,
                status_change: true,
                task_completed: true,
                priority_change: true,
                project_status_change: true,
                project_member_added: true,
                mention_in_comment: true,
                new_comment: false,
            });
        }
    }, [preferences]);

    const handleSwitchChange = (key: string, value: boolean) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleNumberChange = (key: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [key]: parseInt(value) || 0 }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updatePreferences({
                ...formData,
                deadline_reminder_days: Number(formData.deadline_reminder_days)
            });
            toast.success("Настройките за известия са запазени");
        } catch (error) {
            console.error(error);
            toast.error("Грешка при запазване");
        } finally {
            setIsSaving(false);
        }
    };

    if (preferences === undefined && !formData) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Настройки за известия</CardTitle>
                <CardDescription>Изберете какви известия искате да получавате</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

                {/* Tasks */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Задачи</h3>
                    <div className="grid gap-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="task_assigned" className="flex flex-col gap-1">
                                <span>Назначена задача</span>
                                <span className="font-normal text-xs text-muted-foreground">Когато ви бъде назначена нова задача</span>
                            </Label>
                            <Switch
                                id="task_assigned"
                                checked={formData?.task_assigned}
                                onCheckedChange={(v) => handleSwitchChange("task_assigned", v)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="status_change" className="flex flex-col gap-1">
                                <span>Промяна на статус</span>
                                <span className="font-normal text-xs text-muted-foreground">Когато статусът на ваша задача се промени</span>
                            </Label>
                            <Switch
                                id="status_change"
                                checked={formData?.status_change}
                                onCheckedChange={(v) => handleSwitchChange("status_change", v)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="task_completed" className="flex flex-col gap-1">
                                <span>Завършена задача</span>
                                <span className="font-normal text-xs text-muted-foreground">Когато задача, която следите, е завършена</span>
                            </Label>
                            <Switch
                                id="task_completed"
                                checked={formData?.task_completed}
                                onCheckedChange={(v) => handleSwitchChange("task_completed", v)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="priority_change" className="flex flex-col gap-1">
                                <span>Промяна на приоритет</span>
                            </Label>
                            <Switch
                                id="priority_change"
                                checked={formData?.priority_change}
                                onCheckedChange={(v) => handleSwitchChange("priority_change", v)}
                            />
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="deadline_reminder" className="flex flex-col gap-1">
                                    <span>Напомняне за краен срок</span>
                                </Label>
                                <Switch
                                    id="deadline_reminder"
                                    checked={formData?.deadline_reminder}
                                    onCheckedChange={(v) => handleSwitchChange("deadline_reminder", v)}
                                />
                            </div>
                            {formData?.deadline_reminder && (
                                <div className="ml-0 pl-0 md:ml-0 flex items-center gap-3">
                                    <Label htmlFor="deadline_days" className="text-sm text-muted-foreground whitespace-nowrap">
                                        Дни преди срока:
                                    </Label>
                                    <Input
                                        id="deadline_days"
                                        type="number"
                                        min={1}
                                        max={30}
                                        className="w-20 h-8"
                                        value={formData?.deadline_reminder_days}
                                        onChange={(e) => handleNumberChange("deadline_reminder_days", e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="h-px bg-border" />

                {/* Projects */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Проекти</h3>
                    <div className="grid gap-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="project_status" className="flex flex-col gap-1">
                                <span>Промяна на статус на проект</span>
                            </Label>
                            <Switch
                                id="project_status"
                                checked={formData?.project_status_change}
                                onCheckedChange={(v) => handleSwitchChange("project_status_change", v)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="project_member" className="flex flex-col gap-1">
                                <span>Добавяне към екип</span>
                            </Label>
                            <Switch
                                id="project_member"
                                checked={formData?.project_member_added}
                                onCheckedChange={(v) => handleSwitchChange("project_member_added", v)}
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-border" />

                {/* Comments */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Коментари</h3>
                    <div className="grid gap-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="mention" className="flex flex-col gap-1">
                                <span>Споменаване (@mention)</span>
                            </Label>
                            <Switch
                                id="mention"
                                checked={formData?.mention_in_comment}
                                onCheckedChange={(v) => handleSwitchChange("mention_in_comment", v)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="new_comment" className="flex flex-col gap-1">
                                <span>Нов коментар</span>
                                <span className="font-normal text-xs text-muted-foreground">Във всички ваши задачи (може да е много често)</span>
                            </Label>
                            <Switch
                                id="new_comment"
                                checked={formData?.new_comment}
                                onCheckedChange={(v) => handleSwitchChange("new_comment", v)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Запази промените
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
