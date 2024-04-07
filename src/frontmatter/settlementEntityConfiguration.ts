import { Logger } from "src/util/Logger";
import { BaseConfiguration, MapInfo, WBMetaData } from "./sharedConfiguration";

export class SettlementEntityConfiguration implements BaseConfiguration {
  name: string;

  demographics: {
    settlementType: string;
    populationScale: number;
  };

  map: MapInfo;

  relations: {
    parentEntity: string;
    rulingParty: string;
  };

  overrides: {
    culture: {
      firstNameOrigin: string;
      lastNameOrigin: string;
    };
  };

  wbMeta: WBMetaData;

  constructor(fm: any | null) {
    if (fm === null) {
      Logger.warn(this, "Creating a blank SettlementEntityConfiguration");
      return;
    }
    if (!fm.hasOwnProperty("wbMeta")) {
      Logger.error(this, "Failed to find wbMeta in SettlementEntityConfiguration");
      return;
    }
    const wbMeta = fm.wbMeta as WBMetaData;
    if (wbMeta.type !== "settlementEntity") {
      Logger.error(this, "Type is not settlementEntity");
      return;
    }
    switch (wbMeta.version) {
      case "0.0.1": {
        this.name = fm.name;
        this.demographics = {
          settlementType: fm.demographics.settlementType,
          populationScale: fm.demographics.populationScale,
        };
        this.map = fm.map;
        this.relations = {
          parentEntity: fm.relations.parentEntity,
          rulingParty: fm.relations.rulingParty,
        };
        this.overrides = {
          culture: {
            firstNameOrigin: fm.overrides.culture.firstNameOrigin,
            lastNameOrigin: fm.overrides.culture.lastNameOrigin,
          },
        };
        this.wbMeta = fm.wbMeta;
        break;
      }
    }
  }
}
