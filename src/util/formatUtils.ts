export class FormattedNumber {
  value: number;
  unit: string;

  constructor(value: number, unit: string) {
    this.value = value;
    this.unit = unit;
  }
}

export function numberF(value: number | FormattedNumber): string {
  if (typeof value === "number") {
    return value.toLocaleString("en-US");
  }

  return `${value.value.toLocaleString("en-US")}${value.unit ? ` ${value.unit}` : ""}`;
}
