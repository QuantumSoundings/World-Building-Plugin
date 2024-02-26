import { BaseError } from "src/errors/baseError";
import { Result } from "src/errors/result";
import WorldBuildingPlugin from "src/main";

export class PopulationAPI {
  plugin: WorldBuildingPlugin;

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
  }

  getDescriptorForPopulation(populationDensity: number, areaUnit: string): Result<string> {
    const unitConversionAPI = this.plugin.getUnitConversionAPI();
    for (const density of this.plugin.userOverrideData.populationData) {
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
