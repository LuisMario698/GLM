export function localISODate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function mondayOf(date: string | Date) {
  const value = typeof date === 'string' ? new Date(`${date}T12:00:00Z`) : new Date(date);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - day + 1);
  return value.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function ageOn(birthDate: string, today = localISODate()) {
  const birth = new Date(`${birthDate}T12:00:00Z`);
  const current = new Date(`${today}T12:00:00Z`);
  let age = current.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday = current.getUTCMonth() < birth.getUTCMonth() ||
    (current.getUTCMonth() === birth.getUTCMonth() && current.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`));
}
