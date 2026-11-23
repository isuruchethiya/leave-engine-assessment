import {monthEnds} from "./dates";

export const MONTHLY_ACCRUAL = 1.75; 

export function accruedDays (joinDate: string, asOf: string): number {
    return monthEnds(joinDate, asOf).length * MONTHLY_ACCRUAL;
}