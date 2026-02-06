"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SmartWidget } from "./widgets/smart-widget";
import { Plus, Trash2, LayoutGrid, BarChart3, PieChart, LineChart, Table2, Type, ChevronRight, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ReportBuilderProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reportId?: Id<"customReports">;
    onSave: () => void;
}

// Draggable wrapper for builder items
function SortableWidgetWrapper({ item, onEdit, onDelete }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // Calculate span
    let colSpan = "col-span-1";
    if (item.position.w === 4) colSpan = "col-span-1 md:col-span-2 lg:col-span-4";
    else if (item.position.w === 3) colSpan = "col-span-1 md:col-span-2 lg:col-span-3";
    else if (item.position.w === 2) colSpan = "col-span-1 md:col-span-2";

    return (
        <div ref={setNodeRef} style={style} className={`${colSpan} h-[300px] relative group`}>
            <SmartWidget
                type={item.type}
                config={item.config}
                isEditing={true}
                onDelete={() => onDelete(item.id)}
                onEdit={() => onEdit(item)}
                dragHandleProps={{ ...listeners, ...attributes }}
            />
        </div>
    );
}

export function ReportBuilder({ open, onOpenChange, reportId, onSave }: ReportBuilderProps) {
    // Queries
    const reportData = useQuery(api.customReports.get, reportId ? { id: reportId } : "skip");
    const createReport = useMutation(api.customReports.create);
    const updateReport = useMutation(api.customReports.update);

    // State
    const [step, setStep] = useState<"details" | "layout">("details");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isShared, setIsShared] = useState(false);
    const [layout, setLayout] = useState<any[]>([]);

    // Widget editor state
    const [editingWidget, setEditingWidget] = useState<any>(null);
    const [isWidgetEditorOpen, setIsWidgetEditorOpen] = useState(false);

    // Load initial data
    useEffect(() => {
        if (reportId && reportData) {
            setName(reportData.name);
            setDescription(reportData.description || "");
            setIsShared(reportData.isShared);
            setLayout(reportData.layout);
            setStep("layout");
        } else if (!reportId) {
            setName("");
            setDescription("");
            setIsShared(false);
            setLayout([]);
            setStep("details");
        }
    }, [reportId, reportData, open]);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setLayout((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSave = async () => {
        if (!name) return;

        try {
            if (reportId) {
                await updateReport({
                    id: reportId,
                    name,
                    description,
                    isShared,
                    layout,
                });
            } else {
                await createReport({
                    name,
                    description,
                    isShared,
                    layout: layout as any, // DB Schema might be slightly stricter but this matches generic structure
                });
            }
            onSave();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save report:", error);
            alert("Failed to save report");
        }
    };

    const addWidget = (type: string) => {
        const newWidget = {
            id: crypto.randomUUID(),
            type,
            position: { x: 0, y: 0, w: 2, h: 2 }, // Default size
            config: {
                title: "New " + type,
                dataSource: "tasks", // Default
                metric: "count",
                colors: ["#3b82f6"],
            }
        };

        setEditingWidget(newWidget);
        setIsWidgetEditorOpen(true);
    };

    const saveWidget = (widget: any) => {
        if (layout.find(w => w.id === widget.id)) {
            // Update existing
            setLayout(layout.map(w => w.id === widget.id ? widget : w));
        } else {
            // Add new
            setLayout([...layout, widget]);
        }
        setIsWidgetEditorOpen(false);
        setEditingWidget(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>{reportId ? "Редактиране на отчет" : "Създаване на нов отчет"}</DialogTitle>
                    <DialogDescription>
                        {step === "details" ? "Въведете основна информация" : "Подредете елементите на отчета"}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {step === "details" ? (
                        <div className="p-6 space-y-4 max-w-md mx-auto w-full mt-10">
                            <div className="space-y-2">
                                <Label>Име на отчета</Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Напр. Месечен отчет за задачи" />
                            </div>
                            <div className="space-y-2">
                                <Label>Описание (опционално)</Label>
                                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Кратко описание на целта на отчета..." />
                            </div>
                            <div className="flex items-center justify-between border p-4 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label>Споделяне с екипа</Label>
                                    <p className="text-sm text-muted-foreground">Всички членове на екипа ще могат да виждат този отчет</p>
                                </div>
                                <Switch checked={isShared} onCheckedChange={setIsShared} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full">
                            {/* Sidebar - Widget Palette */}
                            <div className="w-64 border-r p-4 flex flex-col gap-4 bg-muted/20">
                                <h3 className="font-medium text-sm text-muted-foreground">Добави елемент</h3>
                                <div className="grid gap-2">
                                    <Button variant="outline" className="justify-start" onClick={() => addWidget("metric")}>
                                        <Type className="mr-2 h-4 w-4" />
                                        Метрика (Число)
                                    </Button>
                                    <Button variant="outline" className="justify-start" onClick={() => addWidget("bar")}>
                                        <BarChart3 className="mr-2 h-4 w-4" />
                                        Bar Chart
                                    </Button>
                                    <Button variant="outline" className="justify-start" onClick={() => addWidget("pie")}>
                                        <PieChart className="mr-2 h-4 w-4" />
                                        Pie Chart
                                    </Button>
                                    <Button variant="outline" className="justify-start" onClick={() => addWidget("line")}>
                                        <LineChart className="mr-2 h-4 w-4" />
                                        Line Chart
                                    </Button>
                                    <Button variant="outline" className="justify-start" onClick={() => addWidget("table")}>
                                        <Table2 className="mr-2 h-4 w-4" />
                                        Таблица
                                    </Button>
                                </div>
                            </div>

                            {/* Main Canvas - Grid */}
                            <ScrollArea className="flex-1 p-6 bg-muted/10">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={layout.map(i => i.id)}
                                        strategy={rectSortingStrategy}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[300px] min-h-[500px]">
                                            {layout.length === 0 ? (
                                                <div className="col-span-full h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl m-4">
                                                    <LayoutGrid className="h-12 w-12 mb-4 opacity-20" />
                                                    <p>Влачете елементи тук или кликнете, за да добавите</p>
                                                </div>
                                            ) : (
                                                layout.map((item) => (
                                                    <SortableWidgetWrapper
                                                        key={item.id}
                                                        item={item}
                                                        onEdit={(w: any) => {
                                                            setEditingWidget(w);
                                                            setIsWidgetEditorOpen(true);
                                                        }}
                                                        onDelete={(id: string) => setLayout(l => l.filter(i => i.id !== id))}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-background z-10">
                    {step === "layout" && (
                        <Button variant="outline" onClick={() => setStep("details")} className="mr-auto">
                            Обратно към детайли
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Отказ
                    </Button>
                    {step === "details" ? (
                        <Button onClick={() => name && setStep("layout")} disabled={!name}>
                            Напред <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleSave}>
                            Запази отчета
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>

            {/* Sub-dialog for widget configuration */}
            <WidgetConfigDialog
                open={isWidgetEditorOpen}
                onOpenChange={setIsWidgetEditorOpen}
                widget={editingWidget}
                onSave={saveWidget}
            />
        </Dialog>
    );
}

// Widget Config Dialog Component
function WidgetConfigDialog({ open, onOpenChange, widget, onSave }: any) {
    const [config, setConfig] = useState<any>(widget?.config || {});
    const [size, setSize] = useState(widget?.position?.w || 2);

    useEffect(() => {
        if (widget) {
            setConfig(widget.config);
            setSize(widget.position.w);
        }
    }, [widget]);

    if (!widget) return null;

    const handleSave = () => {
        onSave({
            ...widget,
            position: { ...widget.position, w: size },
            config
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Настройки на елемента</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Заглавие</Label>
                        <Input value={config.title} onChange={e => setConfig({ ...config, title: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Източник на данни</Label>
                            <Select value={config.dataSource} onValueChange={v => setConfig({ ...config, dataSource: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tasks">Задачи</SelectItem>
                                    <SelectItem value="projects">Проекти</SelectItem>
                                    <SelectItem value="approvals">Одобрения</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Период</Label>
                            <Select value={config.dateRange || "all"} onValueChange={v => setConfig({ ...config, dateRange: v === "all" ? undefined : v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Всички</SelectItem>
                                    <SelectItem value="7d">Последните 7 дни</SelectItem>
                                    <SelectItem value="30d">Последните 30 дни</SelectItem>
                                    <SelectItem value="90d">Последните 3 месеца</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Метрика</Label>
                            <Select value={config.metric} onValueChange={v => setConfig({ ...config, metric: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="count">Брой</SelectItem>
                                    <SelectItem value="sum">Сума</SelectItem>
                                    <SelectItem value="avg">Средно</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {config.metric !== "count" && (
                            <div className="space-y-2">
                                <Label>Поле за метрика</Label>
                                <Select value={config.metricField} onValueChange={v => setConfig({ ...config, metricField: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="budget">Бюджет</SelectItem>
                                        <SelectItem value="estimatedHours">Часове</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {widget.type !== "metric" && (
                        <div className="space-y-2">
                            <Label>Групиране по</Label>
                            <Select value={config.groupBy} onValueChange={v => setConfig({ ...config, groupBy: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="status">Статус</SelectItem>
                                    <SelectItem value="priority">Приоритет</SelectItem>
                                    <SelectItem value="assignee">Отговорник</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Размер (Ширина 1-4)</Label>
                        <Select value={String(size)} onValueChange={v => setSize(Number(v))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 (Малък)</SelectItem>
                                <SelectItem value="2">2 (Среден)</SelectItem>
                                <SelectItem value="3">3 (Голям)</SelectItem>
                                <SelectItem value="4">4 (Пълен ред)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Запази</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
