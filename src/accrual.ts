import { addMonths, daysInMonth, monthEnds } from "./dates";

export const MONTHLY_ACCRUAL = 1.75;

export function accruedDays(joinDate: string, asOf: string, probationMonths: number, lastWorkingDay: string | null = null,): number {
    const probationEnd = addMonths(joinDate, probationMonths);
    const stop = lastWorkingDay !== null && lastWorkingDay < asOf ? lastWorkingDay : asOf;
    let total = 0;
    for (const end of monthEnds(joinDate, stop)) {
        if (end <= probationEnd) continue;
        if (end.slice(0, 7) === probationEnd.slice(0, 7)) {
            const days = daysInMonth(Number(end.slice(0, 4)), Number(end.slice(5, 7)));
            const daysAfter = days - Number(probationEnd.slice(8, 10));
            total += (MONTHLY_ACCRUAL * daysAfter) / days;
        } else {
            total += MONTHLY_ACCRUAL;
        }
    }
    return total;
}