import WorldBuildingPlugin from "src/main";
import { LinkText, WB_NOTE_PROP_NAME, WBNote } from "./wbNote";
import { TFile } from "obsidian";
import { FMUtils } from "src/util/frontMatterUtils";
import { DataUtils } from "src/util/dataUtils";
import { Logger } from "src/util/Logger";

export class SettlementNote extends WBNote {
  // Front Matter Configuration Values
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

  constructor(plugin: WorldBuildingPlugin, file: TFile) {
    super(plugin, file);
  }

  public override async update() {
    const frontMatter = await this.plugin.frontMatterManager.getFrontMatterReadOnly(this.file.path);
    if (FMUtils.validateWBNoteType(frontMatter)) {
      this.wbNoteType = frontMatter[WB_NOTE_PROP_NAME];
      if (
        FMUtils.checkForProperty(frontMatter, "demographics") &&
        FMUtils.checkForProperty(frontMatter.demographics, "settlementType") &&
        FMUtils.checkForProperty(frontMatter.demographics, "populationScale")
      ) {
        this.demographics = {
          settlementType: frontMatter.demographics.settlementType,
          populationScale: frontMatter.demographics.populationScale,
        };
      }
      if (
        FMUtils.checkForProperty(frontMatter, "relations") &&
        FMUtils.checkForProperty(frontMatter.relations, "parentNote") &&
        FMUtils.checkForProperty(frontMatter.relations, "rulingParty")
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
