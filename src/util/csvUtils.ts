import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { TFile, Vault } from "obsidian";
import { Logger } from "src/util/Logger";

export class CSVUtils {
  // Static methods for helping with CSV parsing.

  public static async readCSVByPath(filePath: string, vault: Vault, removeHeaderRow: boolean): Promise<string[][]> {
    const file = vault.getAbstractFileByPath(filePath);
    if (file === null) {
      Logger.error(this, "File not found.");
      return [];
    } else if (file instanceof TFile) {
      const content = await vault.read(file as TFile);
      const parsed = parse(content);
      if (removeHeaderRow) {
        parsed.shift();
      }
      const stringArray = this.csvArrayToStringArray(parsed);
      return stringArray;
    } else {
      Logger.error(this, "Attempting to read CSV file, but it is a folder.");
      return [];
    }
  }

  public static async writeCSVByPath(filePath: string, content: unknown[], vault: Vault, options: any = null) {
    const file = vault.getAbstractFileByPath(filePath);
    if (file === null) {
      vault.create(filePath, stringify(content, options));
    } else if (file instanceof TFile) {
      await vault.modify(file, stringify(content, options));
    } else {
      Logger.error(this, "Attempting to write CSV file, but path already exists and is a folder.");
    }
  }

  public static csvStringify(content: unknown[], options: any = null) {
    return stringify(content, options);
  }

  public static csvParse(content: string, removeHeaderRow: boolean, options: any = null): string[][] {
    const parsed = parse(content, options);
    if (removeHeaderRow) {
      parsed.shift();
    }
    const converted = this.csvArrayToStringArray(parsed);
    return converted;
  }

  public static csvArrayToStringArray(csvArray: unknown[][]): string[][] {
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

  /**
   * Converts a CSV content into a plain JavaScript object (POJO).
   * @param content - The CSV content as a 2D array of strings.
   * @param useInternalHeaders - Optional. The headers to use for the POJO. If set to true, the first row of the CSV content will be used as headers. If set to an array of strings, those strings will be used as headers. Defaults to true.
   * @returns The converted POJO.
   */
  public static csvToPojo(content: string[][], useInternalHeaders: string[] | true = true): unknown {
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
