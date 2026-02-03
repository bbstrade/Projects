"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "bg" | "en";

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    // Lazy initialization to strictly respect localStorage on first client render if possible
    // This avoids the 'flicker' or state mismatch if the default was hardcoded to "bg"
    const [lang, setLang] = useState<Language>(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem("app-language");
                if (saved === "bg" || saved === "en") {
                    return saved;
                }
            } catch (error) {
                console.error("Failed to read language from localStorage:", error);
            }
        }
        return "bg";
    });

    // Ensure document attribute is synced
    useEffect(() => {
        document.documentElement.lang = lang;
        localStorage.setItem("app-language", lang);
    }, [lang]);

    const handleSetLang = (newLang: Language) => {
        setLang(newLang);
    };

    const t = (key: string) => {
        const translations: Record<Language, Record<string, string>> = {
            bg: {
                filters: "Филтри",
                sortBy: "Сортиране",
                search: "Търсене...",
                clear: "Изчисти",
                projects: "Проекти",
                tasks: "Задачи",
                dashboard: "Табло",
                approvals: "Одобрения",
                teams: "Екипи",
                reports: "Доклади",
                settings: "Настройки",
                profile: "Профил",
                admin: "Админ",
                backToProjects: "← Към всички проекти",
                projectNotFound: "Проектът не е намерен",
                toAllProjects: "Към всички проекти",
                deleteConfirm: "Сигурни ли сте, че искате да изтриете този проект? Това действие е необратимо.",
                projectDeleted: "Проектът беше изтрит успешно",
                deleteError: "Грешка при изтриване на проекта",
                tabTasks: "Задачи",
                tabTeam: "Екип",
                tabGuests: "Гости",
                tabComments: "Коментари",
                guestsTitle: "Гости",
                inviteGuest: "Покани гост",
                inviteExternalGuest: "Покани външен гост",
                inviteGuestDesc: "Поканете някого извън екипа за сътрудничество по този проект.",
                emailAddress: "Имейл адрес",
                permissions: "Права",
                sendInvite: "Изпрати покана",
                guestAccessDisabled: "Достъпът за гости е изключен",
                guestAccessDisabledDesc: "Този екип не позволява външни гости.",
                noGuests: "Все още няма поканени гости.",
                status: "Статус",
                actions: "Действия",
                guestInvited: "Гостът е поканен успешно",
                guestInviteError: "Грешка при покана на гост",
                guestRemoved: "Гостът е премахнат",
                removeGuestConfirm: "Премахване на този гост?",
                permView: "Преглед на проект",
                permComment: "Коментари",
                permEditTasks: "Редактиране на задачи",
                permCreateTasks: "Създаване на задачи",
                statusActive: "Активен",
                statusPending: "Чакащ",
                statusRevoked: "Отменен",
            },
            en: {
                filters: "Filters",
                sortBy: "Sort By",
                search: "Search...",
                clear: "Clear",
                projects: "Projects",
                tasks: "Tasks",
                dashboard: "Dashboard",
                approvals: "Approvals",
                teams: "Teams",
                reports: "Reports",
                settings: "Settings",
                profile: "Profile",
                admin: "Admin",
                backToProjects: "← Back to all projects",
                projectNotFound: "Project not found",
                toAllProjects: "To all projects",
                deleteConfirm: "Are you sure you want to delete this project? This action cannot be undone.",
                projectDeleted: "Project deleted successfully",
                deleteError: "Error deleting project",
                tabTasks: "Tasks",
                tabTeam: "Team",
                tabGuests: "Guests",
                tabComments: "Comments",
                guestsTitle: "Guests",
                inviteGuest: "Invite Guest",
                inviteExternalGuest: "Invite External Guest",
                inviteGuestDesc: "Invite someone outside the team to collaborate on this project.",
                emailAddress: "Email Address",
                permissions: "Permissions",
                sendInvite: "Send Invitation",
                guestAccessDisabled: "Guest access disabled",
                guestAccessDisabledDesc: "This team does not allow external guests.",
                noGuests: "No guests invited yet.",
                status: "Status",
                actions: "Actions",
                guestInvited: "Guest invited successfully",
                guestInviteError: "Error inviting guest",
                guestRemoved: "Guest removed",
                removeGuestConfirm: "Remove this guest?",
                permView: "View Project",
                permComment: "Comments",
                permEditTasks: "Edit Tasks",
                permCreateTasks: "Create Tasks",
                statusActive: "Active",
                statusPending: "Pending",
                statusRevoked: "Revoked",
            }
        };
        return translations[lang][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
