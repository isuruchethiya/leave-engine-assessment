import { test } from "node:test";
import assert from "node:assert/strict";
import { accruedDays } from "../src/accrual";
import { processLeave } from "../src/leave";
import { scopeToCompany } from "../src/scope";
import type { Employee, LeaveRecord } from "../src/types";

const emp = (over: Partial<Employee>): Employee => ({
    employeeId: "E000",
    name: "Test",
    companyId: 1,
    joinDate: "2026-06-01",
    probationMonths: 3,
    resignationDate: null,
    lastWorkingDay: null,
    ...over,
});

const rec = (recordId: string, employeeId: string, date: string, portion: "FULL" | "HALF" = "FULL"): LeaveRecord => ({
    recordId,
    employeeId,
    date,
    portion,
    type: "ANNUAL",
});

test("Rule 4: balance may reach exactly -2.0, but not go past it", () => {
    const kamala = emp({ employeeId: "E002", joinDate: "2026-06-01", probationMonths: 3 });
    const records = [
        rec("L005", "E002", "2026-07-10"),
        rec("L006", "E002", "2026-07-13"),
        rec("L007", "E002", "2026-07-14"),
    ];
    const result = processLeave(kamala, records, new Set(), "2026-11-30");
    assert.equal(result.taken, 2);
    assert.deepEqual(result.invalid.map((r) => r.recordId), ["L007"]);
});

test("Rule 7: accrual stops at last working day, and later leave is invalid", () => {
    const ruwan = emp({
        employeeId: "E003",
        joinDate: "2024-11-20",
        probationMonths: 6,
        resignationDate: "2026-09-30",
        lastWorkingDay: "2026-08-15",
    });
    const without = accruedDays(ruwan.joinDate, "2026-11-30", 6);
    const withLwd = accruedDays(ruwan.joinDate, "2026-11-30", 6, ruwan.lastWorkingDay);
    assert.ok(Math.abs(without - withLwd - 7) < 1e-9);

    const result = processLeave(ruwan, [rec("L008", "E003", "2026-09-10")], new Set(), "2026-11-30");
    assert.equal(result.taken, 0);
    assert.deepEqual(result.invalid.map((r) => r.recordId), ["L008"]);
});

test("Rule 8: other companies' employees and records never appear", () => {
    const employees = [
        emp({ employeeId: "E001", companyId: 1 }),
        emp({ employeeId: "E004", companyId: 2 }),
    ];
    const records = [rec("L001", "E001", "2026-07-10"), rec("L010", "E004", "2026-03-03")];
    const scoped = scopeToCompany(1, employees, records);
    assert.deepEqual(scoped.employees.map((e) => e.employeeId), ["E001"]);
    assert.deepEqual(scoped.records.map((r) => r.recordId), ["L001"]);
});

test("Rule 3: pro-rata in the month probation ends", () => {    
    assert.ok(Math.abs(accruedDays("2025-01-15", "2025-06-30", 3) - 4.375) < 1e-9);
});