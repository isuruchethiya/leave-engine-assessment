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
      `SELECT lr.*, COALESCE(d.name, 'Unknown') AS department 
       FROM leave_requests lr
       LEFT JOIN employees e ON e.id = lr.employee_id 
       LEFT JOIN departments d ON d.id = e.department_id 
       WHERE lr.company_id = $1
         AND lr.status = $2
         AND lr.start_date >= $3
         AND lr.end_date <= $4
       ORDER BY lr.start_date`,
      [companyId, statusFilter, from, to],
    );
  } else {
    rows = await db.query<LeaveRow>(
      `SELECT lr.*, COALESCE(d.name, 'Unknown') AS department 
       FROM leave_requests lr
       LEFT JOIN employees e ON e.id = lr.employee_id 
       LEFT JOIN departments d ON d.id = e.department_id 
       WHERE lr.company_id = $1
         AND lr.start_date >= $2
         AND lr.end_date <= $3
       ORDER BY lr.start_date`,
      [companyId, from, to],
    );
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