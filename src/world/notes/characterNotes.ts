import type { TFile } from "obsidian";
import { WB_NOTE_PROP_NAME, WBNote, type NoteOrText } from "./wbNote";
import type WorldBuildingPlugin from "src/main";
import { FMUtils } from "src/util/frontMatterUtils";
import type { WBTalentEnum } from "src/constants";
import { FileUtils } from "src/util/fileUtils";

export class CharacterNote extends WBNote {
  // Front Matter Configuration Values
  birthDate: string;
  species: NoteOrText;
  citizenship: NoteOrText;
  mana: {
    cultivation: string;
    attributes: string[];
    blessing: string;
  };
  talent: {
    physical: WBTalentEnum;
    mana: WBTalentEnum;
    blessing: WBTalentEnum;
  };

  constructor(plugin: WorldBuildingPlugin, file: TFile) {
    super(plugin, file);
  }

  public override async update() {
    const frontMatter = await this.plugin.frontMatterManager.getFrontMatterReadOnly(this.file.path);
    if (FMUtils.validateWBNoteType(frontMatter)) {
      this.wbNoteType = frontMatter[WB_NOTE_PROP_NAME];
      if (FMUtils.checkForProperty(frontMatter, "birthDate")) {
        this.birthDate = frontMatter.birthDate;
      }
      if (FMUtils.checkForProperty(frontMatter, "species")) {
        if (typeof frontMatter.species === "string") {
          this.species = FileUtils.attemptParseLinkToNote(frontMatter.species, this.plugin);
        }
      }
      if (FMUtils.checkForProperty(frontMatter, "citizenship")) {
        if (typeof frontMatter.citizenship === "string") {
          this.citizenship = FileUtils.attemptParseLinkToNote(frontMatter.citizenship, this.plugin);
        }
      }
      if (FMUtils.checkForProperty(frontMatter, "mana")) {
        this.mana = {
          cultivation: frontMatter.mana.cultivation,
          attributes: frontMatter.mana.attributes,
          blessing: frontMatter.mana.blessing,
        };
      }
      if (FMUtils.checkForProperty(frontMatter, "talent")) {
        this.talent = {
          physical: frontMatter.talent.physical,
          mana: frontMatter.talent.mana,
          blessing: frontMatter.talent.blessing,
        };
      }
    }
  }
}
