import WorldBuildingPlugin from "src/main";
import { BaseNote } from "./baseNote";
import { TFile } from "obsidian";

export class NationNote extends BaseNote {
  constructor(plugin: WorldBuildingPlugin, file: TFile) {
    super(plugin, file);
  }
}
