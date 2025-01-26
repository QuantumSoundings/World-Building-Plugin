import { TFile } from "obsidian";
import { LinkText, WBNote } from "./wbNote";
import type WorldBuildingPlugin from "src/main";
import { WBTalentEnum } from "src/constants";
import { CharacterSchema, type CharacterFM, type LivingDates } from "src/types/frontMatterTypes";
import { fromError } from "zod-validation-error";

export class CharacterNote extends WBNote {
  // Front Matter Configuration Values
  species: LinkText;
  citizenship: LinkText;
  portrait: LinkText;
  portraitUrl: string | undefined;
  dates: LivingDates;
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
    const result = CharacterSchema.safeParse(
      await this.plugin.frontMatterManager.getFrontMatterReadOnly(this.file.path)
    );
    if (result.success) {
      const fm: CharacterFM = result.data;
      this.wbNoteType = fm.wbNoteType;
      this.dates = this.parseDates(fm.dates);
      this.species = new LinkText(fm.species ?? "", this.plugin);
      this.citizenship = new LinkText(fm.citizenship ?? "", this.plugin);
      const newPortrait = new LinkText(fm.portrait ?? "", this.plugin);
      // New portrait do clean up
      if (this.portrait !== undefined && newPortrait.linkText !== this.portrait.linkText) {
        if (this.portraitUrl !== undefined) {
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
      this.mana = {
        cultivation: fm.mana.cultivation ?? "",
        attributes: fm.mana.attributes ?? [],
        blessing: fm.mana.blessing ?? "",
      };
      this.talent = {
        physical: fm.talent.physical ?? WBTalentEnum.C,
        mana: fm.talent.mana ?? WBTalentEnum.C,
        blessing: fm.talent.blessing ?? WBTalentEnum.NONE,
      };
    } else {
      this.error = fromError(result.error).toString();
    }
  }
}
