import { parseLinktext, TFile } from "obsidian";
import type WorldBuildingPlugin from "src/main";

export class FileUtils {
  // Attempt to parse link text and return file using obsidian api
  public static attemptParseLinkToFile(linkText: string, plugin: WorldBuildingPlugin): TFile | undefined {
    if (linkText.startsWith("[[") && linkText.endsWith("]]")) {
      linkText = linkText.slice(2, -2);
    }
    const { path } = parseLinktext(linkText);
    const file = plugin.app.metadataCache.getFirstLinkpathDest(path, "");
    return file ?? undefined;
  }
}
