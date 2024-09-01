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

export class FormatUtils {
  static generateGaussianValue(min: number, max: number, skew: number) {
    let u = 0;
    let v = 0;
    while (u === 0) {
      //Converting [0,1) to (0,1)
      u = Math.random();
    }
    while (v === 0) {
      v = Math.random();
    }
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) {
      num = FormatUtils.generateGaussianValue(min, max, skew); // resample between 0 and 1 if out of range
    } else {
      num = Math.pow(num, skew); // Skew
      num *= max - min; // Stretch to fill range
      num += min; // offset to min
    }
    return num;
  }
}
