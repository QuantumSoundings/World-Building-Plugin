import { TFile } from "obsidian";
import WorldBuildingPlugin from "src/main";

export class BaseNote {
  name: string;
  plugin: WorldBuildingPlugin;
  file: TFile;

  constructor(plugin: WorldBuildingPlugin, file: TFile) {
    this.plugin = plugin;
    this.file = file;
    this.name = file.name;
  }

  public reloadNote(newFile: TFile) {
    this.file = newFile;
    this.name = newFile.name;
  }
}
