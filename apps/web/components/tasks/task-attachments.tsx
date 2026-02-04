"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X, Download, FileIcon, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface TaskAttachmentsProps {
    taskId: Id<"tasks">;
    projectId?: Id<"projects">; // Optional context
}

export function TaskAttachments({ taskId, projectId }: TaskAttachmentsProps) {
    const files = useQuery(api.files.listByTask, { taskId });
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const saveFile = useMutation(api.files.saveFile);
    const removeFile = useMutation(api.files.remove);

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (files === undefined) return <div>Loading attachments...</div>;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setIsUploading(true);
        try {
            // 1. Get Upload URL
            const postUrl = await generateUploadUrl();

            // 2. Upload File
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": selectedFile.type },
                body: selectedFile,
            });

            if (!result.ok) throw new Error("Upload failed");

            const { storageId } = await result.json();

            // 3. Save Metadata
            await saveFile({
                storageId,
                fileName: selectedFile.name,
                fileType: selectedFile.type,
                fileSize: selectedFile.size,
                taskId,
                projectId,
            });

            toast.success("File uploaded");
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload file");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDelete = async (fileId: Id<"files">) => {
        if (confirm("Delete this file?")) {
            await removeFile({ fileId });
            toast.success("File deleted");
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Paperclip className="w-5 h-5" /> Attachments
                    </h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {files.length}
                    </span>
                </div>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isUploading}
                    />
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Paperclip className="w-4 h-4 mr-2" />}
                        {isUploading ? "Uploading..." : "Add File"}
                    </Button>
                </div>
            </div>

            {files.length === 0 && (
                <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                    <div className="flex justify-center mb-2">
                        <FileIcon className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm">No attachments yet</p>
                </div>
            )}

            <div className="space-y-2">
                {files.map((file) => (
                    <div key={file._id} className="group flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent/10 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                <FileIcon className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{file.fileName}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <span>{formatSize(file.fileSize)}</span>
                                    <span>•</span>
                                    <span>{format(file.createdAt, "MMM d, yyyy")}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {file.url && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" download>
                                        <Download className="w-4 h-4" />
                                    </a>
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDelete(file._id)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
