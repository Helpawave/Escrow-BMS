import { format, isValid, parseISO } from 'date-fns';

/**
 * Safely format a date string or Date object.
 * Returns a fallback string if the date is invalid, preventing "Invalid time value" crashes.
 */
export function safelyFormatDate(date: string | Date | null | undefined, formatStr: string = 'PP', fallback: string = 'N/A'): string {
    if (!date) return fallback;

    try {
        const parsedDate = typeof date === 'string' ? parseISO(date) : date;

        if (!isValid(parsedDate)) {
            return fallback;
        }

        return format(parsedDate, formatStr);
    } catch (error) {
        console.warn('Failed to parse date:', date, error);
        return fallback;
    }
}

/**
 * Safely convert a date string or Date object to a localized string.
 * This replaces `new Date().toLocaleDateString()` natively to prevent crashes.
 */
export function safelyToLocaleDate(date: string | Date | null | undefined, fallback: string = 'N/A'): string {
    if (!date) return fallback;

    try {
        const parsedDate = typeof date === 'string' ? new Date(date) : date;

        if (isNaN(parsedDate.getTime())) {
            return fallback;
        }

        return parsedDate.toLocaleDateString();
    } catch (error) {
        console.warn('Failed to toLocaleDateString:', date, error);
        return fallback;
    }
}
