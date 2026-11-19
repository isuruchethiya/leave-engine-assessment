// leaveService.ts
import { db } from "./db";
export interface LeaveRow {
  id: number;
  company_id: number;
  employee_id: number;
  employee_name: string;
  start_date: string; // 'YYYY-MM-DD'
  end_date: string; // 'YYYY-MM-DD'
  day_count: number;
  status: "pending" | "approved" | "rejected";
}

export async function getLeaveForPeriod(
  companyId: number,
  from: string,
  to: string,
  statusFilter?: "pending" | "approved" | "rejected",
): Promise<LeaveRow[]> {
  let rows: LeaveRow[];
  if (statusFilter) {
    rows = await db.query<LeaveRow>(
      `SELECT * FROM leave_requests
       WHERE company_id = $1
         AND status = $2
         AND start_date >= $3
         AND end_date < $4
       ORDER BY start_date`,
      [companyId, statusFilter, from, to],
    );
  } else {
    rows = await db.query<LeaveRow>(
      `SELECT * FROM leave_requests
       WHERE company_id = $1
         AND start_date >= $2
         AND end_date < $3
       ORDER BY start_date`,
      [companyId, from, to],
    );
  }

  // Attach each employee's department name for display.
  for (const row of rows) {
    const dept = await db.query<{ name: string }>(
      `SELECT d.name
       FROM departments d
       JOIN employees e ON e.department_id = d.id
       WHERE e.id = $1`,
      [row.employee_id],
    );
    (row as any).department = dept[0]?.name ?? "Unknown";
  }

  return rows;
}

export function totalDaysTaken(rows: LeaveRow[]): number {
  let total = 0;
  for (let i = 0; i < rows.length; i++) {
    total += rows[i].day_count;
  }
  return total;
}