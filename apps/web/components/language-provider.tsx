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
                backToProjects: "← Към всички проекти",
                projectNotFound: "Проектът не е намерен",
                toAllProjects: "Към всички проекти",
                deleteConfirm: "Сигурни ли сте, че искате да изтриете този проект? Това действие е необратимо.",
                projectDeleted: "Проектът беше изтрит успешно",
                deadlineReminder: "Напомняне за краен срок",
                deadlineDays: "Дни преди срока:",
                projectStatusChange: "Промяна на статус на проект",
                projectMemberAdded: "Добавяне към екип",
                mentionInComment: "Споменаване (@mention)",
                newComment: "Нов коментар",
                newCommentDesc: "Във всички ваши задачи (може да е много често)",
                notificationsSaved: "Настройките за известия са запазени",
                notificationsSaveError: "Грешка при запазване",
                myTasks: "Моите Задачи",
                noTasks: "Нямате задачи",
                viewMore: "Виж още",
                myProjects: "Моите Проекти",
                noProjects: "Нямате проекти",
                user: "Потребител",
                tabDashboard: "Табло",
                tabProjects: "Проекти",
                tabTasks: "Задачи",
                tabApprovals: "Одобрения",
                tabTeams: "Екипи",
                tabReports: "Доклади",
                tabSettings: "Настройки",
                tabProfile: "Профил",
                tabAdmin: "Админ",
                tabNotifications: "Известия",
                tabExport: "Експорт",
                deleteError: "Грешка при изтриване на проекта",
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
                profileTitle: "Лична информация",
                profileDesc: "Управлявайте личните си данни и предпочитания",
                fullName: "Пълно име",
                username: "Потребителско име",
                avatarUpload: "Кликнете върху снимката, за да я промените",
                uploading: "Качване...",
                saveChanges: "Запази промените",
                saving: "Запазване...",
                profileUpdated: "Профилът е обновен успешно",
                profileUpdateError: "Грешка при обновяване на профила",
                avatarUpdated: "Профилната снимка е обновена",
                avatarUpdateError: "Неуспешно качване на снимка",
                fileSizeError: "Размерът на файла трябва да е под 5MB",
                notificationsTitle: "Настройки за известия",
                notificationsDesc: "Изберете какви известия искате да получавате",
                taskAssigned: "Назначена задача",
                taskAssignedDesc: "Когато ви бъде назначена нова задача",
                statusChange: "Промяна на статус",
                statusChangeDesc: "Когато статусът на ваша задача се промени",
                taskCompleted: "Завършена задача",
                taskCompletedDesc: "Когато задача, която следите, е завършена",
                priorityChange: "Промяна на приоритет",
                notifications: "Известия",
                markAllAsRead: "Маркирай всички като прочетени",
                noNotifications: "Няма известия",
                now: "Сега",
                minsShort: "мин",
                hoursShort: "ч",
                daysShort: "д",
                searchPlaceholder: "Търсене във всички менюта...",
                noResultsFound: "Няма намерени резултати.",
                pages: "Страници",
                projectsTitle: "Проекти",
                tasksTitle: "Задачи",
                appTitle: "Управление на проекти",
                management: "Управление",
                selectTeam: "Изберете екип",
                searchTeam: "Търсене на екип...",
                noTeamsFound: "Няма намерени екипи.",
                myTeamsTitle: "Моите екипи",
                createTeam: "Създай нов екип",
                roleOwner: "Собственик",
                roleAdmin: "Админ",
                roleMember: "Член",
            },

            en: {
                filters: "Filters",
                sortBy: "Sort By",
                search: "Search...",
                clear: "Clear",
                backToProjects: "← Back to all projects",
                projectNotFound: "Project not found",
                toAllProjects: "To all projects",
                deleteConfirm: "Are you sure you want to delete this project? This action cannot be undone.",
                projectDeleted: "Project deleted successfully",
                deadlineReminder: "Deadline Reminder",
                deadlineDays: "Days before deadline:",
                projectStatusChange: "Project Status Change",
                projectMemberAdded: "Added to Team",
                mentionInComment: "Mention (@mention)",
                newComment: "New Comment",
                newCommentDesc: "In all your tasks (can be very frequent)",
                notificationsSaved: "Notification settings saved",
                notificationsSaveError: "Error saving settings",
                myTasks: "My Tasks",
                noTasks: "No tasks",
                viewMore: "View more",
                myProjects: "My Projects",
                noProjects: "No projects",
                user: "User",
                tabDashboard: "Dashboard",
                tabProjects: "Projects",
                tabTasks: "Tasks",
                tabApprovals: "Approvals",
                tabTeams: "Teams",
                tabReports: "Reports",
                tabSettings: "Settings",
                tabProfile: "Profile",
                tabAdmin: "Admin",
                tabNotifications: "Notifications",
                tabExport: "Export",
                deleteError: "Error deleting project",
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
                profileTitle: "Personal Information",
                profileDesc: "Manage your personal details and preferences",
                fullName: "Full Name",
                username: "Username",
                avatarUpload: "Click on the photo to change it",
                uploading: "Uploading...",
                saveChanges: "Save Changes",
                saving: "Saving...",
                profileUpdated: "Profile updated successfully",
                profileUpdateError: "Failed to update profile",
                avatarUpdated: "Profile picture updated",
                avatarUpdateError: "Failed to upload picture",
                fileSizeError: "File size must be less than 5MB",
                notificationsTitle: "Notification Settings",
                notificationsDesc: "Choose what notifications you want to receive",
                taskAssigned: "Task Assigned",
                taskAssignedDesc: "When you are assigned a new task",
                statusChange: "Status Change",
                statusChangeDesc: "When the status of your task changes",
                taskCompleted: "Task Completed",
                taskCompletedDesc: "When a task you follow is completed",
                priorityChange: "Priority Change",
                notifications: "Notifications",
                markAllAsRead: "Mark all as read",
                noNotifications: "No notifications",
                now: "Now",
                minsShort: "min",
                hoursShort: "h",
                daysShort: "d",
                searchPlaceholder: "Type a command or search...",
                noResultsFound: "No results found.",
                pages: "Pages",
                projectsTitle: "Projects",
                tasksTitle: "Tasks",
                appTitle: "Project Management",
                management: "Management",
                selectTeam: "Select team",
                searchTeam: "Search team...",
                noTeamsFound: "No teams found.",
                myTeamsTitle: "My teams",
                createTeam: "Create new team",
                roleOwner: "Owner",
                roleAdmin: "Admin",
                roleMember: "Member",
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
