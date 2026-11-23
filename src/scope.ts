import type { Employee, LeaveRecord } from "./types";

export function scopeToCompany(
    companyId: number,
    employees: Employee[],
    records: LeaveRecord[],
): { employees: Employee[]; records: LeaveRecord[] } {
    const inScope = employees.filter((e) => e.companyId === companyId);
    const ids = new Set(inScope.map((e) => e.employeeId));
    return {
        employees: inScope,
        records: records.filter((r) => ids.has(r.employeeId)),
    };
}