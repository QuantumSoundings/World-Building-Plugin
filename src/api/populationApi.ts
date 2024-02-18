import { Type, plainToClass } from "class-transformer";
import { CSVManager } from "src/dataManagers/csvManager";
import { defaultPopulationDensityData } from "src/defaultData";
import { BaseError } from "src/errors/baseError";
import { Result } from "src/errors/result";
import WorldBuildingPlugin from "src/main";

export class PopulationDensity {
  descriptor: string;
  @Type(() => Number)
  minPopulation: number;
  @Type(() => Number)
  maxPopulation: number;
  areaUnit: string;
}

export class PopulationAPI {
  plugin: WorldBuildingPlugin;
  defaultDataString: string;
  data: PopulationDensity[];

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
    this.defaultDataString = JSON.stringify(defaultPopulationDensityData);
    this.data = [];
  }

  reloadData(overrideDataPath: string) {
    let newData = JSON.parse(this.defaultDataString);
    // If we are overriding the default data, load the new data from the manager.
    if (overrideDataPath !== "") {
      const overrideDataResult = this.plugin.csvManager.getDataByFile(overrideDataPath);
      if (overrideDataResult.success === true) {
        newData = CSVManager.csvToPojoWithIncludedHeaders(overrideDataResult.result);
      }
    }

    // We are ready to apply the new data. Clear the old and add the new.
    this.data = [];
    for (const newDataEntry of newData) {
      const newDataClassInstance = plainToClass(PopulationDensity, newDataEntry);
      this.data.push(newDataClassInstance);
    }
  }

  getDescriptorForPopulation(populationDensity: number, areaUnit: string): Result<string> {
    const unitConversionAPI = this.plugin.getUnitConversionAPI();
    for (const density of this.data) {
      let min = density.minPopulation;
      let max = density.maxPopulation;
      if (density.areaUnit !== areaUnit) {
        const convertedMinResult = unitConversionAPI.convertUnit(density.minPopulation, density.areaUnit, areaUnit);
        const convertedMaxResult = unitConversionAPI.convertUnit(density.maxPopulation, density.areaUnit, areaUnit);
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
}
