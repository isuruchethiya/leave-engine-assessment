import { readFileSync } from "node:fs";
import type { Employee, LeaveRecord } from "./types";

function parseCsv(path: string): Record<string, string>[] {
    const text = readFileSync(path, "utf8").replace(/^\uFEFF/, ""); // strip BOM
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    const headers = (lines[0] ?? "").split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
        const cells = line.split(",");
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
            row[h] = (cells[i] ?? "").trim();
        });
        return row;
    });
}

function orNull(value: string | undefined): string | null {
    return value === undefined || value === "" ? null : value;
}

export function loadEmployees(path: string): Employee[] {
    return parseCsv(path).map((r) => ({
        employeeId: r["employee_id"]!,
        name: r["name"]!,
        companyId: Number(r["company_id"]),
        joinDate: r["join_date"]!,
        probationMonths: Number(r["probation_months"]),
        resignationDate: orNull(r["resignation_date"]),
        lastWorkingDay: orNull(r["last_working_day"]),
    }));
}

export function loadLeaveRecords(path: string): LeaveRecord[] {
    return parseCsv(path).map((r) => {
        const portion = r["portion"];
        if (portion !== "FULL" && portion !== "HALF") {
            throw new Error(`Bad portion "${portion}" in record ${r["record_id"]}`);
        }
        return {
            recordId: r["record_id"]!,
            employeeId: r["employee_id"]!,
            date: r["date"]!,
            portion,
            type: r["type"]!,
        };
    });
}

export function loadHolidays(path: string): Set<string> {
    return new Set(parseCsv(path).map((r) => r["date"]!));
}