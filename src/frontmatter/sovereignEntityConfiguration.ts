import { Datasets, Distribution, WBMetaData } from "./sharedConfiguration";
import { Logger } from "src/util/Logger";

export class SovereignEntityConfiguration {
  name: string;

  geography: {
    size: number;
    sizeUnit: string;
    landFertility: number;
    landFertilityUnit: string;
    cultivatedLand: number;
    cultivatedLandUnit: string;
    generation: {
      method: string;
      unit: string;
    };
    territories: {
      type: string;
      value: number;
      parentTerritory: string;
    }[];
    settlements: Distribution[];
  };

  demographics: {
    lifeExpectancy: number;
    populationGrowthRate: number;
  };

  culture: {
    firstNameOrigin: string;
    lastNameOrigin: string;
    territoryNameOrigin: string;
    settlementNameOrigin: string;
  };

  species: Distribution[];

  languages: Distribution[];

  staticDatasets: Datasets;

  wbMeta: WBMetaData;

  constructor(fm: any | null) {
    if (fm === null) {
      Logger.warn(this, "Creating a blank SovereignEntityConfiguration");
      return;
    }
    if (!fm.hasOwnProperty("wbMeta")) {
      Logger.error(this, "Failed to find wbMeta in SovereignEntityConfiguration");
      return;
    }
    const wbMeta = fm.wbMeta as WBMetaData;
    if (wbMeta.type !== "sovereignEntity") {
      Logger.error(this, "Type is not sovereignEntity");
      return;
    }
    switch (wbMeta.version) {
      case "0.0.1": {
        this.name = fm.name;
        this.geography = {
          size: fm.geography.size,
          sizeUnit: fm.geography.sizeUnit,
          landFertility: fm.geography.landFertility,
          landFertilityUnit: fm.geography.landFertilityUnit,
          cultivatedLand: fm.geography.cultivatedLand,
          cultivatedLandUnit: fm.geography.cultivatedLandUnit,
          generation: {
            method: fm.geography.generation.method,
            unit: fm.geography.generation.unit,
          },
          territories: fm.geography.territories,
          settlements: fm.geography.settlements,
        };
        this.demographics = {
          lifeExpectancy: fm.demographics.lifeExpectancy,
          populationGrowthRate: fm.demographics.populationGrowthRate,
        };
        this.culture = {
          firstNameOrigin: fm.culture.firstNameOrigin,
          lastNameOrigin: fm.culture.lastNameOrigin,
          territoryNameOrigin: fm.culture.territoryNameOrigin,
          settlementNameOrigin: fm.culture.settlementNameOrigin,
        };
        this.species = fm.species;
        this.languages = fm.languages;
        this.staticDatasets = fm.staticDatasets;
        this.wbMeta = fm.wbMeta;
        break;
      }
    }
  }
}
