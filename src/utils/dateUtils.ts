export function getWIBTime(): Date {
    const now = new Date();
    // WIB is UTC+7, so add 7 hours
    const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    return wibTime;
}

// Format as WIB string
export function formatWIB(date: Date): string {
    return date.toISOString().replace('Z', '+07:00'); // ISO with +07:00
}