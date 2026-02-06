"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

export default function UsersManagement() {
    const users = useQuery(api.admin.getAllUsers);
    const updateUserRole = useMutation(api.admin.updateUserRole);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [selectedRole, setSelectedRole] = useState("");

    const handleRoleUpdate = async () => {
        if (!editingUser) return;
        try {
            await updateUserRole({ userId: editingUser._id, role: selectedRole });
            toast.success("Ролята е обновена успешно");
            setEditingUser(null);
        } catch (error) {
            toast.error("Неуспешно обновяване на роля");
        }
    };

    if (users === undefined) return <Loader2 className="animate-spin" />;

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
                            <TableHead>Потребител</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Роля</TableHead>
                            <TableHead>Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user: any) => (
                            <TableRow key={user._id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback>{(user.name || "?").charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="font-medium">{user.name || "N/A"}</div>
                                    </div>
                                </TableCell>
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
                                                        <SelectTriggerWrapper>
                                                            <SelectValue />
                                                        </SelectTriggerWrapper>
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

// Wrapper to fix Trigger type if needed (or just use SelectTrigger directly if UI lib allows)
function SelectTriggerWrapper({ children }: { children: React.ReactNode }) {
    return <SelectTrigger className="w-full">{children}</SelectTrigger>
}
