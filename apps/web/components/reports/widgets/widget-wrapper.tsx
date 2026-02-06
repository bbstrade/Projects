import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GripVertical, MoreVertical, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WidgetWrapperProps {
    title: string;
    children: React.ReactNode;
    className?: string;
    isEditing?: boolean;
    onDelete?: () => void;
    onEdit?: () => void;
    dragHandleProps?: any;
}

export function WidgetWrapper({
    title,
    children,
    className,
    isEditing,
    onDelete,
    onEdit,
    dragHandleProps
}: WidgetWrapperProps) {
    return (
        <Card className={cn("h-full flex flex-col overflow-hidden", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                <div className="flex items-center gap-2 overflow-hidden">
                    {isEditing && (
                        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                            <GripVertical className="h-4 w-4" />
                        </div>
                    )}
                    <CardTitle className="text-sm font-medium truncate" title={title}>
                        {title}
                    </CardTitle>
                </div>
                {isEditing && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onEdit}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onDelete} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </CardHeader>
            <CardContent className="flex-1 p-4 min-h-0 overflow-auto">
                {children}
            </CardContent>
        </Card>
    );
}
