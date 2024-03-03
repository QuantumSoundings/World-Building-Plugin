import WorldBuildingPlugin from "src/main";

export class SettlementEntity {
  plugin: WorldBuildingPlugin;
  configuration: any; //SettlementEntityConfiguration;

  constructor(plugin: WorldBuildingPlugin, initialFrontMatter: any) {
    this.plugin = plugin;
    this.updateConfiguration(initialFrontMatter);
  }

  public updateConfiguration(newFrontMatter: any) {
    this.configuration = newFrontMatter;
  }
}
