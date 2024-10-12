import { parseLinktext } from "obsidian";
import type WorldBuildingPlugin from "src/main";

export class FileUtils {
  // Verify the string is formatted as "[[link]]" or "[[link#heading]]",
  // the return the link without brackets.
  static validLink(linkText: string): boolean {
    return linkText.startsWith("[[") && linkText.endsWith("]]");
  }

  public static parseBracketLink(linkText: string): string {
    if (FileUtils.validLink(linkText)) {
      return linkText.slice(2, -2);
    }
    return linkText;
  }

  public static attemptParseLinkToNote(linkText: string, plugin: WorldBuildingPlugin) {
    const file = this.attemptParseLinkToFile(linkText, plugin);
    if (typeof file === "string") {
      return linkText;
    }
    const note = plugin.worldEngine.getWBNoteByFile(file);
    if (note === undefined) {
      return linkText;
    } else {
      return note;
    }
  }

  public static attemptParseLinkToFile(linkText: string, plugin: WorldBuildingPlugin) {
    const parsedLinkText = FileUtils.parseBracketLink(linkText);
    const { path } = parseLinktext(parsedLinkText);
    const file = plugin.app.metadataCache.getFirstLinkpathDest(path, "");
    if (file === null) {
      return linkText;
    }
    return file;
  }
}
