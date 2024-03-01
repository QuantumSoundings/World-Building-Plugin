import { BaseError } from "src/errors/baseError";
import { Result } from "src/errors/result";
import WorldBuildingPlugin from "src/main";
import { UnitUtils } from "src/util/unit";

export class PopulationAPI {
  plugin: WorldBuildingPlugin;

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
  }

  getDescriptorForPopulation(populationDensity: number, areaUnit: string): Result<string> {
    for (const density of this.plugin.userOverrideData.populationDensityData) {
      let min = density.minPopulation;
      let max = density.maxPopulation;
      if (density.areaUnit !== areaUnit) {
        const convertedMinResult = UnitUtils.convertUnit(
          this.plugin,
          density.minPopulation,
          density.areaUnit,
          areaUnit
        );
        const convertedMaxResult = UnitUtils.convertUnit(
          this.plugin,
          density.maxPopulation,
          density.areaUnit,
          areaUnit
        );
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
