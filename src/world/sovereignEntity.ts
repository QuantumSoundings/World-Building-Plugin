import { SovereignEntityConfiguration } from "src/frontmatter/sovereignEntityConfiguration";
import WorldBuildingPlugin from "src/main";
import { Logger } from "src/util/Logger";
import { BaseEntity } from "./worldEngine";
import { DataUtils } from "src/data/dataUtils";
import { PSDUtils } from "src/util/psd";

export class SovereignEntity implements BaseEntity {
  name: string;
  plugin: WorldBuildingPlugin;
  filePath: string;
  configuration: SovereignEntityConfiguration;

  // Update Flags
  updateUsingMap: boolean;

  // Values calculated on update
  population: number;

  constructor(plugin: WorldBuildingPlugin, initialFrontMatter: any) {
    this.plugin = plugin;

    this.updateConfiguration(initialFrontMatter);
  }

  public updateConfiguration(newFrontMatter: any) {
    this.updateUsingMap = newFrontMatter.geography.size === "MAP";
    if (this.updateUsingMap) {
      newFrontMatter.geography.size = 0;
    }
    this.configuration = new SovereignEntityConfiguration(newFrontMatter);
    this.update();
  }

  public update() {
    this.calculateMapSize();
    this.calculatePopulation();
  }

  private calculateMapSize() {
    if (this.updateUsingMap) {
      const mapFile = this.plugin.psdManager.findMapFileByCountry(this.configuration.name);
      if (mapFile.success === false) {
        Logger.error(this, mapFile.error.message);
        return;
      }
      const countryDataResult = this.plugin.psdManager.findCountryData(this.configuration.name);
      if (countryDataResult.success === false) {
        Logger.error(this, countryDataResult.error.message);
        return;
      }
      const map = this.plugin.configManager.configs.mapConfigurations.values.find(
        (predicate) => predicate.mapName === mapFile.result.name
      );
      if (map === undefined) {
        Logger.error(this, "Map Configuration not found.");
        return;
      }
      this.configuration.geography.size = PSDUtils.calculateArea(map, countryDataResult.result);
    }
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
      const result = DataUtils.convertUnit(cultivatedLand, cultivatedLandUnit, sizeUnit);
      if (result.success === false) {
        return;
      }
      cultivatedLand = result.result;
    }

    if (landFertilityUnit !== sizeUnit) {
      const result = DataUtils.convertUnit(landFertility, landFertilityUnit, sizeUnit);
      if (result.success === false) {
        return;
      }
      landFertility = result.result;
    }

    this.population = cultivatedLand * landFertility;
  }
}
