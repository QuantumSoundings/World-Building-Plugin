export class Utils {
  static formatRow(values: any[]) {
    let output = "|";
    for (let value of values) {
      if (typeof value === "number") {
        value = this.formatNumber(value);
      }
      output += " " + value + " |";
    }
    return output + "\n";
  }

  static formatNumber(value: number) {
    return value.toLocaleString("en-US");
  }

  static formatNumberWithUnit(value: number, unit: string) {
    return this.formatNumber(value) + unit;
  }

  static round(value: number) {
    return Math.round(value);
  }

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
      num = Utils.generateGaussianValue(min, max, skew); // resample between 0 and 1 if out of range
    } else {
      num = Math.pow(num, skew); // Skew
      num *= max - min; // Stretch to fill range
      num += min; // offset to min
    }
    return num;
  }

  static markdownTableToHtml(rootElement: HTMLElement, table: string) {
    const rows = table.split("\n");
    const headerRow = rows.shift();
    if (headerRow === undefined) {
      return;
    }
    // Shift off the separator row.
    rows.shift();

    const tableElement = rootElement.createEl("table");
    const headerElement = tableElement.createEl("thead");
    const headerRowElement = headerElement.createEl("tr");
    for (const headerCell of headerRow.trim().slice(1, -1).split("|")) {
      headerRowElement.createEl("th", { text: headerCell.trim() });
    }

    const bodyElement = tableElement.createEl("tbody");
    for (const row of rows) {
      const rowElement = bodyElement.createEl("tr");
      for (const cell of row.trim().slice(1, -1).split("|")) {
        rowElement.createEl("td", { text: cell.trim() });
      }
    }
  }
}

export class Logger {
  // Always enabled, when something broke and recovery is not possible
  public static error(classObject: any, message: any) {
    console.error(`${classObject.constructor.name}: `, message);
  }
  // Always enabled, when something didn't break but might be a user mistake or an unexpected situation
  public static warn(classObject: any, message: any) {
    console.warn(`${classObject.constructor.name}: `, message);
  }
  // Always enabled, should only be for important messages
  public static info(classObject: any, message: any) {
    console.info(`${classObject.constructor.name}: `, message);
  }
  // Only enabled during development, verbose mode
  public static debug(classObject: any, message: any) {
    console.debug(`${classObject.constructor.name}: `, message);
  }
}
