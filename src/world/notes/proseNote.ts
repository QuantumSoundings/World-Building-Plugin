import type WorldBuildingPlugin from "src/main";
import { DateType, LinkText, WB_NOTE_PROP_NAME, WBNote, type Dates } from "./wbNote";
import { TFile } from "obsidian";
import { FMUtils } from "src/util/frontMatterUtils";
import { CharacterNote } from "./characterNote";

export class ProseNote extends WBNote {
  // Front Matter Configuration Values
  dates: Dates;
  sceneLocations: LinkText[] = [];
  characters: Set<LinkText>;

  constructor(plugin: WorldBuildingPlugin, file: TFile) {
    super(plugin, file);
    this.characters = new Set<LinkText>();
  }

  public override async update() {
    const frontMatter = await this.plugin.frontMatterManager.getFrontMatterReadOnly(this.file.path);
    if (FMUtils.validateWBNoteType(frontMatter)) {
      this.wbNoteType = frontMatter[WB_NOTE_PROP_NAME];
      this.dates = this.parseDates(frontMatter, DateType.story);
      if (this.checkForProperty(frontMatter, "sceneLocations")) {
        this.sceneLocations = [];
        for (let location of frontMatter.sceneLocations as string[]) {
          const locationLink = new LinkText(location, this.plugin);
          if (locationLink.resolvedFile !== undefined) {
            this.sceneLocations.push(locationLink);
          }
        }
      }
      if (this.checkForProperty(frontMatter, "characters")) {
        this.characters.clear();
        for (let character of frontMatter.characters as string[]) {
          const characterLink = new LinkText(character, this.plugin);
          if (characterLink.resolvedNote !== undefined && characterLink.resolvedNote instanceof CharacterNote) {
            this.characters.add(characterLink);
          }
        }
      }
    }
  }
}
