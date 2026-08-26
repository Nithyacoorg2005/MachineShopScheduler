// utils/dates.ts

export function parseDate(
  value: string | Date
): Date {
  if (value instanceof Date) {
    return value;
  }

  return new Date(
    value.endsWith("Z")
      ? value
      : value
  );
}

export function formatDate(
  value: string | Date
): string {
  return parseDate(value).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export function formatDateTime(
  value: string | Date
): string {
  return parseDate(value).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  );
}

export function formatTime(
  value: string | Date
): string {
  return parseDate(value).toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  );
}

export function formatShortDate(
  value: string | Date
): string {
  return parseDate(value).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
    }
  );
}

export function getDurationMinutes(
  start: string | Date,
  end: string | Date
): number {
  const startTime = parseDate(start).getTime();
  const endTime = parseDate(end).getTime();

  return Math.max(
    0,
    (endTime - startTime) / 60000
  );
}

export function getDurationHours(
  start: string | Date,
  end: string | Date
): number {
  return (
    getDurationMinutes(start, end) / 60
  );
}

export function formatDuration(
  minutes: number
): string {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "0m";
  }

  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const remainingMinutes = rounded % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

export function formatHours(
  hours: number
): string {
  if (!Number.isFinite(hours)) {
    return "0h";
  }

  return `${hours.toFixed(1)}h`;
}

export function isBetween(
  value: string | Date,
  start: string | Date,
  end: string | Date
): boolean {
  const time = parseDate(value).getTime();
  const startTime = parseDate(start).getTime();
  const endTime = parseDate(end).getTime();

  return (
    time >= startTime &&
    time <= endTime
  );
}

export function overlaps(
  startA: string | Date,
  endA: string | Date,
  startB: string | Date,
  endB: string | Date
): boolean {
  const aStart = parseDate(startA).getTime();
  const aEnd = parseDate(endA).getTime();
  const bStart = parseDate(startB).getTime();
  const bEnd = parseDate(endB).getTime();

  return (
    aStart < bEnd &&
    aEnd > bStart
  );
}

export function addMinutes(
  value: string | Date,
  minutes: number
): Date {
  const date = parseDate(value);

  return new Date(
    date.getTime() +
      minutes * 60 * 1000
  );
}

export function startOfDay(
  value: string | Date
): Date {
  const date = parseDate(value);

  date.setHours(0, 0, 0, 0);

  return date;
}

export function endOfDay(
  value: string | Date
): Date {
  const date = parseDate(value);

  date.setHours(23, 59, 59, 999);

  return date;
}