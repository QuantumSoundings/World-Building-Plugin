import { TAbstractFile, TFile } from "obsidian";
import WorldBuildingPlugin from "../main";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { CacheManager } from "./cacheManager";
import { Logger } from "src/util";
import { Result } from "src/errors/result";
import { BaseError } from "src/errors/baseError";
import { CSVUtils } from "src/util/csv";

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
      const file = this.plugin.app.vault.getAbstractFileByPath(fullPath);
      if (file === null) {
        Logger.error(this, "File not found.");
        return { success: false, error: new BaseError("File not found.") };
      }
      const content = await this.plugin.app.vault.read(file as TFile);
      //const content = await this.plugin.adapter.read(fullPath);
      const parsed = parse(content);
      const converted = CSVUtils.csvArrayToStringArray(parsed);
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
        const file = this.plugin.app.vault.getAbstractFileByPath(fullPath);
        if (file === null) {
          this.plugin.app.vault.create(fullPath, stringified);
        } else {
          await this.plugin.app.vault.modify(file as TFile, stringified);
        }
        //await this.plugin.adapter.write(fullPath, stringified);
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
    if (file.path.endsWith(".csv")) {
      return true;
    }
    return false;
  }

  // Tests to see if I can remove the csv manager
  public async getCsvData(fullPath: string): Promise<string[][]> {
    const file = this.plugin.app.vault.getAbstractFileByPath(fullPath);
    if (file === null) {
      Logger.error(this, "File not found.");
      return [];
    }
    const content = await this.plugin.app.vault.cachedRead(file as TFile);

    const parsed = parse(content);
    const converted = CSVUtils.csvArrayToStringArray(parsed);
    return converted;
  }

  public async saveCsvData(fullPath: string, data: unknown[]) {
    const stringified = stringify(data);
    const file = this.plugin.app.vault.getAbstractFileByPath(fullPath);
    if (file === null) {
      await this.plugin.app.vault.create(fullPath, stringified);
    } else {
      await this.plugin.app.vault.modify(file as TFile, stringified);
    }
  }
}
