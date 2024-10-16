import { TFile } from "obsidian";
import { LinkText, WB_NOTE_PROP_NAME, WBNote } from "./wbNote";
import type WorldBuildingPlugin from "src/main";
import { FMUtils } from "src/util/frontMatterUtils";
import { WBTalentEnum } from "src/constants";

export class CharacterNote extends WBNote {
  // Front Matter Configuration Values
  birthDate: string;
  species: LinkText;
  citizenship: LinkText;
  portrait: LinkText;
  portraitUrl: string | undefined;
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
          this.species = new LinkText(frontMatter.species, this.plugin);
        }
      }
      if (FMUtils.checkForProperty(frontMatter, "citizenship")) {
        if (typeof frontMatter.citizenship === "string") {
          this.citizenship = new LinkText(frontMatter.citizenship, this.plugin);
        }
      }
      if (FMUtils.checkForProperty(frontMatter, "portrait")) {
        if (typeof frontMatter.portrait === "string") {
          const newPortrait = new LinkText(frontMatter.portrait, this.plugin);
          // New portrait do clean up
          if (this.portrait !== undefined && newPortrait.linkText !== this.portrait.linkText) {
            if (this.portraitUrl) {
              URL.revokeObjectURL(this.portraitUrl);
              this.portraitUrl = undefined;
            }
          }
          this.portrait = newPortrait;
          if (this.portrait.resolvedFile instanceof TFile) {
            const portraitBinary = await this.plugin.app.vault.readBinary(this.portrait.resolvedFile);
            const blob = new Blob([portraitBinary], { type: "image/png" });
            this.portraitUrl = URL.createObjectURL(blob);
          }
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
          physical: WBTalentEnum.ERROR,
          mana: WBTalentEnum.ERROR,
          blessing: WBTalentEnum.ERROR,
        };

        const isValueIn = isValueInStringEnum(WBTalentEnum);

        if (
          FMUtils.checkForProperty(frontMatter.talent, "physical") &&
          isValueIn((frontMatter.talent.physical as string).toUpperCase())
        ) {
          this.talent.physical = frontMatter.talent.physical as WBTalentEnum;
        }

        if (
          FMUtils.checkForProperty(frontMatter.talent, "mana") &&
          isValueIn((frontMatter.talent.mana as string).toUpperCase())
        ) {
          this.talent.mana = frontMatter.talent.mana as WBTalentEnum;
        }

        if (
          FMUtils.checkForProperty(frontMatter.talent, "blessing") &&
          isValueIn((frontMatter.talent.blessing as string).toUpperCase())
        ) {
          this.talent.blessing = frontMatter.talent.blessing as WBTalentEnum;
        }
      }
    }
  }
}

function isValueInStringEnum<E extends string>(strEnum: Record<string, E>) {
  const enumValues = Object.values(strEnum) as string[];

  return (value: string): value is E => enumValues.includes(value);
}
