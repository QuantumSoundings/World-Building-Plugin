import { BaseConfiguration, Distribution } from "./types/shared";
import { WBMetaDataEnum } from "./types/meta";

export class SovereignEntityConfiguration implements BaseConfiguration {
  name: string;
  wbEntityType: WBMetaDataEnum;

  geography: {
    size: number | string;
    landFertility: number;
    cultivatedLandPercentage: number;
    territories: {
      type: string;
      value: number;
      parentTerritory: string;
    }[];
    settlements: Distribution[];
  };

  constructor(fm: any) {
    this.name = fm.name;
    this.wbEntityType = WBMetaDataEnum.sovereignEntity;
    this.geography = {
      size: fm.geography.size,
      landFertility: fm.geography.landFertility,
      cultivatedLandPercentage: fm.geography.cultivatedLandPercentage,
      territories: fm.geography.territories,
      settlements: fm.geography.settlements,
    };
  }
}
