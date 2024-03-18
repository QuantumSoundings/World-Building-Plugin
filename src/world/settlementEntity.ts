import WorldBuildingPlugin from "src/main";
import { BaseEntity } from "./worldEngine";

export class SettlementEntity implements BaseEntity {
  plugin: WorldBuildingPlugin;
  filePath: string;
  configuration: any; //SettlementEntityConfiguration;

  constructor(plugin: WorldBuildingPlugin, initialFrontMatter: any) {
    this.plugin = plugin;
    this.updateConfiguration(initialFrontMatter);
  }

  public updateConfiguration(newFrontMatter: any) {
    this.configuration = newFrontMatter;
  }
}
