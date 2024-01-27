import { TAbstractFile } from "obsidian";
import WorldBuildingPlugin from "../main";
import { parse, stringify } from "yaml";
import { CacheManager } from "./cacheManager";

// Manages yaml files and md files in the data directory.
export class YAMLManager extends CacheManager<unknown[]> {
  constructor(plugin: WorldBuildingPlugin) {
    super(plugin);
  }

  // Public api for reading and writing yaml files that bypasses the cache.
  // Prefer using the get and set methods to make use of the cache.
  override async readFile(fullPath: string): Promise<unknown[] | undefined> {
    if (fullPath.endsWith("yaml") || fullPath.endsWith("yml")) {
      const content = await this.plugin.adapter.read(fullPath);
      const parsed = parse(content);
      return parsed;
    } else if (fullPath.endsWith("md")) {
      const content = await this.plugin.adapter.read(fullPath);
      const lines = content.split("\n");
      const yamlLines = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].startsWith("---")) {
          break;
        }
        yamlLines.push(lines[i]);
      }
      const yamlContent = yamlLines.join("\n");
      const parsed = parse(yamlContent);
      return parsed;
    } else {
      console.error("Invalid file extension.");
      return undefined;
    }
  }

  override async writeFile<Content>(fullPath: string, content: Content, options: any = null) {
    if (fullPath.endsWith("yaml") || fullPath.endsWith("yml")) {
      await this.plugin.adapter.write(fullPath, stringify(content));
    } else if (fullPath.endsWith("md")) {
      const stringified = "---\n" + stringify(content) + "\n---\n";
      await this.plugin.adapter.write(fullPath, stringified);
    } else {
      console.error("Invalid file extension.");
    }
  }

  override isFileManageable(file: TAbstractFile): boolean {
    if (file.path.includes(this.plugin.settings.dataDirectory)) {
      if (file.path.includes(".yaml") || file.path.includes(".yml") || file.path.includes(".md")) {
        return true;
      }
    }
    return false;
  }
}
