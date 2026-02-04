"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const dict = {
    title: "Създай Нов Екип",
    description: "Въведете информация за новия екип",
    nameLabel: "Име на екипа",
    namePlaceholder: "напр. Проектен екип А",
    descriptionLabel: "Описание",
    descriptionPlaceholder: "Опишете целта на екипа...",
    cancel: "Отказ",
    create: "Създай Екип",
    creating: "Създаване...",
    nameRequired: "Името е задължително",
    nameMin: "Името трябва да е поне 2 символа",
};

const formSchema = z.object({
    name: z.string().min(2, dict.nameMin),
    description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateTeamDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateTeamDialog({ open, onOpenChange }: CreateTeamDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const createTeam = useMutation(api.teams.create);


    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            await createTeam({
                name: data.name,
                description: data.description,
            });
            form.reset();
            onOpenChange(false);
            // Force page reload to refresh team list
            window.location.reload();
        } catch (error) {
            console.error("Failed to create team:", error);
            alert("Грешка при създаване на екип: " + (error instanceof Error ? error.message : "Неизвестна грешка"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{dict.title}</DialogTitle>
                    <DialogDescription>{dict.description}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dict.nameLabel}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={dict.namePlaceholder}
                                            {...field}
                                        />
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
                                    <FormLabel>{dict.descriptionLabel}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={dict.descriptionPlaceholder}
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                {dict.cancel}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? dict.creating : dict.create}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
