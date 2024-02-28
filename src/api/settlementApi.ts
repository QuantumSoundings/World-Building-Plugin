import { SettlementType } from "src/defaultData";
import WorldBuildingPlugin from "src/main";
import { FormatUtils } from "src/util/format";
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
        return FormatUtils.generateGaussianValue(settlementData.minPopulation, settlementData.maxPopulation, 1.0);
      default:
        return NaN;
    }
  }
}
