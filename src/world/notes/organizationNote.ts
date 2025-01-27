import type { TFile } from "obsidian";
import type WorldBuildingPlugin from "src/main";
import { LinkText, WBNote } from "./wbNote";
import { OrganizationSchema, type NonLivingDates } from "src/types/frontMatterTypes";
import { fromError } from "zod-validation-error";

export class OrganizationNote extends WBNote {
  dates: NonLivingDates;
  relations: {
    rulingParty: LinkText;
  };

  constructor(plugin: WorldBuildingPlugin, file: TFile, fm: unknown) {
    super(plugin, file, fm);
  }

  public override update() {
    super.update();
    const result = OrganizationSchema.safeParse(this.fm);
    if (result.success) {
      const fm = result.data;
      this.wbNoteType = fm.wbNoteType;
      this.dates = this.parseDates(fm.dates);
      this.relations = {
        rulingParty: new LinkText(fm.relations.rulingParty ?? "", this.plugin),
      };
    } else {
      this.error = fromError(result.error).toString();
    }
  }
}
