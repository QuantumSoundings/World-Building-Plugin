import type { TFile } from "obsidian";
import { WB_NOTE_PROP_NAME, WBNote } from "./wbNote";
import type WorldBuildingPlugin from "src/main";
import { FMUtils } from "src/util/frontMatterUtils";
import type { WBTalentEnum } from "src/constants";

export class CharacterNote extends WBNote {
  // Front Matter Configuration Values
  birthDate: string;
  species: string;
  citizenship: string;
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
      if (frontMatter.hasOwnProperty("birthDate")) {
        this.birthDate = frontMatter.birthDate;
      }
      if (frontMatter.hasOwnProperty("species")) {
        this.species = frontMatter.species;
      }
      if (frontMatter.hasOwnProperty("citizenship")) {
        this.citizenship = frontMatter.citizenship;
      }
      if (frontMatter.hasOwnProperty("mana")) {
        this.mana = {
          cultivation: frontMatter.mana.cultivation,
          attributes: frontMatter.mana.attributes,
          blessing: frontMatter.mana.blessing,
        };
      }
      if (frontMatter.hasOwnProperty("talent")) {
        this.talent = {
          physical: frontMatter.talent.physical,
          mana: frontMatter.talent.mana,
          blessing: frontMatter.talent.blessing,
        };
      }
    }
  }
}
