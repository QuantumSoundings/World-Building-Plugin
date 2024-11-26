import type { TFile } from "obsidian";
import type WorldBuildingPlugin from "src/main";
import { FMUtils } from "src/util/frontMatterUtils";
import { LinkText, WB_NOTE_PROP_NAME, WBNote } from "./wbNote";
import { calculateTimeDifference } from "src/util/time";

export class OrganizationNote extends WBNote {
  // Front Matter Configuration Values
  foundingDate: string;
  relations: {
    rulingParty: LinkText;
  };

  // Other values
  age: string; // Age of the organization, current date - founded date

  constructor(plugin: WorldBuildingPlugin, file: TFile) {
    super(plugin, file);
  }

  public override async update() {
    const frontMatter = await this.plugin.frontMatterManager.getFrontMatterReadOnly(this.file.path);
    if (FMUtils.validateWBNoteType(frontMatter)) {
      this.wbNoteType = frontMatter[WB_NOTE_PROP_NAME];
      if (this.checkForProperty(frontMatter, "foundingDate")) {
        this.foundingDate = frontMatter.foundingDate;
        this.age = calculateTimeDifference(this.foundingDate, this.plugin.settings.currentDate);
      }
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
