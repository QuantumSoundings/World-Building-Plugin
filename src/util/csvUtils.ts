import { parse, type Options as ParseOptions } from "csv-parse/sync";
import { stringify, type Options as StringifyOptions } from "csv-stringify/sync";
import { TFile, Vault } from "obsidian";
import { Logger } from "src/util/Logger";

// Static methods for helping with CSV parsing.
export class CSVUtils {
  public static parseCSV(
    content: string,
    removeHeaderRow: boolean,
    options: ParseOptions | undefined = undefined
  ): string[][] {
    const parsed = parse(content, options) as unknown[][];
    if (parsed instanceof Array && parsed.length > 0) {
      if (removeHeaderRow) {
        parsed.shift();
      }
      const converted = this.csvArrayToStringArray(parsed);
      return converted;
    } else {
      Logger.error(this, "Failed to parse CSV string!");
      return [] as string[][];
    }
  }

  public static async readAndParseCSVByPath(
    filePath: string,
    vault: Vault,
    removeHeaderRow: boolean,
    options: ParseOptions | undefined = undefined
  ): Promise<string[][]> {
    const file = vault.getAbstractFileByPath(filePath);
    if (file === null) {
      Logger.error(this, "File not found.");
      return [];
    } else if (file instanceof TFile) {
      const content = await vault.read(file);
      return this.parseCSV(content, removeHeaderRow, options);
    } else {
      Logger.error(this, "Attempting to read CSV file, but it is a folder.");
      return [];
    }
  }

  public static stringifyCSV(content: unknown[], options: StringifyOptions | undefined = undefined) {
    return stringify(content, options);
  }

  public static async stringifyAndWriteCSVByPath(
    filePath: string,
    content: unknown[] | string,
    vault: Vault,
    options: StringifyOptions | undefined = undefined
  ) {
    const stringified = typeof content !== "string" ? this.stringifyCSV(content, options) : content;
    const file = vault.getAbstractFileByPath(filePath);
    if (file === null) {
      await vault.create(filePath, stringified);
    } else if (file instanceof TFile) {
      await vault.modify(file, stringified);
    } else {
      Logger.error(this, "Attempting to write CSV file, but path already exists and is a folder.");
    }
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
  /*public static csvToPojo(content: string[][], useInternalHeaders: string[] | true = true): unknown {
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
  }*/
}
