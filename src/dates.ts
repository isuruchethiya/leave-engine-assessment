export function daysInMonth(year: number, month: number): number {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addMonths(date: string, months: number): string {
    const [y, m, d] = date.split('-').map(Number);
    const monthIndex = m - 1 + months;
    const year = y + Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    const day = Math.min(d, daysInMonth(year, month));
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function monthEnds(from: string, asOf: string): string[] {
    const result: string[] = [];
    let year = Number(from.slice(0, 4));
    let month = Number(from.slice(5, 7));
    while (true) {
        const day = daysInMonth(year, month);
        const end = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        if (end > asOf) break;
        result.push(end);
        month++;
        if (month > 12) {
            month = 1;
            year++;
        }
    }
    return result;
}




