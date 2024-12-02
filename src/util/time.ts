interface WBDate {
  year: number;
  month: number;
  day: number;
}

function parseDate(dateString: string): WBDate {
  let sign = 1;
  if (dateString.startsWith("-")) {
    sign = -1;
    dateString = dateString.substring(1);
  }
  const [year, month, day] = dateString.split("-").map(Number);
  const date: WBDate = { year: sign * year, month, day };
  return date;
}

export function calculateTimeDifference(dateString1: string, dateString2: string): string {
  const date1 = parseDate(dateString1);
  const date2 = parseDate(dateString2);
  const totalDays1 = date1.year * 360 + date1.month * 30 + date1.day;
  const totalDays2 = date2.year * 360 + date2.month * 30 + date2.day;

  let differenceInDays = Math.abs(totalDays2 - totalDays1);

  const years = Math.floor(differenceInDays / 360);
  differenceInDays %= 360;

  const months = Math.floor(differenceInDays / 30);
  const days = differenceInDays % 30;

  return `${years}-${months}-${days}`;
}

export function crt(fixedDate: string, relativeDate: string): string {
  const date1 = parseDate(fixedDate);
  const date2 = parseDate(relativeDate);
  const totalDays1 = date1.year * 360 + date1.month * 30 + date1.day;
  const totalDays2 = date2.year * 360 + date2.month * 30 + date2.day;

  const difference = totalDays2 - totalDays1;
  if (difference === 0) return "";
  return difference > 0 ? "-" : "+";
}
