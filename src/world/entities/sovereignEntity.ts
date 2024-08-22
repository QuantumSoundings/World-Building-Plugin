import { SovereignEntityConfiguration } from "src/frontmatter/sovereignEntityConfiguration";
import WorldBuildingPlugin from "src/main";
import { Logger } from "src/util/Logger";
import { BaseEntity } from "./shared";
import { MapUtils } from "src/util/maps";

export class SovereignEntity implements BaseEntity {
  name: string;
  plugin: WorldBuildingPlugin;
  filePath: string;
  configuration: SovereignEntityConfiguration;

  // Update Flags
  updateUsingMap: boolean = false;
  resolvedSize: number = 0;

  // Values calculated on update
  population: number = 0;

  constructor(plugin: WorldBuildingPlugin, configuration: SovereignEntityConfiguration) {
    this.plugin = plugin;
    this.updateConfiguration(configuration);
  }

  public updateConfiguration(configuration: SovereignEntityConfiguration) {
    this.configuration = configuration;
    if (typeof configuration.geography.size === "string") {
      if (configuration.geography.size.toLowerCase() === "map") {
        this.updateUsingMap = true;
      }
    }
    this.update();
  }

  public update() {
    this.calculateMapSize();
    this.calculatePopulation();
  }

  private calculateMapSize() {
    if (this.updateUsingMap) {
      const nationData = this.plugin.configManager.configs.nations.values.find(
        (predicate) => predicate.nationName === this.configuration.name
      );
      if (nationData === undefined) {
        Logger.error(this, "Nation Data not found.");
        return;
      }
      const map = this.plugin.configManager.configs.mapConfigurations.values.find(
        (predicate) => predicate.mapName === nationData.mapName
      );
      if (map === undefined) {
        Logger.error(this, "Map Configuration not found.");
        return;
      }
      this.resolvedSize = MapUtils.calculateArea(map, nationData.nationSizePercent);
    }
  }

  private calculatePopulation() {
    // Population Information
    const size = this.resolvedSize;
    const cultivatedLand = size * (this.configuration.geography.cultivatedLandPercentage / 100.0);
    const landFertility = this.configuration.geography.landFertility;

    this.population = cultivatedLand * landFertility;
  }
}
