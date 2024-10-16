import { TFile } from "obsidian";
import WorldBuildingPlugin from "src/main";
import type { WBNoteTypeEnum } from "src/constants";
import { FileUtils } from "src/util/fileUtils";

export const WB_NOTE_PROP_NAME = "wbNoteType";

export class WBNote {
  plugin: WorldBuildingPlugin;
  file: TFile;

  name: string;
  wbNoteType: WBNoteTypeEnum;

  constructor(plugin: WorldBuildingPlugin, file: TFile) {
    this.plugin = plugin;
    this.file = file;
    this.name = file.name.replace(".md", "");
  }

  public setFile(newFile: TFile) {
    this.file = newFile;
    this.name = newFile.name.replace(".md", "");
  }

  public async update() {}
}

export class LinkText {
  linkText: string;
  resolvedFile: TFile | undefined;
  resolvedNote: WBNote | undefined;

  constructor(linkText: string, plugin: WorldBuildingPlugin) {
    this.linkText = linkText;
    this.resolvedFile = FileUtils.attemptParseLinkToFile(linkText, plugin);
    if (this.resolvedFile !== undefined) {
      this.resolvedNote = plugin.worldEngine.getWBNoteByFile(this.resolvedFile);
    }
  }
}
