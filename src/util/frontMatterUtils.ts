import { WB_NOTE_PROP_NAME } from "src/world/notes/wbNote";
import { WBNoteTypeEnum } from "src/constants";
import { Logger } from "./Logger";
import { stringifyYaml } from "obsidian";

class FrontMatterParsedInfo {
  frontMatterFound: boolean;
  frontDelimiterIndex: number;
  endDelimiterIndex: number;
  frontMatter: string;
}

export class FMUtils {
  static validateWBNoteType(fm: any): boolean {
    if (fm === null) return false;
    if (!fm.hasOwnProperty(WB_NOTE_PROP_NAME)) return false;
    if (fm[WB_NOTE_PROP_NAME] === undefined) return false;
    const noteType = fm[WB_NOTE_PROP_NAME] as WBNoteTypeEnum;
    if (!Object.values(WBNoteTypeEnum).includes(noteType)) return false;
    return true;
  }

  static parseMarkdownFile(content: string): FrontMatterParsedInfo | undefined {
    const parseResults = new FrontMatterParsedInfo();
    parseResults.frontMatterFound = false;
    parseResults.frontDelimiterIndex = 0;
    parseResults.endDelimiterIndex = 0;

    const lines = content.split(/\r?\n/);
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
      const lines = currentFileContent.split(/\r?\n/);
      lines.splice(fmp.frontDelimiterIndex + 1, fmp.endDelimiterIndex - fmp.frontDelimiterIndex - 1, newFMString);
      return lines.join("\n");
    }
  }
}
