import { TAbstractFile } from "obsidian";
import WorldBuildingPlugin from "../main";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { CacheManager } from "./cacheManager";
import { Logger } from "src/util";
import { Result } from "src/errors/result";
import { BaseError } from "src/errors/baseError";

// Manages the state of all the csv files in the project.
// All operations on csv files should go through this class.
// Including reading Files, writing Files, data parsing, and data caching.
type CacheType = string[][];
export class CSVManager extends CacheManager<CacheType> {
  constructor(plugin: WorldBuildingPlugin) {
    super(plugin);
  }

  override async readFile(fullPath: string): Promise<Result<CacheType>> {
    if (fullPath.endsWith(".csv")) {
      const content = await this.plugin.adapter.read(fullPath);
      const parsed = parse(content);
      const converted = CSVManager.csvArrayToStringArray(parsed);
      return { success: true, result: converted };
    } else {
      Logger.error(this, "Invalid file extension.");
      return { success: false, error: new BaseError("Invalid file extension.") };
    }
  }

  override async writeFile(fullPath: string, content: CacheType | unknown, options: any = null): Promise<Result<void>> {
    if (fullPath.endsWith(".csv")) {
      if (content instanceof Array) {
        const stringified = stringify(content, options);
        await this.plugin.adapter.write(fullPath, stringified);
        return { success: true, result: undefined };
      } else {
        Logger.error(this, "Invalid content type.");
      }
    } else {
      Logger.error(this, "Invalid file extension.");
    }
    return { success: false, error: new BaseError("Invalid file extension.") };
  }

  override isFileManageable(file: TAbstractFile): boolean {
    if (file.name.endsWith(".csv")) {
      return true;
    }
    return false;
  }

  // Static methods for helping with CSV parsing.
  private static csvArrayToStringArray(csvArray: unknown[][]): CacheType {
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

  static csvToPojoWithIncludedHeaders(content: string[][]): unknown {
    const pojo: any = [];
    const headers = content.shift();
    if (headers === undefined) {
      Logger.error(this, "CSV has no headers.");
      return undefined;
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

  static csvToPojoWithoutHeaders(content: string[][], headers: string[]): unknown {
    const pojo: any = [];

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
