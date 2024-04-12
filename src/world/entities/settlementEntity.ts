import WorldBuildingPlugin from "src/main";
import { SettlementEntityConfiguration } from "src/frontmatter/settlementEntityConfiguration";
import { Logger } from "src/util/Logger";
import { DataUtils } from "src/data/dataUtils";
import { MappableEntity } from "./shared";

export class SettlementEntity implements MappableEntity {
  name: string;
  plugin: WorldBuildingPlugin;
  filePath: string;
  map: {
    name: string;
    relX: number;
    relY: number;
    type: string;
  };
  configuration: SettlementEntityConfiguration;

  // Values calculated on update
  population: number;

  constructor(plugin: WorldBuildingPlugin, initialFrontMatter: any) {
    this.plugin = plugin;
    this.updateConfiguration(initialFrontMatter);
  }

  public updateConfiguration(newFrontMatter: any) {
    this.configuration = new SettlementEntityConfiguration(newFrontMatter);
    this.name = this.configuration.name;
    this.map = {
      name: this.configuration.map.name,
      relX: this.configuration.map.relX,
      relY: this.configuration.map.relY,
      type: this.configuration.demographics.settlementType,
    };
    const settlementPopulation = DataUtils.generateSettlementPopulation(
      this.configuration.demographics.settlementType,
      this.configuration.demographics.populationScale
    );
    if (settlementPopulation === undefined) {
      Logger.error(this, "Failed to generate population for settlement");
      return;
    }
    this.population = settlementPopulation;
  }
}
