import { Logger } from "src/util/Logger";
import { BaseConfiguration } from "./types/shared";
import { WBMetaData } from "./types/meta";

export class SettlementEntityConfiguration implements BaseConfiguration {
  name: string;

  demographics: {
    settlementType: string;
    populationScale: number;
  };

  pointOfInterest: {
    mapName: string;
    relX: number;
    relY: number;
    icon: string;
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
        this.pointOfInterest = {
          mapName: fm.pointOfInterest.mapName,
          relX: fm.pointOfInterest.relX,
          relY: fm.pointOfInterest.relY,
          icon: fm.pointOfInterest.icon,
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
