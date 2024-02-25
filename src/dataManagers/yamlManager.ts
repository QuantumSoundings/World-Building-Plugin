import { TAbstractFile } from "obsidian";
import WorldBuildingPlugin from "../main";
import { parse, stringify } from "yaml";
import { CacheManager } from "./cacheManager";
import { Logger } from "src/util";
import { Result } from "src/errors/result";
import { BaseError } from "src/errors/baseError";

type CacheType = unknown[];
// Manages yaml files and md files in the data directory.
export class YAMLManager extends CacheManager<CacheType> {
  constructor(plugin: WorldBuildingPlugin) {
    super(plugin);
  }

  // Public api for reading and writing yaml files that bypasses the cache.
  // Prefer using the get and set methods to make use of the cache.
  override async readFile(fullPath: string): Promise<Result<CacheType>> {
    if (fullPath.endsWith("yaml") || fullPath.endsWith("yml")) {
      const content = await this.plugin.adapter.read(fullPath);
      const parsed = parse(content);
      return parsed;
    } else {
      return { success: false, error: new BaseError("Invalid file extension.") };
    }
  }

  override async writeFile(fullPath: string, content: unknown, options: any = null): Promise<Result<void>> {
    if (options !== null) {
      Logger.warn(this, "Options are not supported for yaml files.");
    }

    const cacheEntry = this.fileCache.get(fullPath);
    if (cacheEntry !== undefined) {
      if (cacheEntry.unsavedChanges) {
        return {
          success: false,
          error: new BaseError("Unsaved changes detected. Please save the file before writing to it."),
        };
      }
    }

    let newFileContent = "";
    if (fullPath.endsWith("yaml") || fullPath.endsWith("yml")) {
      newFileContent = stringify(content);
    } else {
      Logger.error(this, "Invalid file extension.");
      return { success: false, error: new BaseError("Invalid file extension.") };
    }

    Logger.debug(this, "Writing file: " + fullPath);
    await this.plugin.adapter.write(fullPath, newFileContent);
    return { success: true, result: undefined };
  }

  override isFileManageable(file: TAbstractFile): boolean {
    if (file.path.includes(".yaml") || file.path.includes(".yml")) {
      return true;
    }
    return false;
  }
}
