import WorldBuildingPlugin from "src/main";
import { SettlementEntityConfiguration } from "src/frontmatter/settlementEntityConfiguration";
import { Logger } from "src/util/Logger";
import { DataUtils } from "src/data/dataUtils";
import { MappableEntity } from "./shared";
import { PointOfInterest } from "src/data/dataTypes";

export class SettlementEntity implements MappableEntity {
  name: string;
  plugin: WorldBuildingPlugin;
  filePath: string;

  configuration: SettlementEntityConfiguration;

  // Values calculated on update
  population: number;

  constructor(plugin: WorldBuildingPlugin, initialFrontMatter: any) {
    this.plugin = plugin;
    this.updateConfiguration(initialFrontMatter);
  }

  public getMapPointOfInterest(): PointOfInterest {
    const poi = new PointOfInterest(null);
    poi.label = this.name;
    poi.link = `[[${this.name}]]`;
    poi.mapIcon = "castle";
    poi.mapName = this.configuration.pointOfInterest.mapName;
    poi.relX = this.configuration.pointOfInterest.relX;
    poi.relY = this.configuration.pointOfInterest.relY;
    return poi;
  }

  public updateConfiguration(newFrontMatter: any) {
    this.configuration = new SettlementEntityConfiguration(newFrontMatter);
    this.name = this.configuration.name;
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
