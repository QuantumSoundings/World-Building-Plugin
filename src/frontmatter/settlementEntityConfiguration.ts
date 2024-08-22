import { BaseConfiguration } from "./types/shared";
import { WBMetaDataEnum } from "./types/meta";

export class SettlementEntityConfiguration implements BaseConfiguration {
  name: string;
  wbEntityType: WBMetaDataEnum;

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

  constructor(fm: any) {
    this.name = fm.name;
    this.wbEntityType = WBMetaDataEnum.settlementEntity;
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
  }
}
