import { Type, plainToClass } from "class-transformer";
import { CSVManager } from "src/dataManagers/csvManager";
import { defaultPopulationDensityData } from "src/defaultData";
import { BaseError } from "src/errors/baseError";
import { Result } from "src/errors/result";
import WorldBuildingPlugin from "src/main";
import { LogLevel, logger } from "src/util";

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

  public saveDefaultData() {
    const fullPath = this.plugin.settings.dataDirectory + "/default_population_density_data.csv";
    this.plugin.csvManager.writeFile(fullPath, defaultPopulationDensityData, { header: true });
  }

  reloadData() {
    let newData = JSON.parse(this.defaultDataString);
    // If we are overriding the default data, load the new data from the manager.
    if (this.plugin.settings.populationDensityData !== "") {
      const overrideDataPath = this.plugin.settings.dataDirectory + "/" + this.plugin.settings.populationDensityData;
      const overrideData = this.plugin.csvManager.getDataByFile(overrideDataPath);
      if (overrideData === undefined) {
        logger(this, LogLevel.Error, "Could not load override data.");
        return;
      }
      newData = CSVManager.csvToPojoWithIncludedHeaders(overrideData);
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
        const convertedMin = unitConversionAPI.convertUnit(density.minPopulation, density.areaUnit, areaUnit);
        const convertedMax = unitConversionAPI.convertUnit(density.maxPopulation, density.areaUnit, areaUnit);
        if (min === undefined) {
          logger(
            this,
            LogLevel.Error,
            "Could not convert min population density from " + density.areaUnit + " to " + areaUnit
          );
          continue;
        } else if (max === undefined) {
          logger(
            this,
            LogLevel.Error,
            "Could not convert max population density from " + density.areaUnit + " to " + areaUnit
          );
          continue;
        } else {
          min = convertedMin as number;
          max = convertedMax as number;
        }
      }

      if (populationDensity >= min && populationDensity < max) {
        return { success: true, result: density.descriptor };
      }
    }
    return { success: false, error: new BaseError("Could not find a descriptor for the given population density") };
  }
}
