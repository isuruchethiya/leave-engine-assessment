import { addMonths, monthEnds } from "./dates";

export const MONTHLY_ACCRUAL = 1.75;

export function accruedDays(joinDate: string, asOf: string, probationMonths: number): number {
    const probationEnd = addMonths(joinDate, probationMonths);
    const credited = monthEnds(joinDate, asOf).filter(
        (end) => end > probationEnd,
    );
    return credited.length * MONTHLY_ACCRUAL;
}