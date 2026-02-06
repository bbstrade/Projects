
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";

interface ExportData {
    filename: string;
    sheetName?: string;
    columns: string[];
    data: any[][];
}

export const exportToCSV = ({ filename, columns, data }: ExportData) => {
    const csvContent = [
        columns.join(","),
        ...data.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${filename}.csv`);
};

export const exportToExcel = ({ filename, sheetName = "Sheet1", columns, data }: ExportData) => {
    const worksheet = XLSX.utils.aoa_to_sheet([columns, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `${filename}.xlsx`);
};

export const exportToPDF = ({ filename, columns, data, title }: ExportData & { title: string }) => {
    const doc = new jsPDF();

    // Add logic to handle cyrillic font if needed, but standard font might be missing cyrillic support
    // For now we assume standard ASCII or simplified output. 
    // If Cyrillic is needed, we'd need to add a font. 
    // However, jsPDF's built-in fonts don't support Cyrillic well.
    // simpler approach is to use autoTable which might handle it better if the font is set

    // NOTE: Cyrillic support in jsPDF often requires a custom font.
    // We will attempt to use it as is, but if it fails, we might need a roboto font base64.

    doc.text(title, 14, 20);

    autoTable(doc, {
        head: [columns],
        body: data,
        startY: 30,
        styles: { font: "helvetica", fontStyle: "normal" } // Helvetica implies standard encoding, might break cyrillic
    });

    doc.save(`${filename}.pdf`);
};

// Helper to prepare metrics for export
export const exportMetrics = (metrics: any, type: "csv" | "excel" | "pdf") => {
    const columns = ["Category", "Value"];
    const data = [
        ["Total Projects", metrics.totalProjects],
        ["Active Projects", metrics.activeProjects],
        ["Completed Projects", metrics.completedProjects],
        ["Total Tasks", metrics.totalTasks],
        ["Completed Tasks", metrics.completedTasks],
        ["Pending Approvals", metrics.pendingApprovals],
    ];

    const filename = `report_${new Date().toISOString().split('T')[0]}`;
    const exportConfig = { filename, columns, data, title: "Dashboard Report" };

    if (type === "csv") exportToCSV(exportConfig);
    if (type === "excel") exportToExcel(exportConfig);
    if (type === "pdf") exportToPDF(exportConfig);
};
