import { SettlementType } from "src/dataManagers/userOverrideData";
import WorldBuildingPlugin from "src/main";
import { Utils } from "src/util";
import { Logger } from "src/util/Logger";

export class Settlement {
  type: string;
  name: string;
  population: number;
}

export class SettlementAPI {
  plugin: WorldBuildingPlugin;

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
  }

  findSettlementDataByType(type: string): SettlementType | undefined {
    return this.plugin.userOverrideData.settlementTypeData.find((settlement) => settlement.type === type);
  }

  generateSettlement(type: string): Settlement | undefined {
    const settlementData = this.findSettlementDataByType(type);
    if (settlementData === undefined) {
      Logger.error(this, "Could not find settlement data for type: " + type);
      return undefined;
    }
    const settlement = new Settlement();
    settlement.type = settlementData.type;
    //settlement.name = this.generateName(settlementData);
    settlement.population = this.generatePopulation(settlementData);
    return settlement;
  }

  private generatePopulation(settlementData: SettlementType): number {
    switch (settlementData.distributionType) {
      case "gaussian":
        return Utils.generateGaussianValue(settlementData.minPopulation, settlementData.maxPopulation, 1.0);
      default:
        return NaN;
    }
  }
}
