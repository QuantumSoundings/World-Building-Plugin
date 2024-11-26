import WorldBuildingPlugin from "src/main";
import { LinkText, WB_NOTE_PROP_NAME, WBNote } from "./wbNote";
import { TFile } from "obsidian";
import { FMUtils } from "src/util/frontMatterUtils";
import { DataUtils } from "src/util/dataUtils";
import { Logger } from "src/util/Logger";
import { calculateTimeDifference } from "src/util/time";

export class SettlementNote extends WBNote {
  // Front Matter Configuration Values
  foundingDate: string;
  demographics: {
    settlementType: string;
    populationScale: number;
  };

  relations: {
    parentNote: LinkText;
    rulingParty: LinkText;
  };

  // Other values
  population: number;
  age: string; // Age of the settlement, current date - founded date

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
        this.checkForProperty(frontMatter, "demographics") &&
        this.checkForProperty(frontMatter.demographics, "settlementType") &&
        this.checkForProperty(frontMatter.demographics, "populationScale")
      ) {
        this.demographics = {
          settlementType: frontMatter.demographics.settlementType,
          populationScale: frontMatter.demographics.populationScale,
        };
      }
      if (
        this.checkForProperty(frontMatter, "relations") &&
        this.checkForProperty(frontMatter.relations, "parentNote") &&
        this.checkForProperty(frontMatter.relations, "rulingParty")
      ) {
        this.relations = {
          parentNote: new LinkText("", this.plugin),
          rulingParty: new LinkText("", this.plugin),
        };
        if (typeof frontMatter.relations.parentNote === "string") {
          this.relations.parentNote = new LinkText(frontMatter.relations.parentNote, this.plugin);
        }
        if (typeof frontMatter.relations.rulingParty === "string") {
          this.relations.rulingParty = new LinkText(frontMatter.relations.rulingParty, this.plugin);
        }
      }

      const settlementPopulation = DataUtils.generateSettlementPopulation(
        this.demographics.settlementType,
        this.demographics.populationScale
      );
      if (settlementPopulation === undefined) {
        Logger.error(this, "Failed to generate population for settlement");
        return;
      }
      this.population = settlementPopulation;
    }
  }
}
