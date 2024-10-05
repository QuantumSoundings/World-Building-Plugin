interface WBDate {
  year: number;
  month: number;
  day: number;
}

function parseDate(dateString: string): WBDate {
  const [year, month, day] = dateString.split("-").map(Number);
  const date: WBDate = { year, month, day };
  return date;
}

export function calculateTimeDifference(date1String: string, date2String: string): string {
  const date1 = parseDate(date1String);
  const date2 = parseDate(date2String);
  const totalDays1 = date1.year * 360 + date1.month * 30 + date1.day;
  const totalDays2 = date2.year * 360 + date2.month * 30 + date2.day;

  let differenceInDays = Math.abs(totalDays2 - totalDays1);

  const years = Math.floor(differenceInDays / 360);
  differenceInDays %= 360;

  const months = Math.floor(differenceInDays / 30);
  const days = differenceInDays % 30;

  return `${years}-${months}-${days}`;
}
