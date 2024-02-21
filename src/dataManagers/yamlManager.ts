import { TAbstractFile } from "obsidian";
import WorldBuildingPlugin from "../main";
import { parse, stringify } from "yaml";
import { CacheManager } from "./cacheManager";
import { Logger } from "src/util";
import { Result } from "src/errors/result";
import { BaseError } from "src/errors/baseError";
import { YAMLUtils } from "src/util/frontMatter";

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
    } /* else if (fullPath.endsWith("md")) {
      const content = await this.plugin.adapter.read(fullPath);
      const parsed = this.readFrontMatter(content);
      if (parsed === undefined) {
        return { success: false, error: new BaseError("Invalid frontmatter.") };
      }
      return { success: true, result: parsed };
    }*/ else {
      return { success: false, error: new BaseError("Invalid file extension.") };
    }
  }

  override async writeFile(fullPath: string, content: unknown, options: any = null): Promise<Result<void>> {
    if (options !== null) {
      Logger.warn(this, "Options are not supported for yaml files.");
    }

    //if (!(content instanceof Array)) {
    //  return { success: false, error: new BaseError("Invalid content type.") };
    //}
    const cacheEntry = this.fileCache.get(fullPath);
    let existingFile = false;
    if (cacheEntry !== undefined) {
      if (cacheEntry.unsavedChanges) {
        return {
          success: false,
          error: new BaseError("Unsaved changes detected. Please save the file before writing to it."),
        };
      }
      existingFile = true;
    }

    let newFileContent = "";
    if (fullPath.endsWith("yaml") || fullPath.endsWith("yml")) {
      newFileContent = stringify(content);
    } else if (fullPath.endsWith("md")) {
      if (existingFile) {
        const currentFileContent = await this.plugin.adapter.read(fullPath);
        newFileContent = YAMLUtils.replaceFrontMatter(currentFileContent, content);
      } else {
        newFileContent = "---\n" + stringify(content) + "\n---\n";
      }
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
      // || file.path.includes(".md")) {
      return true;
    }
    return false;
  }

  public async writeFrontMatterTemplate(fullPath: string, template: string) {
    const fileContent = await this.plugin.adapter.read(fullPath);
    const replacedContent = YAMLUtils.replaceFrontMatter(fileContent, template);
    await this.plugin.adapter.write(fullPath, replacedContent);
  }

  private readFrontMatter(content: string): unknown[] | undefined {
    const fmp = YAMLUtils.parseMarkdownFile(content);
    if (fmp === undefined) {
      return undefined;
    }

    return parse(fmp.frontMatter);
  }
}
