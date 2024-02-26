import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { TFile, Vault } from "obsidian";
import { Logger } from "src/util";

export class CSVUtils {
  // Static methods for helping with CSV parsing.

  static async getCSVByPath(filePath: string, vault: Vault): Promise<string[][]> {
    const file = vault.getAbstractFileByPath(filePath);
    if (file === null) {
      Logger.error(this, "File not found.");
      return [];
    }
    const content = await vault.read(file as TFile);
    return parse(content);
  }

  static async saveCSVByPath(filePath: string, content: unknown[], vault: Vault) {
    const file = vault.getAbstractFileByPath(filePath);
    if (file === null) {
      vault.create(filePath, stringify(content));
    } else {
      await vault.modify(file as TFile, stringify(content));
    }
  }

  static csvArrayToStringArray(csvArray: unknown[][]): string[][] {
    const result: string[][] = [];
    for (let i = 0; i < csvArray.length; i++) {
      const row = csvArray[i];
      const rowArray: string[] = [];
      for (let j = 0; j < row.length; j++) {
        rowArray.push(row[j] as string);
      }
      result.push(rowArray);
    }
    return result;
  }

  static stringifyStringArray(content: string[][]): string {
    const stringified = stringify(content);
    return stringified;
  }

  static parseCSVString(content: string): string[][] {
    const parsed = parse(content);
    const converted = this.csvArrayToStringArray(parsed);
    return converted;
  }

  /**
   * Converts a CSV content into a plain JavaScript object (POJO).
   * @param content - The CSV content as a 2D array of strings.
   * @param useInternalHeaders - Optional. The headers to use for the POJO. If set to true, the first row of the CSV content will be used as headers. If set to an array of strings, those strings will be used as headers. Defaults to true.
   * @returns The converted POJO.
   */
  static csvToPojo(content: string[][], useInternalHeaders: string[] | true = true): unknown {
    const pojo: any = [];

    let headers;
    if (useInternalHeaders === true) {
      headers = content.shift();
      if (headers === undefined) {
        Logger.error(this, "CSV has no headers.");
        return undefined;
      }
    } else {
      headers = useInternalHeaders;
    }

    for (const row of content) {
      const pojoRow: any = {};
      for (let i = 0; i < row.length; i++) {
        const value = row[i];
        const header = headers[i];
        pojoRow[header] = value;
      }
      pojo.push(pojoRow);
    }
    return pojo;
  }
}
