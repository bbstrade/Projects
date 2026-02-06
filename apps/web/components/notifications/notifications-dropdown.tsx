"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Bell,
    Check,
    CheckCheck,
    FileCheck,
    FolderKanban,
    MessageSquare,
    UserPlus,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";


const notificationIcons: Record<string, typeof Bell> = {
    approval: FileCheck,
    task: FolderKanban,
    team: UserPlus,
    project: FolderKanban,
    comment: MessageSquare,
    system: AlertCircle,
};

interface NotificationsDropdownProps {
    userId: Id<"users">;
}

export function NotificationsDropdown({ userId }: NotificationsDropdownProps) {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);

    const notifications = useQuery(api.notifications.list, {
        userId,
        limit: 10,
    });

    const unreadCount = useQuery(api.notifications.unreadCount, { userId });
    const markAsRead = useMutation(api.notifications.markAsRead);
    const markAllAsRead = useMutation(api.notifications.markAllAsRead);

    const handleMarkAsRead = async (notificationId: Id<"notifications">) => {
        await markAsRead({ notificationId });
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead({ userId });
    };

    const formatTime = (timestamp: number) => {
        const nowMs = Date.now();
        const diff = nowMs - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return t("now");
        if (minutes < 60) return `${minutes} ${t("minsShort")}`;
        if (hours < 24) return `${hours} ${t("hoursShort")}`;
        return `${days} ${t("daysShort")}`;
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {(unreadCount ?? 0) > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>{t("notifications")}</span>
                    {(unreadCount ?? 0) > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto py-1 px-2 text-xs"
                            onClick={handleMarkAllAsRead}
                        >
                            <CheckCheck className="mr-1 h-3 w-3" />
                            {t("markAllAsRead")}
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {!notifications || notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            <Bell className="mx-auto h-8 w-8 mb-2 opacity-50" />
                            {t("noNotifications")}
                        </div>
                    ) : (
                        notifications.map((notification) => {
                            const Icon = notificationIcons[notification.type] || Bell;
                            return (
                                <DropdownMenuItem
                                    key={notification._id}
                                    className={cn(
                                        "flex items-start gap-3 p-3 cursor-pointer",
                                        !notification.read && "bg-blue-50 dark:bg-blue-950"
                                    )}
                                    onClick={() => {
                                        if (!notification.read) {
                                            handleMarkAsRead(notification._id);
                                        }
                                    }}
                                >
                                    <div
                                        className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-full",
                                            !notification.read
                                                ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={cn(
                                                "text-sm truncate",
                                                !notification.read && "font-medium"
                                            )}
                                        >
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatTime(notification.createdAt)}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-1" />
                                    )}
                                </DropdownMenuItem>
                            );
                        })
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
