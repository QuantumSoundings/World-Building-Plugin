import { Logger } from "src/util/Logger";
import { SettlementEntityConfiguration } from "./settlementEntityConfiguration";
import { SovereignEntityConfiguration } from "./sovereignEntityConfiguration";
import { WBFrontMatter, WBMetaDataEnum } from "./types/meta";

export class FMUtils {
  static validateWBEntityType(fm: any): boolean {
    if (fm === null) return false;
    if (!fm.hasOwnProperty("wbEntityType")) return false;
    if (fm.wbEntityType === undefined) return false;
    return true;
  }

  static convertFMToEntityConfiguration(fm: any) {
    if (!this.validateWBEntityType(fm)) {
      return undefined;
    }
    const wbFM = fm as WBFrontMatter;
    switch (wbFM.wbEntityType.toLowerCase()) {
      case WBMetaDataEnum.sovereignEntity: {
        return new SovereignEntityConfiguration(fm);
      }
      case WBMetaDataEnum.settlementEntity: {
        return new SettlementEntityConfiguration(fm);
      }
      default: {
        Logger.error(this, "Unknown entity type: " + fm["wbEntityType"]);
        return undefined;
      }
    }
  }
}
