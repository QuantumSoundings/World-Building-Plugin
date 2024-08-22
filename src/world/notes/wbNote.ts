import { TFile } from "obsidian";
import { PointOfInterest } from "src/types/dataTypes";
import WorldBuildingPlugin from "src/main";

export enum WBNoteTypeEnum {
  NATION = "nation",
  SETTLEMENT = "settlement",
}

export const WB_NOTE_PROP_NAME = "wbNoteType";

export interface MappableNote {
  getPointOfInterest(): PointOfInterest;
}

export function instanceOfMappableNote(object: any): object is MappableNote {
  return "getPointOfInterest" in object;
}

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
    this.name = newFile.name;
  }

  public async update() {}
}
