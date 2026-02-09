export function formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0'),
    ].join(':');
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
    }).format(amount);
}

export function getStreakDays(completions: Date[]): number {
    if (completions.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedDates = completions
        .map(d => {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            return date.getTime();
        })
        .sort((a, b) => b - a);

    let streak = 0;
    let currentDate = today.getTime();

    for (const date of sortedDates) {
        if (date === currentDate || date === currentDate - 86400000) {
            streak++;
            currentDate = date;
        } else if (date < currentDate - 86400000) {
            break;
        }
    }

    return streak;
}

export function cn(...classes: (string | undefined | false)[]): string {
    return classes.filter(Boolean).join(' ');
}

export function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
}
