import { SettlementType } from "src/defaultData";
import WorldBuildingPlugin from "src/main";
import { FormatUtils } from "src/util/format";
import { Logger } from "src/util/Logger";

export class SettlementAPI {
  plugin: WorldBuildingPlugin;

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
  }

  findSettlementDataByType(type: string): SettlementType | undefined {
    return this.plugin.userOverrideData.settlementTypeData.find((settlement) => settlement.type === type);
  }

  generateSettlementPopulation(settlementType: string, populationScale: number): number | undefined {
    const settlementData = this.findSettlementDataByType(settlementType);
    if (settlementData === undefined) {
      Logger.error(this, "Could not find settlement data for type: " + settlementType);
      return 0;
    }
    return this.generatePopulation(settlementData, populationScale);
  }

  private generatePopulation(settlementData: SettlementType, populationScale: number): number {
    switch (settlementData.distributionType) {
      case "gaussian":
        return FormatUtils.generateGaussianValue(
          settlementData.minPopulation,
          settlementData.maxPopulation,
          populationScale
        );
      default:
        return NaN;
    }
  }
}
