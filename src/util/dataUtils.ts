import WorldBuildingPlugin from "src/main";
import { SettlementType } from "../types/dataTypes";
import { Logger } from "src/util/Logger";

export class DataUtils {
  static plugin: WorldBuildingPlugin | null;
  public static setPlugin(plugin: WorldBuildingPlugin) {
    DataUtils.plugin = plugin;
  }

  private static getPlugin(): WorldBuildingPlugin {
    if (DataUtils.plugin === null) {
      throw new Error("Plugin not set in DataUtils");
    }
    return DataUtils.plugin;
  }

  public static convertUnit(value: number, fromUnit: string, toUnit: string): number | undefined {
    const fromUnitData = DataUtils.getPlugin().dataManager.datasets.unit.live.find((unit) => unit.name === fromUnit);
    if (fromUnitData === undefined) {
      return undefined;
    }
    const conversionFactor = fromUnitData.conversionFactors.find((factor) => factor.toUnit === toUnit);
    if (conversionFactor === undefined) {
      return undefined;
    }
    return value * conversionFactor.factor;
  }

  public static getSymbolForUnit(unitName: string): string | undefined {
    const unitData = DataUtils.getPlugin().dataManager.datasets.unit.live.find((unit) => unit.name === unitName);
    if (unitData === undefined) {
      return undefined;
    }
    return unitData.symbol;
  }

  public static getDescriptorForPopulation(populationDensity: number, areaUnit: string): string | undefined {
    for (const density of DataUtils.getPlugin().dataManager.datasets.populationDensity.live) {
      let min = density.minPopulation;
      let max = density.maxPopulation;
      if (density.areaUnit !== areaUnit) {
        const convertedMinResult = DataUtils.convertUnit(density.minPopulation, density.areaUnit, areaUnit);
        const convertedMaxResult = DataUtils.convertUnit(density.maxPopulation, density.areaUnit, areaUnit);
        if (convertedMinResult === undefined) {
          continue;
        } else if (convertedMaxResult === undefined) {
          continue;
        } else {
          min = convertedMinResult;
          max = convertedMaxResult;
        }
      }

      if (populationDensity >= min && populationDensity < max) {
        return density.descriptor;
      }
    }
    return undefined;
  }

  public static findSettlementDataByType(type: string): SettlementType | undefined {
    return DataUtils.getPlugin().dataManager.datasets.settlementType.live.find(
      (settlement) => settlement.type === type
    );
  }

  public static generateSettlementPopulation(settlementType: string, populationScale: number): number | undefined {
    const settlementData = DataUtils.findSettlementDataByType(settlementType);
    if (settlementData === undefined) {
      Logger.error(this, "Could not find settlement data for type: " + settlementType);
      return 0;
    }
    return DataUtils.generatePopulation(settlementData, populationScale);
  }

  private static generatePopulation(settlementData: SettlementType, populationScale: number): number {
    const population =
      ((settlementData.maxPopulation - settlementData.minPopulation) * (populationScale - 0)) / (1 - 0) +
      settlementData.minPopulation;
    return population;
    /*switch (settlementData.distributionType) {
      case "gaussian":
        return FormatUtils.generateGaussianValue(
          settlementData.minPopulation,
          settlementData.maxPopulation,
          populationScale
        );
      default:
        return NaN;
    }
        */
  }
}
