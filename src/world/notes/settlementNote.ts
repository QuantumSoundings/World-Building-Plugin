import WorldBuildingPlugin from "src/main";
import { LinkText, WBNote } from "./wbNote";
import { TFile } from "obsidian";
import { DataUtils } from "src/util/dataUtils";
import { Logger } from "src/util/Logger";
import { SettlementSchema, type NonLivingDates } from "src/types/frontMatterTypes";
import { fromError } from "zod-validation-error";

export class SettlementNote extends WBNote {
  // Front Matter Configuration Values
  dates: NonLivingDates;
  demographics: {
    settlementType: string;
    populationScale: number;
  };
  relations: {
    parentNote: LinkText;
    rulingParty: LinkText;
  };

  // Calculated values
  population: number;

  constructor(plugin: WorldBuildingPlugin, file: TFile) {
    super(plugin, file);
  }

  public override async update() {
    const result = SettlementSchema.safeParse(
      await this.plugin.frontMatterManager.getFrontMatterReadOnly(this.file.path)
    );
    if (result.success) {
      const fm = result.data;
      this.wbNoteType = fm.wbNoteType;
      this.dates = this.parseDates(fm.dates);
      this.demographics = {
        settlementType: fm.demographics.settlementType,
        populationScale: fm.demographics.populationScale,
      };
      this.relations = {
        parentNote: new LinkText(fm.relations.parentNote ?? "", this.plugin),
        rulingParty: new LinkText(fm.relations.rulingParty ?? "", this.plugin),
      };
      const settlementPopulation = DataUtils.generateSettlementPopulation(
        this.demographics.settlementType,
        this.demographics.populationScale
      );
      if (settlementPopulation === undefined) {
        Logger.error(this, "Failed to generate population for settlement");
        return;
      }
      this.population = settlementPopulation;
    } else {
      this.error = fromError(result.error).toString();
    }
  }
}
