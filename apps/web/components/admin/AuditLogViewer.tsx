"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Download, FileJson, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { useConvex } from "convex/react";
import { toast } from "sonner";

export default function AuditLogViewer() {
    const logs = useQuery(api.admin.getAuditLogs, { limit: 200 });
    const convex = useConvex();
    const [search, setSearch] = useState("");
    const [selectedLog, setSelectedLog] = useState<any>(null);

    const filteredLogs = logs?.filter(log =>
        log.userName.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.entityType.toLowerCase().includes(search.toLowerCase())
    );

    const handleExport = async () => {
        try {
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
            toast.success("Logs exported successfully");
        } catch (e) {
            toast.error("Export failed");
        }
    };

    if (logs === undefined) return <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Одитен Лог</CardTitle>
                        <CardDescription>Пълен одит на действията в системата</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Търсене..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="sm" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Експорт
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-[600px]">
                    <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-[180px]">Дата</TableHead>
                                <TableHead>Потребител</TableHead>
                                <TableHead>Действие</TableHead>
                                <TableHead>Обект</TableHead>
                                <TableHead className="text-right">Детайли</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                        Няма намерени записи
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs?.map((log) => (
                                    <TableRow key={log._id} className="hover:bg-muted/50">
                                        <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                                            {format(log.createdAt, "dd MMM yyyy HH:mm:ss", { locale: bg })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={log.userAvatar} />
                                                    <AvatarFallback>{log.userName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium">{log.userName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-normal bg-background">
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold">{log.entityType}</span>
                                                <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]" title={log.entityId}>
                                                    {log.entityId}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <FileJson className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                                                    <DialogHeader>
                                                        <DialogTitle>Детайли за събитието</DialogTitle>
                                                        <DialogDescription>
                                                            {format(log.createdAt, "PPP p", { locale: bg })} - {log.userName}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <ScrollArea className="flex-1 mt-4 border rounded-md bg-slate-950 p-4">
                                                        <pre className="text-xs text-slate-50 font-mono whitespace-pre-wrap break-all">
                                                            {JSON.stringify({
                                                                ...log,
                                                                details: log.details || "No details provided"
                                                            }, null, 2)}
                                                        </pre>
                                                    </ScrollArea>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
