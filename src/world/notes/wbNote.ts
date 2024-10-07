import { TFile } from "obsidian";
import WorldBuildingPlugin from "src/main";
import type { WBNoteTypeEnum } from "src/constants";

export const WB_NOTE_PROP_NAME = "wbNoteType";

export type NoteOrText = string | WBNote;

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
