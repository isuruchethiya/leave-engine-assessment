export interface Employee {
    employeeId: string;
    name: string;
    companyId: number;
    joinDate: string; // 'YYYY-MM-DD'
    probationMonths: number;
    resignationDate: string | null;
    lastWorkingDay: string | null;
}

export interface LeaveRecord {
    recordId: string;
    employeeId: string;
    date: string; // 'YYYY-MM-DD'
    portion: "FULL" | "HALF";
    type: string;
}