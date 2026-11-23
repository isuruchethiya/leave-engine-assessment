import { accruedDays } from "./accrual";
import type { Employee, LeaveRecord } from "./types";

export const FLOOR = -2.0;
const EPSILON = 1e-9;

export interface InvalidRecord {
    recordId: string;
    employeeId: string;
    date: string; // 'YYYY-MM-DD'
    reason: string;
}

export interface LeaveResult {
    taken: number;
    invalid: InvalidRecord[];
}

function portionDays(portion: "FULL" | "HALF"): number {
    return portion === "FULL" ? 1.0 : 0.5;
}

export function processLeave(
    employee: Employee,
    records: LeaveRecord[],
    holidays: Set<string>,
    asOf: string,
): LeaveResult {
    const mine = records
        .filter((r) => r.employeeId === employee.employeeId && r.date <= asOf)
        .sort((a, b) =>
            a.date === b.date
                ? a.recordId.localeCompare(b.recordId)
                : a.date.localeCompare(b.date),
        );

    let taken = 0;
    const invalid: InvalidRecord[] = [];

    for (const r of mine) {
        const reject = (reason: string) => {
            invalid.push({
                recordId: r.recordId,
                employeeId: r.employeeId,
                date: r.date,
                reason,
            });
        };

        if (holidays.has(r.date)) {
            reject("Public holiday");
            continue;
        }

        if (employee.lastWorkingDay !== null && r.date > employee.lastWorkingDay) {
            reject("Dated after the employee's last working day");
            continue;
        }

        const days = portionDays(r.portion);
        const balanceBefore =
            accruedDays(
                employee.joinDate,
                r.date,
                employee.probationMonths,
                employee.lastWorkingDay,
            ) - taken;

        if (balanceBefore - days < FLOOR - EPSILON) {
            reject("Would take the balance below -2.0 days");
            continue;
        }

        taken += days;
    }

    return { taken, invalid };
}