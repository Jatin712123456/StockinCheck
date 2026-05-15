export function formatNumber(n) {
  if (n === null || n === undefined || n === '') return '—';
  const num = Number(n);
  if (!Number.isFinite(num)) return '—';
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatQuantity(qty, unit) {
  return `${formatNumber(qty)}${unit ? ` ${unit}` : ''}`;
}

export function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeDay(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
