import type WorldBuildingPlugin from "src/main";
import { WB_NOTE_PROP_NAME, WBNote, type NoteOrText } from "./wbNote";
import { type TFile } from "obsidian";
import { FMUtils } from "src/util/frontMatterUtils";
import { CharacterNote } from "./characterNotes";
import { FileUtils } from "src/util/fileUtils";

export class ProseNote extends WBNote {
  storyDate: string;
  sceneLocations: NoteOrText[];

  characters: Set<CharacterNote>;

  constructor(plugin: WorldBuildingPlugin, file: TFile) {
    super(plugin, file);
    this.characters = new Set<CharacterNote>();
  }

  public override async update() {
    const frontMatter = await this.plugin.frontMatterManager.getFrontMatterReadOnly(this.file.path);
    if (FMUtils.validateWBNoteType(frontMatter)) {
      this.wbNoteType = frontMatter[WB_NOTE_PROP_NAME];
      if (FMUtils.checkForProperty(frontMatter, "storyDate")) {
        this.storyDate = frontMatter.storyDate;
      }
      if (FMUtils.checkForProperty(frontMatter, "sceneLocations")) {
        this.sceneLocations = [];
        for (let location of frontMatter.sceneLocations as string[]) {
          const note = FileUtils.attemptParseLinkToNote(location, this.plugin);
          if (note instanceof WBNote) {
            this.sceneLocations.push(note);
          }
        }
      }
      if (FMUtils.checkForProperty(frontMatter, "characters")) {
        this.characters.clear();
        for (let character of frontMatter.characters as string[]) {
          const note = FileUtils.attemptParseLinkToNote(character, this.plugin);
          if (note instanceof CharacterNote) {
            this.characters.add(note);
          }
        }
      }
    }
  }
}
