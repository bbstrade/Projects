"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";

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

const formSchema = z.object({
    email: z.string().email({
        message: "Моля, въведете валиден имейл адрес.",
    }),
    password: z.string().min(1, {
        message: "Паролата е задължителна.",
    }),
});

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { theme } = useTheme();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            const { data, error } = await signIn.email({
                email: values.email,
                password: values.password,
            });

            if (error) {
                toast.error(error.message || "Нещо се обърка");
            } else {
                toast.success("Успешен вход");
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
                        <h1 className="text-3xl font-bold">Добре дошли</h1>
                        <p className="text-balance text-muted-foreground">
                            Въведете вашия имейл за вход в системата
                        </p>
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Парола</FormLabel>
                                            <Link
                                                href="/forgot-password"
                                                className="text-sm font-medium text-primary hover:underline underline-offset-4"
                                            >
                                                Забравена парола?
                                            </Link>
                                        </div>
                                        <FormControl>
                                            <Input
                                                placeholder="Въведете вашата парола"
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
                                Вход
                            </Button>
                        </form>
                    </Form>
                    <div className="text-center text-sm">
                        Нямате акаунт?{" "}
                        <Link href="/register" className="underline underline-offset-4 hover:text-primary">
                            Регистрация
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
                                "Управлението на проекти никога не е било по-лесно. Системата ни помага да следим задачите, сроковете и екипите си с лекота."
                            </p>
                            <footer className="text-sm">John Doe</footer>
                        </blockquote>
                    </div>
                </div>
            </div>
        </div>
    );
}
