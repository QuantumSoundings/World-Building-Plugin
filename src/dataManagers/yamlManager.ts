import { TAbstractFile } from "obsidian";
import WorldBuildingPlugin from "../main";
import { parse, stringify } from "yaml";
import { CacheManager } from "./cacheManager";
import { Logger } from "src/util";
import { Result } from "src/errors/result";
import { BaseError } from "src/errors/baseError";

class FrontMatterParsed {
  frontDelimiterIndex: number;
  endDelimiterIndex: number;
  frontMatter: string;
}

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
    } else if (fullPath.endsWith("md")) {
      const content = await this.plugin.adapter.read(fullPath);
      const parsed = this.readFrontMatter(content);
      if (parsed === undefined) {
        return { success: false, error: new BaseError("Invalid frontmatter.") };
      }
      return { success: true, result: parsed };
    } else {
      return { success: false, error: new BaseError("Invalid file extension.") };
    }
  }

  override async writeFile(fullPath: string, content: CacheType | unknown, options: any = null): Promise<Result<void>> {
    if (options !== null) {
      Logger.warn(this, "Options are not supported for yaml files.");
    }

    if (!(content instanceof Array)) {
      return { success: false, error: new BaseError("Invalid content type.") };
    }
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
        newFileContent = this.replaceFrontMatter(currentFileContent, content);
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
    if (file.path.includes(this.plugin.settings.dataDirectory)) {
      if (file.path.includes(".yaml") || file.path.includes(".yml") || file.path.includes(".md")) {
        return true;
      }
    }
    return false;
  }

  public async writeFrontMatterTemplate(fullPath: string, template: string) {
    const fileContent = await this.plugin.adapter.read(fullPath);
    const replacedContent = this.replaceFrontMatter(fileContent, template);
    await this.plugin.adapter.write(fullPath, replacedContent);
  }

  private parseMD(content: string): FrontMatterParsed | undefined {
    const fmp = new FrontMatterParsed();
    fmp.frontDelimiterIndex = 0;
    fmp.endDelimiterIndex = 0;

    const lines = content.split("\n");
    // Set front delimiter index
    if (lines[0] === "---") {
      fmp.frontDelimiterIndex = 0;
    } else if (lines[0] !== "---") {
      // If there are no delimiters, there is no frontmatter.
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("---")) {
          fmp.frontDelimiterIndex = i;
          break;
        }
      }
      // There is no front matter return the special 00 case
      if (fmp.frontDelimiterIndex === 0) {
        fmp.frontMatter = "";
        return fmp;
      }
      // Otherwise its invalid
      Logger.error(this, "Invalid frontmatter.");
      return undefined;
    }

    // Set end delimiter index
    let foundEnd = false;
    for (let i = 1; i < lines.length; i++) {
      if (!foundEnd && lines[i].startsWith("---")) {
        fmp.endDelimiterIndex = i;
        foundEnd = true;
      } else if (foundEnd && lines[i].startsWith("---")) {
        Logger.error(this, "Invalid frontmatter. Multiple end delimiters found.");
        return undefined;
      }
    }

    // Validate Indexes
    if (fmp.endDelimiterIndex === 0) {
      Logger.error(this, "Invalid frontmatter. End delimiter not found.");
      return undefined;
    }
    // If there is no frontmatter
    else if (fmp.frontDelimiterIndex + 1 === fmp.endDelimiterIndex) {
      fmp.frontMatter = "";
      return fmp;
    } else {
      fmp.frontMatter = lines.slice(fmp.frontDelimiterIndex + 1, fmp.endDelimiterIndex).join("\n");
      return fmp;
    }
  }

  private readFrontMatter(content: string): unknown[] | undefined {
    const fmp = this.parseMD(content);
    if (fmp === undefined) {
      return undefined;
    }

    return parse(fmp.frontMatter);
  }

  private replaceFrontMatter(currentFileContent: string, newFrontMatter: CacheType | string): string {
    const fmp = this.parseMD(currentFileContent);
    if (fmp === undefined) {
      return currentFileContent;
    }

    // Stringify the new front matter
    let newFMString = "";
    if (typeof newFrontMatter === "string") {
      newFMString = newFrontMatter;
    } else {
      newFMString = stringify(newFrontMatter);
    }

    // If we have no frontmatter add it easily
    if (fmp.frontDelimiterIndex === 0 && fmp.endDelimiterIndex === 0) {
      return "---\n" + newFMString + "\n---\n" + currentFileContent;
    } else {
      const lines = currentFileContent.split("\n");
      lines.splice(fmp.frontDelimiterIndex + 1, fmp.endDelimiterIndex - fmp.frontDelimiterIndex - 1, newFMString);
      return lines.join("\n");
    }
  }
}
