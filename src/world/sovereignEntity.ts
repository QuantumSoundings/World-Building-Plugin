import { SovereignEntityConfiguration } from "src/frontmatter/sovereignEntityConfiguration";
import WorldBuildingPlugin from "src/main";
import { Logger } from "src/util/Logger";
import { UnitUtils } from "src/util/unit";

export class SovereignEntity {
  plugin: WorldBuildingPlugin;
  yamlProperties: any;
  configuration: SovereignEntityConfiguration;

  // Derived Values
  population: number;

  constructor(plugin: WorldBuildingPlugin, frontMatter: any) {
    this.plugin = plugin;

    if (frontMatter.geography.size === "MAP") {
      const countryDataResult = this.plugin.psdManager.findCountryData(frontMatter.name);
      if (countryDataResult.success === false) {
        Logger.error(this, countryDataResult.error.message);
        return;
      }
      const fmCopy = JSON.parse(JSON.stringify(frontMatter));
      fmCopy.geography.size = countryDataResult.result.unitArea;
      this.configuration = new SovereignEntityConfiguration(fmCopy);
    } else {
      this.configuration = new SovereignEntityConfiguration(frontMatter);
    }

    this.calculatePopulation();
  }

  private calculatePopulation() {
    // Population Information
    const size = this.configuration.geography.size;
    const sizeUnit = this.configuration.geography.sizeUnit;

    let cultivatedLand = this.configuration.geography.cultivatedLand;
    const cultivatedLandUnit = this.configuration.geography.cultivatedLandUnit;

    let landFertility = this.configuration.geography.landFertility;
    const landFertilityUnit = this.configuration.geography.landFertilityUnit;

    // Convert cultivatedLand and LandFertility to the same unit as size.
    if (cultivatedLandUnit === "Percent") {
      cultivatedLand = size * (cultivatedLand / 100);
    } else if (cultivatedLandUnit !== sizeUnit) {
      const result = UnitUtils.convertUnit(this.plugin, cultivatedLand, cultivatedLandUnit, sizeUnit);
      if (result.success === false) {
        return;
      }
      cultivatedLand = result.result;
    }

    if (landFertilityUnit !== sizeUnit) {
      const result = UnitUtils.convertUnit(this.plugin, landFertility, landFertilityUnit, sizeUnit);
      if (result.success === false) {
        return;
      }
      landFertility = result.result;
    }

    this.population = cultivatedLand * landFertility;
  }
}
