export function getPeriodDates(period: string): { from?: string; to?: string } {
  if (period === 'all') return {};
  const now = new Date();
  const to = now.toISOString();
  if (period === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString(), to };
  }
  if (period === '7d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { from: start.toISOString(), to };
  }
  if (period === '30d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { from: start.toISOString(), to };
  }
  return {};
}
