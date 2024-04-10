import { Logger } from "src/util/Logger";
import { BaseConfiguration, WBMetaData } from "./sharedConfiguration";

export class SettlementEntityConfiguration implements BaseConfiguration {
  name: string;

  demographics: {
    settlementType: string;
    populationScale: number;
  };

  map: {
    name: string;
    relX: number;
    relY: number;
  };

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
    if (!("wbMeta" in fm)) {
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
        this.map = {
          name: fm.map.name,
          relX: fm.map.relX,
          relY: fm.map.relY,
        };
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
