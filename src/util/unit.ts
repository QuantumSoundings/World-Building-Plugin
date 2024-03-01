import { BaseError } from "src/errors/baseError";
import { Result } from "src/errors/result";
import WorldBuildingPlugin from "src/main";

export class UnitUtils {
  public static convertUnit(
    plugin: WorldBuildingPlugin,
    value: number,
    fromUnit: string,
    toUnit: string
  ): Result<number> {
    const fromUnitData = plugin.userOverrideData.unitData.find((unit) => unit.name === fromUnit);
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

  public static getSymbolForUnit(plugin: WorldBuildingPlugin, unitName: string): Result<string> {
    const unitData = plugin.userOverrideData.unitData.find((unit) => unit.name === unitName);
    if (unitData === undefined) {
      return { success: false, error: new BaseError("Could not find unit data for unit: " + unitName) };
    }
    return { success: true, result: unitData.symbol };
  }
}
