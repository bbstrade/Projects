"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useTheme } from "next-themes";

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Името трябва да е поне 2 знака.",
    }),
    email: z.string().email({
        message: "Моля, въведете валиден имейл адрес.",
    }),
    password: z.string().min(8, {
        message: "Паролата трябва да е поне 8 знака.",
    }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Паролите не съвпадат",
    path: ["confirmPassword"],
});

export default function RegisterPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { theme } = useTheme();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            const { data, error } = await signUp.email({
                email: values.email,
                password: values.password,
                name: values.name,
            });

            if (error) {
                toast.error(error.message || "Регистрацията неуспешна");
            } else {
                toast.success("Акаунтът е създаден успешно!");
                router.push("/dashboard");
            }
        } catch (err: any) {
            toast.error("Възникна неочаквана грешка");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
            <div className="flex items-center justify-center py-12">
                <div className="mx-auto grid w-[350px] gap-6">
                    <div className="flex flex-col items-center text-center space-y-2">
                        <div className="w-16 h-16 relative mb-2">
                            <img
                                src="/logo.png"
                                alt="Logo"
                                className="object-contain w-full h-full"
                            />
                        </div>
                        <h1 className="text-3xl font-bold">Регистрация</h1>
                        <p className="text-balance text-muted-foreground">
                            Въведете вашите данни за нов акаунт
                        </p>
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Име</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Иван Петров"
                                                disabled={loading}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Имейл</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="m@example.com"
                                                type="email"
                                                disabled={loading}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Парола</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Създайте парола"
                                                type="password"
                                                disabled={loading}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Потвърди парола</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Потвърдете вашата парола"
                                                type="password"
                                                disabled={loading}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Регистрация
                            </Button>
                        </form>
                    </Form>
                    <div className="text-center text-sm">
                        Вече имате акаунт?{" "}
                        <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                            Вход
                        </Link>
                    </div>
                </div>
            </div>
            <div className="hidden bg-muted lg:block relative h-full">
                <div className="absolute inset-0 bg-zinc-900/10 dark:bg-zinc-900/50" />
                <div className="h-full flex items-center justify-center p-8 bg-zinc-900 text-white">
                    <div className="max-w-md space-y-4">
                        <blockquote className="space-y-2">
                            <p className="text-lg">
                                "Присъединете се към хиляди професионалисти, които управляват своите проекти по-ефективно с нашата платформа."
                            </p>
                        </blockquote>
                    </div>
                </div>
            </div>
        </div>
    );
}
