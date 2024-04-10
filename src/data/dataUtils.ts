import { BaseError } from "src/errors/baseError";
import { Result } from "src/errors/result";
import WorldBuildingPlugin from "src/main";
import { SettlementType } from "./defaultData";
import { Logger } from "src/util/Logger";
import { FormatUtils } from "src/util/format";

export class DataUtils {
  static plugin: WorldBuildingPlugin | null;
  public static setPlugin(plugin: WorldBuildingPlugin) {
    DataUtils.plugin = plugin;
  }

  private static getPlugin(): WorldBuildingPlugin {
    if (DataUtils.plugin === null) {
      throw new BaseError("Plugin not set in DataUtils");
    }
    return DataUtils.plugin;
  }

  public static convertUnit(value: number, fromUnit: string, toUnit: string): Result<number> {
    const fromUnitData = DataUtils.getPlugin().dataManager.unitData.find((unit) => unit.name === fromUnit);
    if (fromUnitData === undefined) {
      return { success: false, error: new BaseError("Could not find unit data for unit: " + fromUnit) };
    }
    const conversionFactor = fromUnitData.conversionFactors.find((factor) => factor.toUnit === toUnit);
    if (conversionFactor === undefined) {
      return {
        success: false,
        error: new BaseError("Could not find conversion factor from " + fromUnit + " to " + toUnit),
      };
    }
    return { success: true, result: value * conversionFactor.factor };
  }

  public static getSymbolForUnit(unitName: string): Result<string> {
    const unitData = DataUtils.getPlugin().dataManager.unitData.find((unit) => unit.name === unitName);
    if (unitData === undefined) {
      return { success: false, error: new BaseError("Could not find unit data for unit: " + unitName) };
    }
    return { success: true, result: unitData.symbol };
  }

  public static getDescriptorForPopulation(populationDensity: number, areaUnit: string): Result<string> {
    for (const density of DataUtils.getPlugin().dataManager.populationDensityData) {
      let min = density.minPopulation;
      let max = density.maxPopulation;
      if (density.areaUnit !== areaUnit) {
        const convertedMinResult = DataUtils.convertUnit(density.minPopulation, density.areaUnit, areaUnit);
        const convertedMaxResult = DataUtils.convertUnit(density.maxPopulation, density.areaUnit, areaUnit);
        if (convertedMinResult.success === false) {
          continue;
        } else if (convertedMaxResult.success === false) {
          continue;
        } else {
          min = convertedMinResult.result as number;
          max = convertedMaxResult.result as number;
        }
      }

      if (populationDensity >= min && populationDensity < max) {
        return { success: true, result: density.descriptor };
      }
    }
    return { success: false, error: new BaseError("Could not find a descriptor for the given population density") };
  }

  public static findSettlementDataByType(type: string): SettlementType | undefined {
    return DataUtils.getPlugin().dataManager.settlementTypeData.find((settlement) => settlement.type === type);
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
