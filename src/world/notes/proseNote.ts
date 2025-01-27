import type WorldBuildingPlugin from "src/main";
import { LinkText, WBNote } from "./wbNote";
import { TFile } from "obsidian";
import { CharacterNote } from "./characterNote";
import { ProseSchema, type StoryDates } from "src/types/frontMatterTypes";
import { fromError } from "zod-validation-error";

export class ProseNote extends WBNote {
  dates: StoryDates;
  sceneLocations: LinkText[] = [];
  characters: Set<LinkText>;

  constructor(plugin: WorldBuildingPlugin, file: TFile, fm: unknown) {
    super(plugin, file, fm);
    this.characters = new Set<LinkText>();
  }

  public override update() {
    super.update();
    const result = ProseSchema.safeParse(this.fm);
    if (result.success) {
      const fm = result.data;
      this.wbNoteType = fm.wbNoteType;
      this.dates = this.parseDates(fm.dates);
      this.sceneLocations = [];
      for (const location of fm.sceneLocations) {
        const locationLink = new LinkText(location, this.plugin);
        if (locationLink.resolvedFile !== undefined) {
          this.sceneLocations.push(locationLink);
        }
      }
      this.characters.clear();
      for (const character of fm.characters) {
        const characterLink = new LinkText(character, this.plugin);
        if (characterLink.resolvedNote !== undefined && characterLink.resolvedNote instanceof CharacterNote) {
          this.characters.add(characterLink);
        }
      }
    } else {
      this.error = fromError(result.error).toString();
    }
  }
}
