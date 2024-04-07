import WorldBuildingPlugin from "src/main";
import { BaseEntity } from "./worldEngine";
import { SettlementEntityConfiguration } from "src/frontmatter/settlementEntityConfiguration";
import { Logger } from "src/util/Logger";

export class SettlementEntity implements BaseEntity {
  plugin: WorldBuildingPlugin;
  filePath: string;
  configuration: SettlementEntityConfiguration;

  // Values calculated on update
  population: number;

  constructor(plugin: WorldBuildingPlugin, initialFrontMatter: any) {
    this.plugin = plugin;
    this.updateConfiguration(initialFrontMatter);
  }

  public updateConfiguration(newFrontMatter: any) {
    this.configuration = new SettlementEntityConfiguration(newFrontMatter);

    const settlementPopulation = this.plugin
      .getSettlementAPI()
      .generateSettlementPopulation(
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
