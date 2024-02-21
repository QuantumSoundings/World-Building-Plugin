import { Type, plainToClass } from "class-transformer";
import { defaultUnitConversionData } from "src/defaultData";
import { BaseError } from "src/errors/baseError";
import { Result } from "src/errors/result";
import WorldBuildingPlugin from "src/main";

export class ConversionFactor {
  toUnit: string;
  @Type(() => Number)
  factor: number;
}

export class Unit {
  name: string;
  symbol: string;

  @Type(() => ConversionFactor)
  conversionFactors: ConversionFactor[];
}

export class UnitConversionAPI {
  plugin: WorldBuildingPlugin;
  defaultDataString: string;
  data: Unit[];

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
    this.defaultDataString = JSON.stringify(defaultUnitConversionData);
    this.data = [];
  }

  async reloadData(overrideDataPath: string) {
    let newData = JSON.parse(this.defaultDataString);
    // If we are overriding the default data, load the new data from the manager.
    if (this.plugin.settings.unitConversionDataOverridePath !== "") {
      //const overrideDataResult = this.plugin.yamlManager.getDataByFile(overrideDataPath);
      //if (overrideDataResult.success === true) {
      //  newData = overrideDataResult.result;
      //}
      const fm = await this.plugin.frontMatterManager.getFrontMatter(overrideDataPath);
      if (fm.hasOwnProperty("units")) {
        newData = fm["units"];
      }
    }

    // We are ready to apply the new data. Clear the old and add the new.
    this.data = [];
    for (const newDataEntry of newData) {
      const newDataClassInstance = plainToClass(Unit, newDataEntry);
      this.data.push(newDataClassInstance);
    }
  }

  convertUnit(value: number, fromUnit: string, toUnit: string): Result<number> {
    const fromUnitData = this.data.find((unit) => unit.name === fromUnit);
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

  getSymbolForUnit(unitName: string): Result<string> {
    const unitData = this.data.find((unit) => unit.name === unitName);
    if (unitData === undefined) {
      return { success: false, error: new BaseError("Could not find unit data for unit: " + unitName) };
    }
    return { success: true, result: unitData.symbol };
  }
}
