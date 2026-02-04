"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCog, List, AlertCircle, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConvex } from "convex/react";

export default function AdministrationTab() {
    return (
        <Tabs defaultValue="users" className="space-y-6">
            <TabsList>
                <TabsTrigger value="users" className="gap-2">
                    <UserCog className="h-4 w-4" />
                    Потребители
                </TabsTrigger>
                <TabsTrigger value="statuses" className="gap-2">
                    <List className="h-4 w-4" />
                    Статуси
                </TabsTrigger>
                <TabsTrigger value="priorities" className="gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Приоритети
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Одитен Лог
                </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
                <UsersManagement />
            </TabsContent>

            <TabsContent value="statuses">
                <StatusManagement />
            </TabsContent>

            <TabsContent value="priorities">
                <PriorityManagement />
            </TabsContent>

            <TabsContent value="audit">
                <AuditLogViewer />
            </TabsContent>
        </Tabs>
    );
}

function UsersManagement() {
    const users = useQuery(api.admin.getAllUsers);
    const updateUserRole = useMutation(api.admin.updateUserRole);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [selectedRole, setSelectedRole] = useState("");

    const handleRoleUpdate = async () => {
        if (!editingUser) return;
        try {
            await updateUserRole({ userId: editingUser._id, role: selectedRole });
            toast.success("Role updated");
            setEditingUser(null);
        } catch (error) {
            toast.error("Failed to update role");
        }
    };

    if (!users) return <Loader2 className="animate-spin" />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Управление на потребители</CardTitle>
                <CardDescription>Управлявайте достъпа и ролите на потребителите в системата</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Име</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Роля</TableHead>
                            <TableHead>Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user: any) => (
                            <TableRow key={user._id}>
                                <TableCell>{user.name || "N/A"}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => {
                                                setEditingUser(user);
                                                setSelectedRole(user.role || 'member');
                                            }}>
                                                Промяна
                                            </Button>
                                        </DialogTrigger>
                                        {editingUser?._id === user._id && (
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Промяна на роля</DialogTitle>
                                                    <DialogDescription>
                                                        Изберете нова роля за {user.name} ({user.email})
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="py-4">
                                                    <Label>Роля</Label>
                                                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="admin">Admin</SelectItem>
                                                            <SelectItem value="member">Member</SelectItem>
                                                            <SelectItem value="user">User</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <DialogFooter>
                                                    <Button onClick={handleRoleUpdate}>Запази</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        )}
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function StatusManagement() {
    // Placeholder as full CRUD UI is complex
    return (
        <Card>
            <CardHeader>
                <CardTitle>Статуси</CardTitle>
                <CardDescription>Конфигурирайте статусите за задачи и проекти</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-muted-foreground text-sm">
                    Функционалността за управление на custom статуси е подготвена в базата данни, но интерфейсът е в процес на разработка.
                </div>
            </CardContent>
        </Card>
    );
}

function PriorityManagement() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Приоритети</CardTitle>
                <CardDescription>Конфигурирайте приоритетите за задачи</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-muted-foreground text-sm">
                    Функционалността за управление на custom приоритети е подготвена в базата данни, но интерфейсът е в процес на разработка.
                </div>
            </CardContent>
        </Card>
    );
}

function AuditLogViewer() {
    const logs = useQuery(api.admin.getAuditLogs, { limit: 100 });
    const convex = useConvex();

    const handleExport = async () => {
        try {
            // Fetch all logs (or limit to last 1000)
            const allLogs = await convex.query(api.admin.getAuditLogs, { limit: 1000 });
            const jsonString = JSON.stringify(allLogs, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            toast.error("Export failed");
        }
    };

    if (!logs) return <Loader2 className="animate-spin" />;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Одитен Лог</CardTitle>
                    <CardDescription>История на действията в системата</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Експорт
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Дата</TableHead>
                            <TableHead>Потребител</TableHead>
                            <TableHead>Действие</TableHead>
                            <TableHead>Обект</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    Няма записи
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log: any) => (
                                <TableRow key={log._id}>
                                    <TableCell className="whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString('bg-BG')}
                                    </TableCell>
                                    <TableCell>{log.userId}</TableCell>
                                    <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {log.entityType}: {log.entityId}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
