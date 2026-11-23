import path from "node:path";
import { loadEmployees, loadHolidays, loadLeaveRecords } from "./csv";
import { accruedDays } from "./accrual";
import { processLeave } from "./leave";
import type { InvalidRecord } from "./leave";

function getArg(name: string): string | undefined {
    const args = process.argv.slice(2);
    const i = args.indexOf(name);
    return i === -1 ? undefined : args[i + 1];
}

function fmt(x: number): string {
    return (Math.round(x * 100) / 100 + 0).toFixed(2);
}

function printTable(headers: string[], rows: string[][]): void {
    const widths = headers.map((h, i) =>
        Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)),
    );
    const line = (cells: string[]) =>
        cells.map((c, i) => c.padEnd(widths[i] ?? 0)).join("  ");
    console.log(line(headers));
    console.log(widths.map((w) => "-".repeat(w)).join("  "));
    for (const r of rows) console.log(line(r));
}

function main(): void {
    const companyArg = getArg("--company");
    const asOf = getArg("--as-of");

    if (companyArg === undefined || !/^\d+$/.test(companyArg)) {
        console.error("Usage: npm start -- --company <id> --as-of YYYY-MM-DD");
        process.exit(1);
    }
    if (asOf === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(asOf)) {
        console.error("Usage: npm start -- --company <id> --as-of YYYY-MM-DD");
        process.exit(1);
    }
    const companyId = Number(companyArg);

    const root = path.resolve(__dirname, "..");
    const employees = loadEmployees(path.join(root, "employees.csv"));
    const records = loadLeaveRecords(path.join(root, "leave_records.csv"));
    const holidays = loadHolidays(path.join(root, "public_holidays.csv"));


    const inScope = employees.filter((e) => e.companyId === companyId);

    const balanceRows: string[][] = [];
    const invalidAll: InvalidRecord[] = [];

    for (const e of inScope) {
        const accrued = accruedDays(e.joinDate, asOf, e.probationMonths, e.lastWorkingDay);
        const { taken, invalid } = processLeave(e, records, holidays, asOf);
        invalidAll.push(...invalid);
        balanceRows.push([e.employeeId, e.name, fmt(accrued), fmt(taken), fmt(accrued - taken)]);
    }

    invalidAll.sort((a, b) => a.recordId.localeCompare(b.recordId));

    console.log(`\nLeave balances: company ${companyId}, as of ${asOf}\n`);
    printTable(["employee_id", "name", "accrued", "taken", "balance"], balanceRows);

    console.log("\nInvalid leave records\n");
    if (invalidAll.length === 0) {
        console.log("(none)");
    } else {
        printTable(
            ["record_id", "employee_id", "date", "reason"],
            invalidAll.map((r) => [r.recordId, r.employeeId, r.date, r.reason]),
        );
    }
}

main();