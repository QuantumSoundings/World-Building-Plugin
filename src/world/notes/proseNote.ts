import type WorldBuildingPlugin from "src/main";
import { WB_NOTE_PROP_NAME, WBNote } from "./wbNote";
import { getLinkpath, type TFile } from "obsidian";
import { FMUtils } from "src/util/frontMatterUtils";
import { CharacterNote } from "./characterNotes";
import { FileUtils } from "src/util/fileUtils";

export class ProseNote extends WBNote {
  storyDate: string;
  sceneLocations: string[];

  characters: Set<CharacterNote>;

  constructor(plugin: WorldBuildingPlugin, file: TFile) {
    super(plugin, file);
    this.characters = new Set<CharacterNote>();
  }

  public override async update() {
    const frontMatter = await this.plugin.frontMatterManager.getFrontMatterReadOnly(this.file.path);
    if (FMUtils.validateWBNoteType(frontMatter)) {
      this.wbNoteType = frontMatter[WB_NOTE_PROP_NAME];
      if (frontMatter.hasOwnProperty("storyDate")) {
        this.storyDate = frontMatter.storyDate;
      }
      if (frontMatter.hasOwnProperty("sceneLocations")) {
        this.sceneLocations = frontMatter.sceneLocations;
      }
      if (frontMatter.hasOwnProperty("characters")) {
        this.characters.clear();
        for (let character of frontMatter.characters as string[]) {
          character = getLinkpath(FileUtils.parseBracketLink(character));
          const note = await this.plugin.worldEngine.getWBNoteByName(character);
          if (note instanceof CharacterNote) {
            this.characters.add(note);
          }
        }
      }
    }
  }
}
