import type { TFile } from "obsidian";
import type WorldBuildingPlugin from "src/main";
import { FMUtils } from "src/util/frontMatterUtils";
import { DateType, LinkText, WB_NOTE_PROP_NAME, WBNote, type Dates } from "./wbNote";

export class OrganizationNote extends WBNote {
  // Front Matter Configuration Values
  dates: Dates;
  relations: {
    rulingParty: LinkText;
  };

  constructor(plugin: WorldBuildingPlugin, file: TFile) {
    super(plugin, file);
  }

  public override async update() {
    const frontMatter = await this.plugin.frontMatterManager.getFrontMatterReadOnly(this.file.path);
    if (FMUtils.validateWBNoteType(frontMatter)) {
      this.wbNoteType = frontMatter[WB_NOTE_PROP_NAME];
      this.dates = this.parseDates(frontMatter, DateType.nonLiving);
      if (
        this.checkForProperty(frontMatter, "relations") &&
        this.checkForProperty(frontMatter.relations, "rulingParty")
      ) {
        this.relations = {
          rulingParty: new LinkText("", this.plugin),
        };
        if (typeof frontMatter.relations.rulingParty === "string") {
          this.relations.rulingParty = new LinkText(frontMatter.relations.rulingParty, this.plugin);
        }
      }
    }
  }
}
