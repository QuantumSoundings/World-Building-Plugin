import { TFile, parseYaml, stringifyYaml } from "obsidian";
import WorldBuildingPlugin from "src/main";
import { Logger } from "src/util/Logger";

class FrontMatterParsedInfo {
  frontMatterFound: boolean;
  frontDelimiterIndex: number;
  endDelimiterIndex: number;
  frontMatter: string;
}

export class YAMLUtils {
  static async validYaml(plugin: WorldBuildingPlugin, fullPath: string): Promise<boolean> {
    try {
      const file = plugin.app.vault.getAbstractFileByPath(fullPath);
      const content = await plugin.app.vault.read(file as TFile);
      const parsed = YAMLUtils.parseMarkdownFile(content);
      if (parsed !== undefined) {
        parseYaml(parsed.frontMatter);
      }

      return true;
    } catch (e) {
      return false;
    }
  }
  static parseMarkdownFile(content: string): FrontMatterParsedInfo | undefined {
    const parseResults = new FrontMatterParsedInfo();
    parseResults.frontMatterFound = false;
    parseResults.frontDelimiterIndex = 0;
    parseResults.endDelimiterIndex = 0;

    const lines = content.split("\n");
    // Set front delimiter index
    if (lines[0] === "---") {
      parseResults.frontDelimiterIndex = 0;
    } else if (lines[0] !== "---") {
      // If there are no delimiters, there is no frontmatter.
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("---")) {
          parseResults.frontDelimiterIndex = i;
          break;
        }
      }
      // There is no front matter return the special 00 case
      if (parseResults.frontDelimiterIndex === 0) {
        parseResults.frontMatter = "";
        return parseResults;
      }
      // Otherwise its invalid
      Logger.error(this, "Invalid frontmatter.");
      return undefined;
    }

    // Set end delimiter index
    let foundEnd = false;
    for (let i = 1; i < lines.length; i++) {
      if (!foundEnd && lines[i].startsWith("---")) {
        parseResults.endDelimiterIndex = i;
        foundEnd = true;
      } else if (foundEnd && lines[i].startsWith("---")) {
        Logger.error(this, "Invalid frontmatter. Multiple end delimiters found.");
        return undefined;
      }
    }

    // Validate Indexes
    if (parseResults.endDelimiterIndex === 0) {
      Logger.error(this, "Invalid frontmatter. End delimiter not found.");
      return undefined;
    }
    // If there is no frontmatter
    else if (parseResults.frontDelimiterIndex + 1 === parseResults.endDelimiterIndex) {
      parseResults.frontMatter = "";
      return parseResults;
    } else {
      parseResults.frontMatter = lines
        .slice(parseResults.frontDelimiterIndex + 1, parseResults.endDelimiterIndex)
        .join("\n");
      return parseResults;
    }
  }

  static replaceFrontMatter(currentFileContent: string, newFrontMatter: unknown | string): string {
    const fmp = this.parseMarkdownFile(currentFileContent);
    if (fmp === undefined) {
      return currentFileContent;
    }

    // Stringify the new front matter
    let newFMString = "";
    if (typeof newFrontMatter === "string") {
      newFMString = newFrontMatter;
    } else {
      newFMString = stringifyYaml(newFrontMatter);
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
