import WorldBuildingPlugin from "src/main";
import { WB_NOTE_PROP_NAME, WBNote } from "./wbNote";
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
    parentNote: string;
    rulingParty: string;
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
      if (frontMatter.hasOwnProperty("demographics")) {
        this.demographics = {
          settlementType: frontMatter.demographics.settlementType,
          populationScale: frontMatter.demographics.populationScale,
        };
      }
      if (frontMatter.hasOwnProperty("relations")) {
        this.relations = {
          parentNote: frontMatter.relations.parentNote,
          rulingParty: frontMatter.relations.rulingParty,
        };
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
