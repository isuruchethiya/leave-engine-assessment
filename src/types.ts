export interface employee {
    employeeId: string;
    name: string;
    companyId: number;
    joinDate: string; // 'YYYY-MM-DD'
    probationMonths: number;
    resignationDate: string | null;
    lastWorkingDate: string | null;
}

export interface leaveRecord {
    recordId: string;
    employeeId: string;
    date: string; // 'YYYY-MM-DD'
    portion: "FULL" | "HALF";
    type: string;
    
}